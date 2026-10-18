import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.repositories import json_store as store
from app.services import jira


class SkillTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store_patch = patch.object(store, 'DATA', Path(self.temp.name) / 'store.json')
        self.store_patch.start()
        self.env_patch = patch.dict(os.environ, {'JIRA_BASE_URL': 'https://jira.example.test/jira', 'JIRA_TOKEN': 'test-only-token-not-a-credential', 'JIRA_AUTH_MODE': 'bearer'})
        self.env_patch.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.env_patch.stop()
        self.store_patch.stop()
        self.temp.cleanup()

    def transport(self, handler):
        original = httpx.AsyncClient
        return patch.object(jira.httpx, 'AsyncClient', side_effect=lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))

    def test_skill_example_and_crud_persist_without_credentials(self):
        data = self.client.get('/api/skills').json()
        self.assertTrue(data['jira_configured'])
        self.assertEqual(data['skills'][0]['project'], '')
        self.assertEqual(data['skills'][0]['release'], '')
        self.assertNotIn('test-only-token-not-a-credential', json.dumps(data))
        payload = {'name': 'Release notes', 'instructions': 'Group release issues by component.'}
        created = self.client.post('/api/skills', json=payload)
        self.assertEqual(created.status_code, 201)
        item = created.json()
        self.assertEqual(self.client.put('/api/skills/' + item['id'], json={**payload, 'name': 'Updated'}).json()['name'], 'Updated')
        self.assertEqual(self.client.delete('/api/skills/' + item['id']).status_code, 204)
        self.assertEqual(len(self.client.get('/api/skills').json()['skills']), 1)
        self.assertNotIn('test-only-token-not-a-credential', Path(self.temp.name, 'skills.json').read_text())

    def test_run_paginates_and_groups_components(self):
        requests = []
        def handler(request):
            requests.append(request)
            self.assertEqual(request.headers['Authorization'], 'Bearer test-only-token-not-a-credential')
            self.assertEqual(request.url.path, '/jira/rest/api/2/search')
            offset = int(request.url.params['startAt'])
            components = [{'id': '10', 'name': 'API'}, {'id': '20', 'name': 'Web'}] if offset == 0 else []
            return httpx.Response(200, json={'total': 2, 'issues': [{'key': f'EXAMPLE-{offset + 1}', 'fields': {'summary': 'Release work', 'status': {'name': 'Done'}, 'components': components}}]})
        with self.transport(handler):
            response = self.client.post('/api/skills/release-components/run', json={'project': 'EXAMPLE', 'release': '1.0.0'})
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(len(requests), 2)
        self.assertEqual(result['issue_count'], 2)
        self.assertEqual([group['name'] for group in result['components']], ['API', 'Web'])
        self.assertEqual(result['unassigned'][0]['key'], 'EXAMPLE-2')
        self.assertEqual(result['components'][0]['issues'][0]['url'], 'https://jira.example.test/jira/browse/EXAMPLE-1')
        self.assertIn('project = "EXAMPLE" AND fixVersion = "1.0.0"', result['jql'])
        self.assertNotIn('{{project}}', result['instructions'])

    def test_errors_hide_upstream_secrets_and_validate_parameters(self):
        with self.transport(lambda request: httpx.Response(401, text='test-only-token-not-a-credential')):
            response = self.client.post('/api/skills/release-components/run', json={'project': 'EXAMPLE', 'release': '1.0.0'})
        self.assertEqual(response.status_code, 502)
        self.assertNotIn('test-only-token-not-a-credential', response.text)
        invalid = self.client.post('/api/skills/release-components/run', json={'project': 'EXAMPLE OR 1=1', 'release': '1.0.0'})
        self.assertEqual(invalid.status_code, 422)
        with patch.dict(os.environ, {'JIRA_TOKEN': ''}):
            self.assertEqual(self.client.post('/api/skills/release-components/run', json={'project': 'EXAMPLE', 'release': '1.0.0'}).status_code, 503)

    def test_release_is_escaped_and_repeated_page_fails_clearly(self):
        self.assertEqual(jira.jql_string('6.4" OR project = OTHER'), '"6.4\\" OR project = OTHER"')
        def handler(request):
            return httpx.Response(200, json={'total': 3, 'issues': [{'key': 'EXAMPLE-1', 'fields': {}}]})
        with self.transport(handler):
            response = self.client.post('/api/skills/release-components/run', json={'project': 'EXAMPLE', 'release': '1.0.0'})
        self.assertEqual(response.status_code, 502)

    def test_instruction_only_skill_is_not_arbitrarily_executed(self):
        skill = self.client.post('/api/skills', json={'name': 'Notes', 'instructions': 'Do some work.'}).json()
        self.assertEqual(self.client.post(f"/api/skills/{skill['id']}/run", json={'project': 'EXAMPLE', 'release': '1.0.0'}).status_code, 422)

    def test_credentials_are_not_sent_over_plain_http(self):
        with patch.dict(os.environ, {'JIRA_BASE_URL': 'http://jira.example.test'}):
            self.assertFalse(jira.jira_config()[-1])
            self.assertEqual(self.client.post('/api/skills/release-components/run', json={'project': 'EXAMPLE', 'release': '1.0.0'}).status_code, 503)
