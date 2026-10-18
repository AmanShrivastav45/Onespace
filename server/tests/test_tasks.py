import os
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, patch
import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.repositories import json_store as store


class TaskTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store_patch = patch.object(store, 'DATA', Path(self.temp.name) / 'store.json')
        self.store_patch.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.store_patch.stop()
        self.temp.cleanup()

    def create(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
            return self.client.post('/api/tasks', json={'note': '  Review\n the release notes  '})

    def test_subtask_creation_and_edit_use_prompt_with_parent_context(self):
        item = self.create().json()['item']
        response = httpx.Response(200, request=httpx.Request('POST', 'https://api.openai.com/v1/chat/completions'),
                                 json={'choices': [{'message': {'content': '{"title":"Verify QA sign-off"}'}}]})
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}), patch('app.services.tasks.httpx.AsyncClient.post', new=AsyncMock(return_value=response)) as post:
            result = self.client.post('/api/tasks/' + item['id'] + '/subtasks', json={'note': 'check QA signoff please'})
            self.assertEqual(result.status_code, 201)
            step = result.json()['subtasks'][0]
            self.assertEqual(step['title'], 'Verify QA sign-off')
            messages = post.call_args.kwargs['json']['messages']
            self.assertIn('rough subtask note', messages[0]['content'])
            self.assertIn(item['title'], messages[1]['content'])
            self.assertIn('check QA signoff please', messages[1]['content'])
            edited = self.client.patch('/api/tasks/' + item['id'] + '/subtasks/' + step['id'] + '/title', json={'note': 'check revised QA signoff'})
            self.assertEqual(edited.status_code, 200)
            self.assertEqual(edited.json()['subtasks'][0]['created_at'], step['created_at'])
            self.assertEqual(edited.json()['subtasks'][0]['done'], step['done'])
            self.assertEqual(post.await_count, 2)

    def test_subtask_polishing_failure_does_not_change_store(self):
        item = self.create().json()['item']
        with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
            added = self.client.post('/api/tasks/' + item['id'] + '/subtasks', json={'note': 'Check QA notes'}).json()
        before = store.read()
        with patch('app.api.tasks.polish_task', new=AsyncMock(side_effect=HTTPException(502, 'Polishing unavailable'))):
            self.assertEqual(self.client.post('/api/tasks/' + item['id'] + '/subtasks', json={'note': 'Another rough note'}).status_code, 502)
            self.assertEqual(self.client.patch('/api/tasks/' + item['id'] + '/subtasks/' + added['subtasks'][0]['id'] + '/title', json={'note': 'Revised rough note'}).status_code, 502)
        self.assertEqual(store.read(), before)

    def test_task_has_one_line_timestamp_and_no_deadline(self):
        response = self.create()
        self.assertEqual(response.status_code, 201)
        item = response.json()['item']
        self.assertEqual(item['title'], 'Review the release notes')
        self.assertEqual(item['description'], '')
        self.assertIsNone(item['date'])
        self.assertIsNotNone(datetime.fromisoformat(item['created_at']).tzinfo)
        self.assertEqual(self.client.get('/api/calendar').json()['events'], [])
        updated = self.client.put('/api/items/' + item['id'], json={**item, 'status': 'done', 'date': '2026-11-01', 'description': 'Discard this description'}).json()
        self.assertIsNone(updated['date'])
        self.assertEqual(updated['description'], '')
        self.assertEqual(updated['created_at'], item['created_at'])

    def test_task_uses_backend_polishing_and_edit_preserves_timestamp(self):
        with patch('app.api.tasks.polish_task', new=AsyncMock(return_value=('Review release notes', 'ai', 'medium'))) as polish:
            response = self.client.post('/api/tasks', json={'note': 'rough note to polish'})
            polish.assert_awaited_once_with('rough note to polish')
            item = response.json()['item']
            edited = self.client.patch('/api/tasks/' + item['id'] + '/title', json={'note': 'edit rough note'}).json()['item']
        self.assertEqual(response.json()['source'], 'ai')
        self.assertEqual(edited['created_at'], item['created_at'])

    def test_subtasks_are_flat_and_saved_under_parent(self):
        item = self.create().json()['item']
        result = self.client.post('/api/tasks/' + item['id'] + '/subtasks', json={'note': ' Check\n QA notes '})
        self.assertEqual(result.status_code, 201)
        subtask = result.json()['subtasks'][0]
        self.assertEqual(subtask['title'], 'Check QA notes')
        self.assertFalse(subtask['done'])
        self.assertIsNotNone(datetime.fromisoformat(subtask['created_at']).tzinfo)
        renamed = self.client.put('/api/items/' + item['id'], json={
            **result.json(), 'subtasks': [{**subtask, 'title': 'Review QA notes'}]
        }).json()['subtasks'][0]
        self.assertEqual(renamed['title'], 'Review QA notes')
        self.assertEqual(renamed['created_at'], subtask['created_at'])
        invalid = {**result.json(), 'subtasks': [{**subtask, 'subtasks': [{'title': 'Nested'}]}]}
        self.assertEqual(self.client.put('/api/items/' + item['id'], json=invalid).status_code, 422)

    def test_completion_follows_subtasks_and_new_subtask_reopens_task(self):
        item = self.create().json()['item']
        url = '/api/items/' + item['id']
        subtask_url = '/api/tasks/' + item['id'] + '/subtasks'
        item = self.client.post(subtask_url, json={'note': 'Check release notes'}).json()
        item = self.client.post(subtask_url, json={'note': 'Check QA results'}).json()
        item['subtasks'][0]['done'] = True
        item = self.client.put(url, json=item).json()
        self.assertEqual(item['status'], 'open')
        item['subtasks'][1]['done'] = True
        item = self.client.put(url, json=item).json()
        self.assertEqual(item['status'], 'done')
        item['subtasks'][0]['done'] = False
        item = self.client.put(url, json=item).json()
        self.assertEqual(item['status'], 'open')
        item['subtasks'][0]['done'] = True
        item = self.client.put(url, json=item).json()
        self.assertEqual(item['status'], 'done')
        item = self.client.post(subtask_url, json={'note': 'Check deployment'}).json()
        self.assertEqual(item['status'], 'open')
        self.assertEqual(self.client.get('/api/items').json()[-1]['status'], 'open')

    def test_standalone_task_completion_is_manual(self):
        item = self.create().json()['item']
        self.assertEqual(item['status'], 'open')
        url = '/api/items/' + item['id']
        item = self.client.put(url, json={**item, 'status': 'done'}).json()
        self.assertEqual(item['status'], 'done')
        item = self.client.put(url, json={**item, 'status': 'open'}).json()
        self.assertEqual(item['status'], 'open')

    def test_removing_last_subtask_leaves_parent_open_and_empty(self):
        for completed in (False, True):
            with self.subTest(completed=completed):
                item = self.create().json()['item']
                url = '/api/items/' + item['id']
                item = self.client.post('/api/tasks/' + item['id'] + '/subtasks', json={'note': 'Review checklist'}).json()
                item['subtasks'][0]['done'] = completed
                item = self.client.put(url, json=item).json()
                emptied = self.client.put(url, json={**item, 'subtasks': []})
                self.assertEqual(emptied.status_code, 200)
                self.assertEqual(emptied.json()['status'], 'open')
                self.assertEqual(emptied.json()['subtasks'], [])
                saved = next(task for task in store.read() if task['id'] == item['id'])
                self.assertEqual(saved['title'], item['title'])
                self.assertEqual(saved['status'], 'open')
                self.assertEqual(saved['subtasks'], [])
    def test_priority_defaults_inference_and_manual_edit(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
            for phrase, expected in [('Review notes', 'medium'), ('High priority task: review notes', 'high'), ('Review notes, low-priority', 'low')]:
                item = self.client.post('/api/tasks', json={'note': phrase}).json()['item']
                self.assertEqual(item['priority'], expected)
            item = self.client.patch('/api/tasks/' + item['id'] + '/title', json={'note': 'Review the revised notes'}).json()['item']
            self.assertEqual(item['priority'], 'low')
            before = item.copy()
            with patch('app.api.tasks.polish_task', new=AsyncMock()) as polish:
                edited = self.client.patch('/api/tasks/' + item['id'] + '/title', json={'note': item['title'], 'priority': 'high'}).json()['item']
                polish.assert_not_awaited()
            self.assertEqual(edited['priority'], 'high')
            self.assertEqual(edited['created_at'], before['created_at'])
            self.assertEqual(edited['subtasks'], before['subtasks'])
            self.assertEqual(self.client.patch('/api/tasks/' + item['id'] + '/title', json={'note': item['title'], 'priority': 'urgent'}).status_code, 422)

    def test_llm_priority_is_saved_and_invalid_priority_is_rejected(self):
        response = httpx.Response(200, request=httpx.Request('POST', 'https://api.openai.com/v1/chat/completions'),
                                 json={'choices': [{'message': {'content': '{"title":"Review QA findings","priority":"high"}'}}]})
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}), patch('app.services.tasks.httpx.AsyncClient.post', new=AsyncMock(return_value=response)):
            item = self.client.post('/api/tasks', json={'note': 'Review QA findings, high priority'}).json()['item']
            self.assertEqual(item['priority'], 'high')
            self.assertEqual(store.read()[0]['priority'], 'high')
            before = store.read()
            response = httpx.Response(200, request=httpx.Request('POST', 'https://api.openai.com/v1/chat/completions'),
                                     json={'choices': [{'message': {'content': '{"title":"Review QA findings","priority":"urgent"}'}}]})
            with patch('app.services.tasks.httpx.AsyncClient.post', new=AsyncMock(return_value=response)):
                self.assertEqual(self.client.post('/api/tasks', json={'note': 'Review QA findings'}).status_code, 502)
            self.assertEqual(store.read(), before)

    def test_task_store_keeps_only_used_fields_after_create_and_update(self):
        item = self.create().json()['item']
        expected = {'id', 'kind', 'title', 'status', 'priority', 'created_at', 'subtasks'}
        self.assertEqual(set(store.read()[0]), expected)
        added = self.client.post('/api/tasks/' + item['id'] + '/subtasks', json={'note': 'Check deployment'}).json()
        self.client.put('/api/items/' + item['id'], json={**added, 'priority': 'high', 'person': 'Unused'})
        saved = store.read()[0]
        self.assertEqual(set(saved), expected)
        self.assertEqual(set(saved['subtasks'][0]), {'id', 'title', 'done', 'created_at'})
        visible = self.client.get('/api/items').json()[0]
        self.assertEqual(visible['subtasks'], saved['subtasks'])
        self.assertEqual(visible['description'], '')
