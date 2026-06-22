Build a personal task management web app called "TaskBoard" for internal company use. 
It must be a complete, working repository that anyone can clone, install dependencies 
for, and run locally with zero configuration — no database setup, no env vars required 
to get started.

## Stack
- Frontend: React + Tailwind CSS (Vite)
- Backend: FastAPI (Python)
- Storage: plain JSON files on disk, no database at all
- Drag-and-drop: use a library like @dnd-kit/core (or dnd-kit/sortable) for reordering

## Repo structure
/backend  — FastAPI app, JSON files live in /backend/data/
/frontend — React + Tailwind app
/README.md — setup instructions: clone, install backend deps, install frontend deps, 
              run both, app works immediately

## Data model

backend/data/tickets.json:
{
  "tickets": [
    {
      "id": "uuid",
      "key": "string (e.g. GEM-1234)",
      "title": "string",
      "description": "string",
      "status": "todo | in_progress | done",
      "order": integer,
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      "checklist": [
        { "id": "uuid", "text": "string", "done": boolean, "order": integer }
      ]
    }
  ]
}

backend/data/misc.json — identical shape to a ticket, minus the "key" field:
{
  "tasks": [
    {
      "id": "uuid", "title": "string", "description": "string",
      "status": "todo | in_progress | done", "order": integer,
      "createdAt": "...", "updatedAt": "...",
      "checklist": [ { "id": "uuid", "text": "string", "done": boolean, "order": integer } ]
    }
  ]
}

backend/data/context.json — freeform notes store, tag-based search, no checklist:
{
  "entries": [
    {
      "id": "uuid", "title": "string", "description": "string",
      "summary": "string (my own understanding of the note)",
      "tags": ["string", ...],
      "createdAt": "...", "updatedAt": "..."
    }
  ]
}

If a data file doesn't exist on startup, create it with an empty default structure.

## API surface (FastAPI, prefix /api)

Tickets:
GET    /api/tickets
POST   /api/tickets
PATCH  /api/tickets/{id}
DELETE /api/tickets/{id}
PATCH  /api/tickets/reorder              (body: list of {id, order})
POST   /api/tickets/{id}/checklist
PATCH  /api/tickets/{id}/checklist/{item_id}
DELETE /api/tickets/{id}/checklist/{item_id}
PATCH  /api/tickets/{id}/checklist/reorder

Misc tasks: identical routes under /api/misc (no "key" field)

Context:
GET    /api/context
POST   /api/context
PATCH  /api/context/{id}
DELETE /api/context/{id}
GET    /api/context/search?tag=xyz

Use Pydantic models for request/response validation. Reads/writes to the JSON files 
should be wrapped so a single request fully reads, mutates, and rewrites the file 
atomically (write to a temp file then os.replace), guarded by an in-process lock per 
file, since this is a single-user local tool and doesn't need a real database — just 
needs to not corrupt the file on concurrent requests.

Enable CORS for local frontend dev (allow http://localhost:5173 or whatever Vite's 
default port is).

## Frontend requirements

Three main sections/tabs: "Jira Tickets", "Miscellaneous Tasks", "Context".

Jira Tickets tab:
- List of ticket cards, each showing key, title, status badge
- Click a ticket to expand/open it: shows description (editable) and a checklist 
  of sub-tasks
- Checklist items are checkboxes (done/not done) and are drag-and-drop reorderable
- Tickets themselves are drag-and-drop reorderable in the list
- Can create a new ticket (key, title, description, status)
- Can edit/delete a ticket
- Can add/edit/delete/toggle checklist items within a ticket

Miscellaneous Tasks tab:
- Same UX pattern as tickets, minus the "key" field — title, description, status, 
  reorderable checklist

Context tab:
- List of note entries (title, description, summary, tags)
- Create/edit/delete entries
- A search/filter input that filters entries by tag
- Tags are entered as free text (comma-separated input is fine) and rendered as 
  small pill/badge UI

General:
- Clean, minimal Tailwind styling — doesn't need to be fancy, just usable and clear
- Status badges should be color-coded (e.g. gray = todo, blue = in_progress, 
  green = done)
- All API calls go through a small api client module (frontend/src/api/) so base 
  URL is configurable in one place
- Use React state + fetch/axios to talk to the backend; no need for Redux or 
  similar, keep it simple

## Deliverable
A fully working repo. After `cd backend && pip install -r requirements.txt && 
uvicorn app.main:app --reload` and `cd frontend && npm install && npm run dev`, 
the app should be immediately usable with no further setup. Include a clear 
top-level README with these exact run steps.