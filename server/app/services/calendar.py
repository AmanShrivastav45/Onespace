import json
from datetime import date, datetime, timedelta
from app.core.config import TZ
from app.models.calendar import CalendarChanges, CalendarSettings
from app.models.item import Item
from app.repositories import json_store as store


def default_settings():
    colors = [('events', 'Events', '#699a81', '#eaf4ee', '#d2e7da', '#436952'),
              ('deadlines', 'Deadlines', '#9574ba', '#f1eaf8', '#e3d4f1', '#755492'),
              ]
    return {'calendars': [{'id': key, 'name': name, 'isVisible': True,
                          'colors': dict(zip(['lineColor', 'eventColor', 'eventSelectedColor', 'textColor'], palette))}
                         for key, name, *palette in colors], 'groups': []}


def read_settings():
    path = store.DATA.with_name('calendars.json')
    with store.LOCK:
        settings = json.loads(path.read_text(encoding='utf-8')) if path.exists() else default_settings()
        # Older or customized settings may not contain the deadline calendar.
        if not any(calendar['id'] == 'deadlines' for calendar in settings['calendars']):
            settings['calendars'].append(default_settings()['calendars'][1])
        return settings


def write_settings(settings: CalendarSettings):
    path = store.DATA.with_name('calendars.json')
    with store.LOCK:
        path.parent.mkdir(exist_ok=True)
        temporary = path.with_suffix('.tmp')
        temporary.write_text(json.dumps(settings.model_dump(mode='json'), indent=2), encoding='utf-8')
        temporary.replace(path)


def item_to_event(item):
    if not item.get('date') or item['kind'] in ('backlog', 'task'):
        return None
    event = item.get('dayflow')
    # A date changed on the task/deadline page becomes a date-only entry.
    if not event or event['start'][:10] != item['date']:
        event = {'start': item['date'], 'end': (date.fromisoformat(item['date']) + timedelta(days=1)).isoformat(),
                 'allDay': True, 'calendarId': {'event': 'events', 'deadline': 'deadlines', 'task': 'tasks'}[item['kind']]}
    return {**event, 'id': item['id'], 'title': item['title'], 'description': item['description']}


def apply_changes(changes: CalendarChanges):
    with store.LOCK:
        items = store.read()
        by_id = {item['id']: item for item in items}
        for event in changes.upsert:
            previous = by_id.get(event.id)
            kind = previous['kind'] if previous else {'deadlines': 'deadline'}.get(event.calendarId, 'event')
            payload = {**(previous or {}), 'kind': kind, 'title': event.title,
                       'description': event.description, 'date': event.start[:10],
                       'dayflow': event.model_dump(mode='json', exclude_none=True)}
            validated = Item.model_validate(payload).model_dump(mode='json')
            reset = previous and previous['date'] != validated['date']
            by_id[event.id] = {**(previous or {}), **validated, 'id': event.id,
                               'created_at': previous.get('created_at') if previous else datetime.now(TZ).isoformat(),
                               'reminder_sent': None if reset or not previous else previous.get('reminder_sent')}
        for item_id in changes.delete:
            by_id.pop(item_id, None)
        store.write(list(by_id.values()))
