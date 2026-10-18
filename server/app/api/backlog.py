from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter
from app.core.config import TZ
from app.models.item import Item, Note
from app.repositories import json_store as store
from app.services.polishing import polish
from app.services.tasks import TaskNote

router = APIRouter(prefix='/api/backlog', tags=['backlog'])


@router.post('', status_code=201)
async def create_backlog(payload: TaskNote):
    result = await polish(Note(kind='backlog', note=payload.note))
    item = Item(kind='backlog', **{key: value for key, value in result.items()
                if key in ('title', 'description', 'priority', 'person')}).model_dump(mode='json')
    with store.LOCK:
        items = store.read()
        item.update(id=str(uuid4()), created_at=datetime.now(TZ).isoformat())
        items.append(item)
        store.write(items)
    return {'item': item, 'source': result['source']}
