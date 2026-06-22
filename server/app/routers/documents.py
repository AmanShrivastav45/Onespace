from fastapi import APIRouter, HTTPException

from ..models.document import Document, DocumentCreate, DocumentUpdate
from ..services import documents_service

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=list[Document])
def list_documents():
    return documents_service.list_items()


@router.post("", response_model=Document)
def create_document(payload: DocumentCreate):
    return documents_service.create(payload.model_dump())


@router.patch("/{document_id}", response_model=Document)
def update_document(document_id: str, payload: DocumentUpdate):
    document = documents_service.update(document_id, payload.model_dump(exclude_unset=True))
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: str):
    if not documents_service.delete(document_id):
        raise HTTPException(status_code=404, detail="Document not found")
