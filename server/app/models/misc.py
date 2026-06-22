from typing import Optional

from pydantic import BaseModel, Field

from .common import ChecklistItem, Status


class MiscTask(BaseModel):
    id: str
    title: str
    description: str = ""
    status: Status = Status.todo
    order: int
    createdAt: str
    updatedAt: str
    checklist: list[ChecklistItem] = Field(default_factory=list)


class MiscTaskCreate(BaseModel):
    title: str
    description: str = ""
    status: Status = Status.todo


class MiscTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Status] = None
