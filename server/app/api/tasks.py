from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.core.config import TZ
from app.models.item import Item, Subtask, BacklogSubtask
from app.repositories import json_store as store
from app.services.tasks import TaskNote, TaskEdit, polish_task

router = APIRouter(prefix='/api/tasks', tags=['tasks'])
subtask_router = APIRouter(prefix='/api/items', tags=['subtasks'])


@router.post('', status_code=201)
async def create_task(payload: TaskNote):
    title, source, priority = await polish_task(payload.note)
    with store.LOCK:
        items = store.read()
        item = {**Item(kind='task', title=title, priority=priority).model_dump(mode='json'),
                'id': str(uuid4()), 'created_at': datetime.now(TZ).isoformat(), 'reminder_sent': None}
        items.append(item)
        store.write(items)
    return {'item': item, 'source': source}


@router.patch('/{task_id}/title')
async def rename_task(task_id: str, payload: TaskEdit):
    parent = next((item for item in store.read() if item['id'] == task_id and item['kind'] == 'task'), None)
    if parent is None:
        raise HTTPException(404, 'Task not found')
    if payload.priority is not None and payload.note == parent['title']:
        title, source, priority = parent['title'], 'manual', payload.priority
    else:
        title, source, priority = await polish_task(payload.note, current_priority=parent.get('priority', 'medium'))
    with store.LOCK:
        items = store.read()
        for item in items:
            if item['id'] == task_id and item['kind'] == 'task':
                item.update(title=title, priority=payload.priority or priority)
                store.write(items)
                return {'item': item, 'source': source}
    raise HTTPException(404, 'Task not found')


@router.post('/{task_id}/subtasks', status_code=201)
@subtask_router.post('/{task_id}/subtasks', status_code=201)
async def add_subtask(task_id: str, payload: TaskNote):
    parent = next((item for item in store.read() if item['id'] == task_id and item['kind'] in ('task', 'backlog')), None)
    if parent is None:
        raise HTTPException(404, 'Task not found')
    options = {'backlog_subtask': True} if parent['kind'] == 'backlog' else {}
    title, _, _ = await polish_task(payload.note, parent_title=parent['title'], **options)
    with store.LOCK:
        items = store.read()
        for item in items:
            if item['id'] == task_id and item['kind'] in ('task', 'backlog'):
                step = BacklogSubtask(description=title, created_at=datetime.now(TZ)) if item['kind'] == 'backlog' else Subtask(title=title, created_at=datetime.now(TZ))
                item.setdefault('subtasks', []).append(step.model_dump(mode='json'))
                item['status'] = 'open'
                store.write(items)
                return item
    raise HTTPException(404, 'Task not found')


@router.patch('/{task_id}/subtasks/{subtask_id}/title')
@subtask_router.patch('/{task_id}/subtasks/{subtask_id}/title')
@subtask_router.patch('/{task_id}/subtasks/{subtask_id}/description')
async def rename_subtask(task_id: str, subtask_id: str, payload: TaskNote):
    parent = next((item for item in store.read() if item['id'] == task_id and item['kind'] in ('task', 'backlog')), None)
    if parent is None or not any(step['id'] == subtask_id for step in parent.get('subtasks', [])):
        raise HTTPException(404, 'Subtask not found')
    options = {'backlog_subtask': True} if parent['kind'] == 'backlog' else {}
    title, _, _ = await polish_task(payload.note, parent_title=parent['title'], **options)
    with store.LOCK:
        items = store.read()
        for item in items:
            if item['id'] == task_id and item['kind'] in ('task', 'backlog'):
                for step in item.get('subtasks', []):
                    if step['id'] == subtask_id:
                        step['description' if item['kind'] == 'backlog' else 'title'] = title
                        store.write(items)
                        return item
    raise HTTPException(404, 'Subtask not found')

