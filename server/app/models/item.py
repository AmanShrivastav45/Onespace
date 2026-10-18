from datetime import date as Date, datetime
from typing import Literal
from uuid import uuid4
from pydantic import BaseModel, Field, model_validator, ConfigDict
from app.models.calendar import CalendarEvent

class Subtask(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str = Field(min_length=1, max_length=500)
    done: bool = False
    created_at: datetime | None = None

class BacklogSubtask(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str = Field(default_factory=lambda: str(uuid4()))
    description: str = Field(min_length=1, max_length=10000)
    done: bool = False
    created_at: datetime | None = None

class Item(BaseModel):
    kind: Literal['deadline', 'task', 'backlog', 'event']
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default='', max_length=10000)
    date: Date | None = None
    person: str = ''
    priority: Literal['low', 'medium', 'high'] = 'medium'
    status: Literal['open', 'done'] = 'open'
    reminder_days: int = Field(default=3, ge=0, le=365)
    subtasks: list[Subtask | BacklogSubtask] = Field(default_factory=list)
    dayflow: CalendarEvent | None = None

    @model_validator(mode='after')
    def task_has_no_deadline(self):
        if self.kind == 'task':
            if any(not isinstance(step, Subtask) for step in self.subtasks):
                raise ValueError('Task subtasks require a title')
            self.title = ' '.join(self.title.split())
            self.date = None
            self.description = ''
            self.dayflow = None
        if self.kind == 'deadline':
            self.subtasks = []
        if self.kind == 'backlog':
            self.date = None
            self.dayflow = None
            self.subtasks = [step if isinstance(step, BacklogSubtask) else BacklogSubtask(
                id=step.id, description=step.title, done=step.done, created_at=step.created_at
            ) for step in self.subtasks]
        if self.kind in ('task', 'backlog') and self.subtasks:
            self.status = 'done' if all(step.done for step in self.subtasks) else 'open'
        return self

class Note(BaseModel):
    note: str = Field(min_length=3, max_length=10000)
    kind: Literal['deadline', 'task', 'backlog', 'event']

