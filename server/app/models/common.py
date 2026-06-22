from enum import Enum
from typing import Optional

from pydantic import BaseModel


class Status(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class ChecklistItem(BaseModel):
    id: str
    text: str
    done: bool = False
    order: int


class ChecklistItemCreate(BaseModel):
    text: str


class ChecklistItemUpdate(BaseModel):
    text: Optional[str] = None
    done: Optional[bool] = None


class ReorderItem(BaseModel):
    id: str
    order: int
