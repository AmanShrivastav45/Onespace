from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from .common import ChecklistItem, Status


class Priority(str, Enum):
    highest = "Highest"
    high = "High"
    medium = "Medium"
    low = "Low"
    lowest = "Lowest"


class Resolution(str, Enum):
    unresolved = "Unresolved"
    resolved = "Resolved"
    wont_fix = "Won't Fix"
    duplicate = "Duplicate"
    cannot_reproduce = "Cannot Reproduce"


class TicketAttachment(BaseModel):
    id: str
    name: str
    sizeKb: float
    uploadedAt: str


class TicketSubtask(BaseModel):
    id: str
    title: str
    done: bool = False
    jiraLink: str = ""
    description: str = ""


class TicketComment(BaseModel):
    id: str
    author: str
    body: str
    createdAt: str


class Ticket(BaseModel):
    id: str
    key: str
    title: str
    description: str = ""
    status: Status = Status.todo
    order: int
    createdAt: str
    updatedAt: str
    checklist: list[ChecklistItem] = Field(default_factory=list)
    priority: Priority = Priority.medium
    severity: Priority = Priority.medium
    resolution: Resolution = Resolution.unresolved
    components: list[str] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)
    fixVersion: str = ""
    responsibleTeam: str = ""
    associatedGroup: str = ""
    ticketRequester: str = ""
    detectedInRelease: str = ""
    assignee: str = ""
    secondAssignee: str = ""
    reporter: str = ""
    votes: int = 0
    watchers: int = 0
    attachments: list[TicketAttachment] = Field(default_factory=list)
    subtasks: list[TicketSubtask] = Field(default_factory=list)
    comments: list[TicketComment] = Field(default_factory=list)


class TicketCreate(BaseModel):
    key: str
    title: str
    description: str = ""
    status: Status = Status.todo
    priority: Priority = Priority.medium
    severity: Priority = Priority.medium
    resolution: Resolution = Resolution.unresolved
    components: list[str] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)
    fixVersion: str = ""
    responsibleTeam: str = ""
    associatedGroup: str = ""
    ticketRequester: str = ""
    detectedInRelease: str = ""
    assignee: str = ""
    secondAssignee: str = ""
    reporter: str = ""


class TicketUpdate(BaseModel):
    key: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Status] = None
    priority: Optional[Priority] = None
    severity: Optional[Priority] = None
    resolution: Optional[Resolution] = None
    components: Optional[list[str]] = None
    labels: Optional[list[str]] = None
    fixVersion: Optional[str] = None
    responsibleTeam: Optional[str] = None
    associatedGroup: Optional[str] = None
    ticketRequester: Optional[str] = None
    detectedInRelease: Optional[str] = None
    assignee: Optional[str] = None
    secondAssignee: Optional[str] = None
    reporter: Optional[str] = None


class CommentCreate(BaseModel):
    author: str = "You"
    body: str


class SubtaskCreate(BaseModel):
    jiraLink: str = ""
    title: str
    description: str = ""


class SubtaskUpdate(BaseModel):
    done: bool
