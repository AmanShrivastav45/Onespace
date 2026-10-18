import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
import os
from app.main import app
from app.repositories import json_store as store
from app.services import reminders

class ApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = patch.object(store, 'DATA', Path(self.tmp.name) / 'store.json')
        self.store.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.store.stop()
        self.tmp.cleanup()

    def test_deadline_persists_and_updates(self):
        payload = {'kind': 'deadline', 'title': 'Follow up with the reviewer', 'date': '2026-10-21', 'person': 'the reviewer', 'reminder_days': 3}
        response = self.client.post('/api/items', json=payload)
        self.assertEqual(response.status_code, 201)
        item = response.json()
        self.assertEqual(store.read()[0]['date'], '2026-10-21')
        self.assertEqual(self.client.get('/api/items').json()[0]['id'], item['id'])
        item['status'] = 'done'
        self.assertEqual(self.client.put('/api/items/' + item['id'], json=item).json()['status'], 'done')
        self.assertEqual(self.client.delete('/api/items/' + item['id']).status_code, 204)
        self.assertEqual(store.read(), [])

    def test_invalid_deadline_and_subtasks(self):
        self.assertEqual(self.client.post('/api/items', json={'kind': 'deadline', 'title': 'Missing date'}).status_code, 422)
        item = self.client.post('/api/items', json={'kind': 'task', 'title': 'Release', 'subtasks': [{'title': 'Verify fixes', 'done': True}]}).json()
        self.assertTrue(item['subtasks'][0]['done'])
        self.assertTrue(item['subtasks'][0]['id'])

    def test_manual_fallback(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
            result = self.client.post('/api/polish', json={'kind': 'task', 'note': 'Check release notes'}).json()
        self.assertEqual(result['source'], 'manual')
        self.assertEqual(result['description'], 'Check release notes')

    def test_polishing_errors_do_not_log_note_contents(self):
        from unittest.mock import AsyncMock
        import httpx
        response = httpx.Response(200, request=httpx.Request('POST', 'https://api.openai.com/v1/chat/completions'),
            json={'choices': [{'message': {'content': '{"title": {"private_note": "confidential-test-content"}}'}}]})
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-only-key'}), patch('app.services.polishing.httpx.AsyncClient.post', new=AsyncMock(return_value=response)), self.assertLogs(level='WARNING') as captured:
            result = self.client.post('/api/polish', json={'kind': 'backlog', 'note': 'confidential-test-content'})
        self.assertEqual(result.status_code, 502)
        self.assertNotIn('confidential-test-content', '\n'.join(captured.output))

    def test_reminder_is_sent_only_once(self):
        self.client.post('/api/items', json={'kind': 'deadline', 'title': 'Follow up', 'date': '2020-01-01'})
        with patch.dict(os.environ, {'SMTP_HOST': 'mail.test', 'SMTP_FROM': 'from@test', 'REMINDER_EMAIL': 'to@test', 'SMTP_USER': ''}), patch.object(reminders.smtplib, 'SMTP') as smtp:
            reminders.send_reminders()
            reminders.send_reminders()
            self.assertEqual(smtp.return_value.__enter__.return_value.send_message.call_count, 1)
        self.assertTrue(store.read()[0]['reminder_sent'])

if __name__ == '__main__':
    unittest.main()
