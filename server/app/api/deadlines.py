from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from app.core.config import TZ
from app.models.item import Item, Note
from app.repositories import json_store as store
from app.services.polishing import polish
from app.services.tasks import TaskNote
from app.services.deadlines import note_date, note_reminder

router = APIRouter(prefix='/api/deadlines', tags=['deadlines'])


@router.post('', status_code=201)
async def create_deadline(payload: TaskNote):
    result = await polish(Note(kind='deadline', note=payload.note))
    due = result.get('date')
    if result['source'] == 'manual':
        due = note_date(payload.note, datetime.now(TZ).date())
        result['reminder_days'] = note_reminder(payload.note)
    if not due:
        raise HTTPException(422, 'Include a clear due date, such as upcoming Thursday or 2026-10-22. Your note has not been saved.')
    try:
        item = Item(kind='deadline', **{
            key: value for key, value in {**result, 'date': due}.items()
            if key in ('title', 'description', 'date', 'person', 'priority', 'reminder_days')
        }).model_dump(mode='json')
    except ValidationError:
        raise HTTPException(422, 'Check the deadline details and reminder interval (0–365 days). Your note has not been saved.') from None
    with store.LOCK:
        items = store.read()
        item.update(id=str(uuid4()), created_at=datetime.now(TZ).isoformat(), reminder_sent=None)
        items.append(item)
        store.write(items)
    return {'item': item, 'source': result['source']}
