import os
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.core.config import TZ
from app.models.item import Item, Note
from app.repositories import json_store as store
from app.services.polishing import polish

router = APIRouter(prefix="/api")

@router.get('/health')
def health():
    return {'ok': True, 'ai_configured': bool(os.getenv('OPENAI_API_KEY')), 'email_configured': all(bool(os.getenv(k)) for k in ['SMTP_HOST', 'SMTP_FROM', 'REMINDER_EMAIL'])}

@router.get('/items')
def list_items():
    # Shared UI views still consume the common Item shape. Task storage stays compact.
    return [{**item, **Item(**item).model_dump(mode='json')} if item.get('kind') in ('task', 'backlog') else item
            for item in store.read()]

@router.post('/items', status_code=201)
def create_item(payload: Item):
    if payload.kind in ('deadline', 'event') and payload.date is None:
        raise HTTPException(422, 'A date is required for deadlines and events')
    with store.LOCK:
        items = store.read()
        item = {**payload.model_dump(mode='json'), 'id': str(uuid4()), 'created_at': datetime.now(TZ).isoformat(), 'reminder_sent': None}
        items.append(item)
        store.write(items)
        return item

@router.put('/items/{item_id}')
def update_item(item_id: str, payload: Item):
    if payload.kind in ('deadline', 'event') and payload.date is None:
        raise HTTPException(422, 'A date is required for deadlines and events')
    with store.LOCK:
        items = store.read()
        for i, old in enumerate(items):
            if old['id'] == item_id:
                new = payload.model_dump(mode='json')
                if new['kind'] in ('task', 'backlog') and old.get('subtasks') and not new['subtasks']:
                    new['status'] = 'open'
                if new.get('dayflow') and new['dayflow']['start'][:10] != new['date']:
                    new['dayflow'] = None
                reset = any(old.get(k) != new.get(k) for k in ['date', 'reminder_days'])
                items[i] = {**old, **new, 'reminder_sent': None if reset else old.get('reminder_sent')}
                store.write(items)
                return items[i]
    raise HTTPException(404, 'Item not found')

@router.delete('/items/{item_id}', status_code=204)
def delete_item(item_id: str):
    with store.LOCK:
        items = store.read()
        if not any(x['id'] == item_id for x in items):
            raise HTTPException(404, 'Item not found')
        store.write([x for x in items if x['id'] != item_id])


router.add_api_route("/polish", polish, methods=["POST"])
