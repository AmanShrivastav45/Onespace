from typing import Optional

from pydantic import BaseModel, Field


class ContextEntry(BaseModel):
    id: str
    title: str
    description: str = ""
    summary: str = ""
    tags: list[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str


class ContextEntryCreate(BaseModel):
    title: str
    description: str = ""
    summary: str = ""
    tags: list[str] = Field(default_factory=list)


class ContextEntryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[list[str]] = None
