import os
import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path
from unittest.mock import AsyncMock, patch
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.repositories import json_store as store
from app.core.config import TZ
from app.services.deadlines import note_date


class DeadlineTests(unittest.TestCase):
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

    def test_single_note_creates_deadline_with_date_description_and_priority(self):
        note = 'High priority: review static analysis fixes upcoming Thursday. Confirm QA results. Remind me 2 days before.'
        result = self.client.post('/api/deadlines', json={'note': note})
        self.assertEqual(result.status_code, 201)
        item = result.json()['item']
        self.assertEqual(item['priority'], 'high')
        self.assertEqual(item['date'], note_date(note, datetime.now(TZ).date()).isoformat())
        self.assertEqual(item['description'], note)
        self.assertEqual(item['reminder_days'], 2)
        self.assertEqual(item['subtasks'], [])
        self.assertEqual(store.read()[0]['id'], item['id'])
        event = self.client.get('/api/calendar').json()['events'][0]
        self.assertEqual(event['start'], item['date'])
        self.assertEqual(event['description'], note)

    def test_missing_invalid_dates_and_invalid_reminder_do_not_save(self):
        for note in ('Review release notes', 'Review notes on 2026-02-30', 'Review notes tomorrow, remind me 500 days before'):
            self.assertEqual(self.client.post('/api/deadlines', json={'note': note}).status_code, 422)
        self.assertEqual(store.read(), [])

    def test_llm_polishes_title_and_description_with_dedicated_prompt(self):
        response = httpx.Response(200, request=httpx.Request('POST', 'https://api.openai.com/v1/chat/completions'),
            json={'choices': [{'message': {'content': '{"title":"Review static analysis fixes","description":"Confirm outstanding issues with the reviewer.","date":"2026-10-22","person":"the reviewer","priority":"high","reminder_days":3}'}}]})
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}), patch('app.services.polishing.httpx.AsyncClient.post', new=AsyncMock(return_value=response)) as post:
            result = self.client.post('/api/deadlines', json={'note': 'High priority review static analysis fixes upcoming Thursday with the reviewer'})
        self.assertEqual(result.status_code, 201)
        self.assertEqual(result.json()['source'], 'ai')
        self.assertEqual(result.json()['item']['description'], 'Confirm outstanding issues with the reviewer.')
        self.assertEqual(result.json()['item']['date'], '2026-10-22')
        self.assertIn('Deadlines do not have subtasks', post.call_args.kwargs['json']['messages'][0]['content'])

    def test_deadlines_cannot_have_subtasks_and_completion_is_manual(self):
        item = self.client.post('/api/items', json={'kind': 'deadline', 'title': 'Review notes', 'date': '2026-10-22', 'subtasks': [{'title': 'Ignored step'}]}).json()
        self.assertEqual(item['subtasks'], [])
        url = '/api/items/' + item['id']
        self.assertEqual(self.client.post(url + '/subtasks', json={'note': 'Another step'}).status_code, 404)
        completed = self.client.put(url, json={**item, 'status': 'done'}).json()
        self.assertEqual(completed['status'], 'done')
        self.assertEqual(completed['date'], item['date'])

    def test_relative_dates_and_year_boundary(self):
        self.assertEqual(note_date('upcoming Thursday', date(2026, 10, 18)), date(2026, 10, 22))
        self.assertEqual(note_date('next Thursday', date(2026, 10, 22)), date(2026, 10, 29))
        self.assertEqual(note_date('tomorrow', date(2026, 12, 31)), date(2027, 1, 1))
        self.assertEqual(note_date('today', date(2026, 12, 31)), date(2026, 12, 31))
