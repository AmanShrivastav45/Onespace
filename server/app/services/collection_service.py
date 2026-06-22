import uuid
from datetime import datetime, timezone

from .storage import JSONFileStore


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ChecklistCollectionService:
    """Shared CRUD + checklist logic for collections shaped like
    {<collection_key>: [ {id, ..., order, checklist: [...]} ]}.

    Tickets and misc tasks differ only in which extra fields (e.g. "key")
    get passed through, so both resources share this one service and rely
    on their own Pydantic models at the router boundary for validation.
    """

    def __init__(self, store: JSONFileStore, collection_key: str):
        self._store = store
        self._collection_key = collection_key

    def list_items(self) -> list[dict]:
        items = self._store.read()[self._collection_key]
        return sorted(items, key=lambda i: i["order"])

    def create(self, fields: dict) -> dict:
        def op(data: dict) -> dict:
            items = data[self._collection_key]
            order = max((i["order"] for i in items), default=-1) + 1
            item = {
                "id": new_id(),
                **fields,
                "order": order,
                "createdAt": now_iso(),
                "updatedAt": now_iso(),
                "checklist": [],
            }
            items.append(item)
            return item

        return self._store.mutate(op)

    def update(self, item_id: str, fields: dict) -> dict | None:
        def op(data: dict):
            for item in data[self._collection_key]:
                if item["id"] == item_id:
                    item.update(fields)
                    item["updatedAt"] = now_iso()
                    return item
            return None

        return self._store.mutate(op)

    def delete(self, item_id: str) -> bool:
        def op(data: dict) -> bool:
            items = data[self._collection_key]
            before = len(items)
            data[self._collection_key] = [i for i in items if i["id"] != item_id]
            return len(data[self._collection_key]) < before

        return self._store.mutate(op)

    def reorder(self, positions: list[dict]) -> list[dict]:
        order_by_id = {p["id"]: p["order"] for p in positions}

        def op(data: dict):
            items = data[self._collection_key]
            for item in items:
                if item["id"] in order_by_id:
                    item["order"] = order_by_id[item["id"]]
            return sorted(items, key=lambda i: i["order"])

        return self._store.mutate(op)

    def add_checklist_item(self, item_id: str, text: str) -> dict | None:
        def op(data: dict):
            for item in data[self._collection_key]:
                if item["id"] == item_id:
                    checklist = item["checklist"]
                    order = max((c["order"] for c in checklist), default=-1) + 1
                    checklist.append({"id": new_id(), "text": text, "done": False, "order": order})
                    item["updatedAt"] = now_iso()
                    return item
            return None

        return self._store.mutate(op)

    def update_checklist_item(self, item_id: str, checklist_item_id: str, fields: dict) -> dict | None:
        def op(data: dict):
            for item in data[self._collection_key]:
                if item["id"] == item_id:
                    for c in item["checklist"]:
                        if c["id"] == checklist_item_id:
                            c.update(fields)
                            item["updatedAt"] = now_iso()
                            return item
                    return None
            return None

        return self._store.mutate(op)

    def delete_checklist_item(self, item_id: str, checklist_item_id: str) -> dict | None:
        def op(data: dict):
            for item in data[self._collection_key]:
                if item["id"] == item_id:
                    before = len(item["checklist"])
                    item["checklist"] = [c for c in item["checklist"] if c["id"] != checklist_item_id]
                    if len(item["checklist"]) < before:
                        item["updatedAt"] = now_iso()
                    return item
            return None

        return self._store.mutate(op)

    def reorder_checklist(self, item_id: str, positions: list[dict]) -> dict | None:
        order_by_id = {p["id"]: p["order"] for p in positions}

        def op(data: dict):
            for item in data[self._collection_key]:
                if item["id"] == item_id:
                    for c in item["checklist"]:
                        if c["id"] in order_by_id:
                            c["order"] = order_by_id[c["id"]]
                    item["checklist"].sort(key=lambda c: c["order"])
                    item["updatedAt"] = now_iso()
                    return item
            return None

        return self._store.mutate(op)

    def add_comment(self, item_id: str, author: str, body: str) -> dict | None:
        def op(data: dict):
            for item in data[self._collection_key]:
                if item["id"] == item_id:
                    item.setdefault("comments", []).append(
                        {"id": new_id(), "author": author, "body": body, "createdAt": now_iso()}
                    )
                    item["updatedAt"] = now_iso()
                    return item
            return None

        return self._store.mutate(op)

    def add_subtask(self, item_id: str, jira_link: str, title: str, description: str = "") -> dict | None:
        def op(data: dict):
            for item in data[self._collection_key]:
                if item["id"] == item_id:
                    item.setdefault("subtasks", []).append(
                        {
                            "id": new_id(),
                            "title": title,
                            "done": False,
                            "jiraLink": jira_link,
                            "description": description,
                        }
                    )
                    item["updatedAt"] = now_iso()
                    return item
            return None

        return self._store.mutate(op)

    def update_subtask(self, item_id: str, subtask_id: str, done: bool) -> dict | None:
        def op(data: dict):
            for item in data[self._collection_key]:
                if item["id"] == item_id:
                    for s in item.get("subtasks", []):
                        if s["id"] == subtask_id:
                            s["done"] = done
                            item["updatedAt"] = now_iso()
                            return item
                    return None
            return None

        return self._store.mutate(op)
