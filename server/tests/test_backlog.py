import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.repositories import json_store as store


class BacklogTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store_patch = patch.object(store, 'DATA', Path(self.temp.name) / 'store.json')
        self.store_patch.start()
        self.env_patch = patch.dict(os.environ, {'OPENAI_API_KEY': ''})
        self.env_patch.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.env_patch.stop()
        self.store_patch.stop()
        self.temp.cleanup()

    def create(self):
        result = self.client.post('/api/backlog', json={'note': 'Low priority: improve the release process. Document the current pain points.'})
        self.assertEqual(result.status_code, 201)
        return result.json()['item']

    def test_backlog_creation_has_description_priority_and_no_due_date(self):
        item = self.create()
        self.assertEqual(item['priority'], 'low')
        self.assertIn('pain points', item['description'])
        self.assertIsNone(item['date'])
        saved = store.read()[0]
        self.assertEqual(set(saved), {'id', 'kind', 'title', 'description', 'priority', 'status', 'created_at', 'subtasks'})
        self.assertEqual(self.client.get('/api/calendar').json()['events'], [])

    def test_description_only_subtasks_edit_complete_and_empty_parent(self):
        item = self.create()
        url = '/api/items/' + item['id']
        note = 'Gather release notes.\nRecord the recurring problems.'
        added = self.client.post(url + '/subtasks', json={'note': note})
        self.assertEqual(added.status_code, 201)
        item = added.json()
        step = item['subtasks'][0]
        self.assertEqual(step['description'], note)
        self.assertNotIn('title', step)
        renamed = self.client.patch(url + '/subtasks/' + step['id'] + '/description', json={'note': 'Review the recurring problems.\nSuggest improvements.'})
        self.assertEqual(renamed.status_code, 200)
        item = renamed.json()
        self.assertEqual(item['subtasks'][0]['created_at'], step['created_at'])
        item['subtasks'][0]['done'] = True
        item = self.client.put(url, json=item).json()
        self.assertEqual(item['status'], 'done')
        empty = self.client.put(url, json={**item, 'subtasks': []}).json()
        self.assertEqual(empty['status'], 'open')
        self.assertEqual(empty['subtasks'], [])
        self.assertEqual(empty['description'], item['description'])

    def test_subtask_polishing_returns_description_not_title(self):
        item = self.create()
        response = httpx.Response(200, request=httpx.Request('POST', 'https://api.openai.com/v1/chat/completions'),
            json={'choices': [{'message': {'content': '{"description":"Document recurring release issues and their impact."}'}}]})
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}), patch('app.services.tasks.httpx.AsyncClient.post', new=AsyncMock(return_value=response)) as post:
            result = self.client.post('/api/items/' + item['id'] + '/subtasks', json={'note': 'write recurring problems and impact'})
        self.assertEqual(result.status_code, 201)
        saved = store.read()[0]['subtasks'][0]
        self.assertEqual(saved['description'], 'Document recurring release issues and their impact.')
        self.assertNotIn('title', saved)
        self.assertIn('There is no title field', post.call_args.kwargs['json']['messages'][0]['content'])

    def test_legacy_subtask_titles_are_preserved_as_descriptions(self):
        item = self.create()
        step = {'id': 'legacy', 'title': 'Keep the useful context', 'done': False}
        result = self.client.put('/api/items/' + item['id'], json={**item, 'subtasks': [step]}).json()
        self.assertEqual(result['subtasks'][0]['description'], step['title'])
        self.assertNotIn('title', result['subtasks'][0])
        nested = {**result, 'subtasks': [{**result['subtasks'][0], 'subtasks': []}]}
        self.assertEqual(self.client.put('/api/items/' + item['id'], json=nested).status_code, 422)

    def test_task_subtasks_still_require_titles(self):
        result = self.client.post('/api/items', json={'kind': 'task', 'title': 'Review notes', 'subtasks': [{'description': 'Not a task subtask title'}]})
        self.assertEqual(result.status_code, 422)
