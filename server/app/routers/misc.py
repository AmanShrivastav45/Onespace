from fastapi import APIRouter, HTTPException

from ..models.common import ChecklistItemCreate, ChecklistItemUpdate, ReorderItem
from ..models.misc import MiscTask, MiscTaskCreate, MiscTaskUpdate
from ..services import misc_service

router = APIRouter(prefix="/api/misc", tags=["misc"])


@router.get("", response_model=list[MiscTask])
def list_tasks():
    return misc_service.list_items()


@router.post("", response_model=MiscTask)
def create_task(payload: MiscTaskCreate):
    return misc_service.create(payload.model_dump())


@router.patch("/reorder", response_model=list[MiscTask])
def reorder_tasks(positions: list[ReorderItem]):
    return misc_service.reorder([p.model_dump() for p in positions])


@router.patch("/{task_id}", response_model=MiscTask)
def update_task(task_id: str, payload: MiscTaskUpdate):
    task = misc_service.update(task_id, payload.model_dump(exclude_unset=True))
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: str):
    if not misc_service.delete(task_id):
        raise HTTPException(status_code=404, detail="Task not found")


@router.post("/{task_id}/checklist", response_model=MiscTask)
def add_checklist_item(task_id: str, payload: ChecklistItemCreate):
    task = misc_service.add_checklist_item(task_id, payload.text)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}/checklist/reorder", response_model=MiscTask)
def reorder_checklist(task_id: str, positions: list[ReorderItem]):
    task = misc_service.reorder_checklist(task_id, [p.model_dump() for p in positions])
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}/checklist/{item_id}", response_model=MiscTask)
def update_checklist_item(task_id: str, item_id: str, payload: ChecklistItemUpdate):
    task = misc_service.update_checklist_item(task_id, item_id, payload.model_dump(exclude_unset=True))
    if task is None:
        raise HTTPException(status_code=404, detail="Task or checklist item not found")
    return task


@router.delete("/{task_id}/checklist/{item_id}", response_model=MiscTask)
def delete_checklist_item(task_id: str, item_id: str):
    task = misc_service.delete_checklist_item(task_id, item_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
