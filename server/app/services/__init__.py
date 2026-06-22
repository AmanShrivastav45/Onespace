from ..config import CONTEXT_FILE, DOCUMENTS_FILE, MISC_FILE, TICKETS_FILE
from .collection_service import ChecklistCollectionService
from .simple_collection_service import SimpleCollectionService
from .storage import JSONFileStore

tickets_store = JSONFileStore(TICKETS_FILE, default={"tickets": []})
misc_store = JSONFileStore(MISC_FILE, default={"tasks": []})
context_store = JSONFileStore(CONTEXT_FILE, default={"entries": []})
documents_store = JSONFileStore(DOCUMENTS_FILE, default={"documents": []})

tickets_service = ChecklistCollectionService(tickets_store, "tickets")
misc_service = ChecklistCollectionService(misc_store, "tasks")
context_service = SimpleCollectionService(context_store, "entries")
documents_service = SimpleCollectionService(documents_store, "documents")
