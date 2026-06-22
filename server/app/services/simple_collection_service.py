from .collection_service import new_id, now_iso
from .storage import JSONFileStore


class SimpleCollectionService:
    """Generic CRUD for collections shaped like {<collection_key>: [ {id, ...} ]},
    sorted by createdAt descending. For resources with no ordering/checklist
    (Context entries, Documents) — Tickets/Misc use ChecklistCollectionService
    instead, since they need order + checklist support.
    """

    def __init__(self, store: JSONFileStore, collection_key: str):
        self._store = store
        self._collection_key = collection_key

    def list_items(self) -> list[dict]:
        return sorted(self._store.read()[self._collection_key], key=lambda e: e["createdAt"], reverse=True)

    def create(self, fields: dict) -> dict:
        def op(data: dict):
            entry = {"id": new_id(), **fields, "createdAt": now_iso(), "updatedAt": now_iso()}
            data[self._collection_key].append(entry)
            return entry

        return self._store.mutate(op)

    def update(self, entry_id: str, fields: dict) -> dict | None:
        def op(data: dict):
            for entry in data[self._collection_key]:
                if entry["id"] == entry_id:
                    entry.update(fields)
                    entry["updatedAt"] = now_iso()
                    return entry
            return None

        return self._store.mutate(op)

    def delete(self, entry_id: str) -> bool:
        def op(data: dict) -> bool:
            items = data[self._collection_key]
            before = len(items)
            data[self._collection_key] = [e for e in items if e["id"] != entry_id]
            return len(data[self._collection_key]) < before

        return self._store.mutate(op)
