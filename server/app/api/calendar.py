from fastapi import APIRouter
from app.core.config import TZ
from app.models.calendar import CalendarChanges, CalendarSettings
from app.repositories import json_store as store
from app.services.calendar import apply_changes, item_to_event, read_settings, write_settings

router = APIRouter(prefix='/api/calendar', tags=['calendar'])


@router.get('')
def get_calendar():
    with store.LOCK:
        return {**read_settings(), 'timeZone': str(TZ), 'events': [event for item in store.read() if (event := item_to_event(item))]}


@router.post('/changes')
def change_events(changes: CalendarChanges):
    apply_changes(changes)
    return {'ok': True}


@router.put('/settings')
def save_settings(settings: CalendarSettings):
    write_settings(settings)
    return settings
