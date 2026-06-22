from fastapi import APIRouter, HTTPException

from ..models.common import ChecklistItemCreate, ChecklistItemUpdate, ReorderItem
from ..models.ticket import CommentCreate, SubtaskCreate, SubtaskUpdate, Ticket, TicketCreate, TicketUpdate
from ..services import tickets_service

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.get("", response_model=list[Ticket])
def list_tickets():
    return tickets_service.list_items()


@router.post("", response_model=Ticket)
def create_ticket(payload: TicketCreate):
    return tickets_service.create(payload.model_dump())


@router.patch("/reorder", response_model=list[Ticket])
def reorder_tickets(positions: list[ReorderItem]):
    return tickets_service.reorder([p.model_dump() for p in positions])


@router.patch("/{ticket_id}", response_model=Ticket)
def update_ticket(ticket_id: str, payload: TicketUpdate):
    ticket = tickets_service.update(ticket_id, payload.model_dump(exclude_unset=True))
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: str):
    if not tickets_service.delete(ticket_id):
        raise HTTPException(status_code=404, detail="Ticket not found")


@router.post("/{ticket_id}/checklist", response_model=Ticket)
def add_checklist_item(ticket_id: str, payload: ChecklistItemCreate):
    ticket = tickets_service.add_checklist_item(ticket_id, payload.text)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}/checklist/reorder", response_model=Ticket)
def reorder_checklist(ticket_id: str, positions: list[ReorderItem]):
    ticket = tickets_service.reorder_checklist(ticket_id, [p.model_dump() for p in positions])
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}/checklist/{item_id}", response_model=Ticket)
def update_checklist_item(ticket_id: str, item_id: str, payload: ChecklistItemUpdate):
    ticket = tickets_service.update_checklist_item(ticket_id, item_id, payload.model_dump(exclude_unset=True))
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket or checklist item not found")
    return ticket


@router.delete("/{ticket_id}/checklist/{item_id}", response_model=Ticket)
def delete_checklist_item(ticket_id: str, item_id: str):
    ticket = tickets_service.delete_checklist_item(ticket_id, item_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/{ticket_id}/comments", response_model=Ticket)
def add_comment(ticket_id: str, payload: CommentCreate):
    ticket = tickets_service.add_comment(ticket_id, payload.author, payload.body)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/{ticket_id}/subtasks", response_model=Ticket)
def add_subtask(ticket_id: str, payload: SubtaskCreate):
    ticket = tickets_service.add_subtask(ticket_id, payload.jiraLink, payload.title, payload.description)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}/subtasks/{subtask_id}", response_model=Ticket)
def update_subtask(ticket_id: str, subtask_id: str, payload: SubtaskUpdate):
    ticket = tickets_service.update_subtask(ticket_id, subtask_id, payload.done)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket or subtask not found")
    return ticket
