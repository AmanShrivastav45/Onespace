from typing import Optional

from pydantic import BaseModel


class Document(BaseModel):
    id: str
    title: str
    filename: str = ""
    content: str = ""
    createdAt: str
    updatedAt: str


class DocumentCreate(BaseModel):
    title: str
    filename: str = ""
    content: str = ""


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
