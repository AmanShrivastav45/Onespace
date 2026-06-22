from fastapi import APIRouter, HTTPException, Query

from ..models.context import ContextEntry, ContextEntryCreate, ContextEntryUpdate
from ..services import context_service

router = APIRouter(prefix="/api/context", tags=["context"])


@router.get("", response_model=list[ContextEntry])
def list_entries():
    return context_service.list_items()


@router.get("/search", response_model=list[ContextEntry])
def search_entries(tag: str = Query(...)):
    tag_lower = tag.lower()
    return [e for e in context_service.list_items() if any(t.lower() == tag_lower for t in e["tags"])]


@router.post("", response_model=ContextEntry)
def create_entry(payload: ContextEntryCreate):
    return context_service.create(payload.model_dump())


@router.patch("/{entry_id}", response_model=ContextEntry)
def update_entry(entry_id: str, payload: ContextEntryUpdate):
    entry = context_service.update(entry_id, payload.model_dump(exclude_unset=True))
    if entry is None:
        raise HTTPException(status_code=404, detail="Context entry not found")
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: str):
    if not context_service.delete(entry_id):
        raise HTTPException(status_code=404, detail="Context entry not found")
