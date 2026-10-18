import tempfile
import json
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.repositories import json_store as store


class CalendarTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.mock = patch.object(store, 'DATA', Path(self.temp.name) / 'store.json')
        self.mock.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.mock.stop()
        self.temp.cleanup()

    def save(self, **changes):
        return self.client.post('/api/calendar/changes', json=changes)

    def test_timed_event_round_trip_update_and_delete(self):
        event = {'id': 'native-1', 'title': 'Review fixes', 'description': 'Discuss static analysis findings.',
                 'start': '2026-10-21T10:00:00', 'end': '2026-10-21T11:30:00', 'calendarId': 'events',
                 'meta': {'location': 'Meeting room', 'custom': {'links': ['example']}},
                 'conference': {'joinUrl': 'https://meet.example.test/demo'}}
        self.assertEqual(self.save(upsert=[event]).status_code, 200)
        self.assertEqual(self.save(upsert=[event]).status_code, 200)
        self.assertEqual(len(store.read()), 1)
        item = self.client.get('/api/items').json()[0]
        self.assertEqual(item['date'], '2026-10-21')
        restored = self.client.get('/api/calendar').json()['events'][0]
        self.assertEqual(restored['start'], event['start'])
        self.assertEqual(restored['meta'], event['meta'])
        self.assertEqual(restored['conference'], event['conference'])
        event.update(title='Updated review', end='2026-10-21T12:00:00')
        self.save(upsert=[event])
        self.assertEqual(store.read()[0]['title'], 'Updated review')
        self.save(delete=['native-1'])
        self.assertEqual(store.read(), [])

    def test_existing_deadline_keeps_kind_and_reminder_fields(self):
        item = self.client.post('/api/items', json={'kind': 'deadline', 'title': 'Follow up', 'date': '2026-10-21', 'person': 'the reviewer', 'reminder_days': 2}).json()
        original = self.client.get('/api/calendar').json()['events'][0]
        self.assertTrue(original['allDay'])
        self.assertEqual(original['end'], '2026-10-22')
        self.save(upsert=[{**original, 'start': '2026-10-23', 'end': '2026-10-25'}])
        restored = store.read()[0]
        self.assertEqual(restored['id'], item['id'])
        self.assertEqual(restored['kind'], 'deadline')
        self.assertEqual(restored['person'], 'the reviewer')
        self.assertEqual(restored['reminder_days'], 2)
        self.assertEqual(restored['date'], '2026-10-23')
        self.assertEqual(self.client.get('/api/calendar').json()['events'][0]['end'], '2026-10-25')

    def test_new_deadline_appears_alongside_unchanged_native_events(self):
        event = {'id': 'keep-event', 'title': 'Release meeting', 'description': 'Discuss readiness',
                 'start': '2026-10-21T10:00:00', 'end': '2026-10-21T11:00:00',
                 'calendarId': 'events', 'meta': {'location': 'Meeting room'}}
        self.save(upsert=[event])
        original = self.client.get('/api/calendar').json()['events'][0]
        event_record = store.read()[0]
        deadline = self.client.post('/api/items', json={'kind': 'deadline', 'title': 'Confirm release sign-off',
                         'description': 'Follow up with QA', 'date': '2026-10-22'}).json()
        result = self.client.get('/api/calendar').json()['events']
        self.assertEqual(len(result), 2)
        self.assertEqual(next(value for value in result if value['id'] == event['id']), original)
        projected = next(value for value in result if value['id'] == deadline['id'])
        self.assertEqual(projected['calendarId'], 'deadlines')
        self.assertTrue(projected['allDay'])
        self.assertEqual(projected['start'], '2026-10-22')
        self.assertEqual(projected['end'], '2026-10-23')
        self.assertEqual(store.read()[0], event_record)

    def test_old_calendar_settings_restore_deadline_category_without_changing_events(self):
        settings = {'calendars': [{'id': 'events', 'name': 'My events', 'isVisible': False,
                                  'colors': {'lineColor': '#123456'}}], 'groups': ['Personal']}
        path = store.DATA.with_name('calendars.json')
        path.write_text(json.dumps(settings), encoding='utf-8')
        result = self.client.get('/api/calendar').json()
        self.assertEqual(result['calendars'][0], settings['calendars'][0])
        self.assertEqual(result['calendars'][1]['id'], 'deadlines')
        self.assertTrue(result['calendars'][1]['isVisible'])
        self.assertEqual(result['groups'], settings['groups'])

    def test_settings_are_saved_and_backlog_is_excluded(self):
        settings = self.client.get('/api/calendar').json()
        settings['calendars'][0].update(name='Personal', isVisible=False)
        settings['groups'] = ['Work']
        self.assertEqual(self.client.put('/api/calendar/settings', json=settings).status_code, 200)
        loaded = self.client.get('/api/calendar').json()
        self.assertEqual(loaded['calendars'][0]['name'], 'Personal')
        self.assertFalse(loaded['calendars'][0]['isVisible'])
        self.assertEqual(loaded['groups'], ['Work'])
        self.client.post('/api/items', json={'kind': 'backlog', 'title': 'Later', 'date': '2026-10-21'})
        self.assertEqual(self.client.get('/api/calendar').json()['events'], [])

    def test_invalid_range_does_not_write_partial_batch(self):
        event = {'id': 'bad', 'title': 'Invalid', 'start': '2026-10-21T12:00:00', 'end': '2026-10-21T10:00:00'}
        self.assertEqual(self.save(upsert=[event]).status_code, 422)
        self.assertEqual(store.read(), [])
        event.update(start='2026-10-21T10:00:00+05:30', end='2026-10-21T12:00:00')
        self.assertEqual(self.save(upsert=[event]).status_code, 422)
