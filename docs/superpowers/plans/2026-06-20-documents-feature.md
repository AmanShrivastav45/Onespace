# Documents Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Documents" resource to the TaskBoard app — upload `.md` files, browse them in a 3-column grid, open a dedicated detail page that renders the markdown as formatted HTML, with full CRUD (create via upload, rename/edit content, delete).

**Architecture:** Backend follows the existing JSON-file-per-resource pattern. `ContextService` is generalized into a reusable `SimpleCollectionService(store, collection_key)` (mirroring how `ChecklistCollectionService` already takes `collection_key`), and both Context and the new Documents resource share it. Frontend follows the existing per-resource pattern (types → typed API client → `DataContext` wiring → grid page + card + form → dedicated detail page), reusing `Modal`/button/card styling conventions already established by Tickets and Context. Markdown is rendered via `react-markdown` + `remark-gfm` (renders straight to React elements, no `dangerouslySetInnerHTML`), styled with `@tailwindcss/typography`'s `prose` classes.

**Tech Stack:** FastAPI + Pydantic (backend), React + TypeScript + Tailwind CSS + Vite (frontend), `react-markdown` + `remark-gfm` (new), `@tailwindcss/typography` (new).

**No automated test suite exists in this project** (no pytest/vitest config anywhere, confirmed by searching the repo). Every prior feature in this codebase was verified via `tsc -b` / `eslint` / `npm run build` plus manual `curl` smoke tests against the running backend — this plan follows that same convention rather than introducing a new test framework. **This project also has no git repository** (confirmed — `git status` fails with "not a git repository"), and the user explicitly chose to skip git entirely for this feature's spec, so there are no commit steps in this plan either. Each task ends with a verification step instead.

---

## Backend

### Task 1: Add the documents data file path

**Files:**
- Modify: `server/app/config.py`

- [ ] **Step 1: Add the `DOCUMENTS_FILE` constant**

Current file:
```python
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

TICKETS_FILE = DATA_DIR / "tickets.json"
MISC_FILE = DATA_DIR / "misc.json"
CONTEXT_FILE = DATA_DIR / "context.json"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

Change the three `*_FILE` lines to:
```python
TICKETS_FILE = DATA_DIR / "tickets.json"
MISC_FILE = DATA_DIR / "misc.json"
CONTEXT_FILE = DATA_DIR / "context.json"
DOCUMENTS_FILE = DATA_DIR / "documents.json"
```

- [ ] **Step 2: Verify**

No runtime effect yet (nothing imports `DOCUMENTS_FILE` until Task 5). Just confirm the file still parses: run `python -c "import ast; ast.parse(open('server/app/config.py').read())"` from the repo root.
Expected: no output, exit code 0.

---

### Task 2: Add the Document Pydantic models

**Files:**
- Create: `server/app/models/document.py`

- [ ] **Step 1: Write the model file**

```python
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
```

- [ ] **Step 2: Verify**

Run `cd server && .venv\Scripts\activate && python -c "from app.models.document import Document, DocumentCreate, DocumentUpdate; print('ok')"`
Expected: `ok`

---

### Task 3: Generalize `ContextService` into `SimpleCollectionService`

**Files:**
- Create: `server/app/services/simple_collection_service.py`
- Delete: `server/app/services/context_service.py`
- Modify: `server/app/routers/context.py`

The current `server/app/services/context_service.py` hardcodes the
`"entries"` collection key and includes a Context-specific
`search_by_tag` method. We need the same list/create/update/delete CRUD
for Documents, so this generalizes the class the same way
`ChecklistCollectionService` already takes `collection_key` as a
constructor argument. `search_by_tag` is Context-specific (tags aren't a
Document field), so it moves out of the shared service and becomes an
inline filter in the router that calls it.

- [ ] **Step 1: Create the generalized service file**

```python
from .collection_service import new_id, now_iso
from .storage import JSONFileStore


class SimpleCollectionService:
    """Generic CRUD for collections shaped like {<collection_key>: [ {id, ...} ]},
    sorted by createdAt descending. For resources with no ordering/checklist
    (Context entries, Documents) — Tickets/Misc use ChecklistCollectionService
    instead, since they need order + checklist support.
    """

    def __init__(self, store: JSONFileStore, collection_key: str):
        self._store = store
        self._collection_key = collection_key

    def list_items(self) -> list[dict]:
        return sorted(self._store.read()[self._collection_key], key=lambda e: e["createdAt"], reverse=True)

    def create(self, fields: dict) -> dict:
        def op(data: dict):
            entry = {"id": new_id(), **fields, "createdAt": now_iso(), "updatedAt": now_iso()}
            data[self._collection_key].append(entry)
            return entry

        return self._store.mutate(op)

    def update(self, entry_id: str, fields: dict) -> dict | None:
        def op(data: dict):
            for entry in data[self._collection_key]:
                if entry["id"] == entry_id:
                    entry.update(fields)
                    entry["updatedAt"] = now_iso()
                    return entry
            return None

        return self._store.mutate(op)

    def delete(self, entry_id: str) -> bool:
        def op(data: dict) -> bool:
            items = data[self._collection_key]
            before = len(items)
            data[self._collection_key] = [e for e in items if e["id"] != entry_id]
            return len(data[self._collection_key]) < before

        return self._store.mutate(op)
```

- [ ] **Step 2: Delete the old file**

Delete `server/app/services/context_service.py` (its logic now lives in
`simple_collection_service.py`).

- [ ] **Step 3: Update `server/app/routers/context.py`'s search endpoint**

Current:
```python
@router.get("/search", response_model=list[ContextEntry])
def search_entries(tag: str = Query(...)):
    return context_service.search_by_tag(tag)
```

Change to (inlining what `search_by_tag` used to do, since the generic
service no longer has a Context-specific method):
```python
@router.get("/search", response_model=list[ContextEntry])
def search_entries(tag: str = Query(...)):
    tag_lower = tag.lower()
    return [e for e in context_service.list_items() if any(t.lower() == tag_lower for t in e["tags"])]
```

No other changes needed in this file — `context_service` is still the
name of the imported instance (only its class changes, in Task 5).

- [ ] **Step 4: Verify**

This task alone will not yet run cleanly, because `services/__init__.py`
still imports the deleted `context_service` module (fixed in Task 5).
Confirm the new file at least parses on its own:
Run: `cd server && .venv\Scripts\activate && python -c "from app.services.simple_collection_service import SimpleCollectionService; print('ok')"`
Expected: `ok`

---

### Task 4: Wire up the new service and the documents store

**Files:**
- Modify: `server/app/services/__init__.py`

- [ ] **Step 1: Update the file**

Current:
```python
from ..config import CONTEXT_FILE, MISC_FILE, TICKETS_FILE
from .collection_service import ChecklistCollectionService
from .context_service import ContextService
from .storage import JSONFileStore

tickets_store = JSONFileStore(TICKETS_FILE, default={"tickets": []})
misc_store = JSONFileStore(MISC_FILE, default={"tasks": []})
context_store = JSONFileStore(CONTEXT_FILE, default={"entries": []})

tickets_service = ChecklistCollectionService(tickets_store, "tickets")
misc_service = ChecklistCollectionService(misc_store, "tasks")
context_service = ContextService(context_store)
```

Replace with:
```python
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
```

- [ ] **Step 2: Verify**

Run: `cd server && .venv\Scripts\activate && python -c "from app.services import tickets_service, misc_service, context_service, documents_service; print('ok')"`
Expected: `ok`

---

### Task 5: Add the documents router

**Files:**
- Create: `server/app/routers/documents.py`
- Modify: `server/app/main.py`

- [ ] **Step 1: Write the router**

```python
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
```

- [ ] **Step 2: Register the router**

Current `server/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .routers import context, misc, tickets

app = FastAPI(title="TaskBoard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)
app.include_router(misc.router)
app.include_router(context.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

Change to:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .routers import context, documents, misc, tickets

app = FastAPI(title="TaskBoard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)
app.include_router(misc.router)
app.include_router(context.router)
app.include_router(documents.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 3: Verify**

Run: `cd server && .venv\Scripts\activate && python -c "from app.main import app; print('ok')"`
Expected: `ok`

---

### Task 6: Backend smoke test

**Files:** none (manual verification only)

- [ ] **Step 1: Start the backend**

Run (in its own terminal, leave running): `cd server && .venv\Scripts\activate && uvicorn app.main:app --reload`
Expected: `Uvicorn running on http://127.0.0.1:8000` with no startup errors. This also auto-creates `server/data/documents.json` with `{"documents": []}` on first read.

- [ ] **Step 2: Create a document**

Run:
```bash
curl -s -X POST http://localhost:8000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test Doc","filename":"smoke-test.md","content":"# Hello\n\nThis is a **test**."}'
```
Expected: a JSON object with a new `id`, `title: "Smoke Test Doc"`, `filename: "smoke-test.md"`, the given `content`, and `createdAt`/`updatedAt` ISO timestamps. Note the `id` for the next steps.

- [ ] **Step 3: List documents**

Run: `curl -s http://localhost:8000/api/documents`
Expected: a JSON array containing the document created in Step 2.

- [ ] **Step 4: Update the document**

Run (replace `<id>` with the id from Step 2):
```bash
curl -s -X PATCH http://localhost:8000/api/documents/<id> \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test Doc (edited)"}'
```
Expected: same `id`, `title` now `"Smoke Test Doc (edited)"`, `content` unchanged, `updatedAt` changed.

- [ ] **Step 5: Confirm a 404 on an unknown id**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:8000/api/documents/does-not-exist \
  -H "Content-Type: application/json" -d '{"title":"x"}'
```
Expected: `404`

- [ ] **Step 6: Delete the document and confirm it's gone**

Run (replace `<id>`):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8000/api/documents/<id>
curl -s http://localhost:8000/api/documents
```
Expected: first command prints `204`; second prints `[]` (the test document is gone — `server/data/documents.json` is back to its empty starting state, so no cleanup edit is needed).

---

## Frontend

### Task 7: Install new dependencies

**Files:**
- Modify: `client/package.json` (via `npm install`, not hand-edited)
- Modify: `client/tailwind.config.js`

- [ ] **Step 1: Install the packages**

Run: `cd client && npm install react-markdown remark-gfm @tailwindcss/typography`
Expected: all three added under `"dependencies"` in `client/package.json` (this project already keeps build-time CSS tooling like `tailwindcss`/`postcss`/`autoprefixer` under `dependencies` rather than `devDependencies` — follow that existing convention), `package-lock.json` updated, no install errors.

- [ ] **Step 2: Register the typography plugin**

Current `client/tailwind.config.js` ends with:
```js
      borderRadius: {
        none: '0px',
        sm: '8px',
        pill: '9999px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
```

Add the import at the top of the file:
```js
import typography from '@tailwindcss/typography';
```

And change `plugins: []` to:
```js
  plugins: [typography],
```

- [ ] **Step 3: Verify**

Run: `cd client && npx vite build --mode development 2>&1 | head -n 20` (or just proceed to Task 14's full build — either confirms Tailwind can resolve the plugin without errors).
Expected: no "Cannot find module '@tailwindcss/typography'" or Tailwind config errors.

---

### Task 8: Add the `Document` type

**Files:**
- Modify: `client/src/types/resources.ts`

- [ ] **Step 1: Add the interface**

Add at the end of `client/src/types/resources.ts`:
```ts
export interface Document {
  id: string;
  title: string;
  filename: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Verify**

Run: `cd client && npx tsc -b`
Expected: no errors (this is an additive export; nothing consumes it yet).

---

### Task 9: Add the documents API client

**Files:**
- Create: `client/src/api/documents.ts`

- [ ] **Step 1: Write the file**

```ts
import { api } from './client';
import type { Document } from '../types/resources';

export interface DocumentCreate {
  title: string;
  filename?: string;
  content?: string;
}

export interface DocumentUpdate {
  title: string;
  content: string;
}

export const documentsApi = {
  list: () => api.get<Document[]>('/documents'),
  create: (data: DocumentCreate) => api.post<Document>('/documents', data),
  update: (id: string, data: Partial<DocumentUpdate>) => api.patch<Document>(`/documents/${id}`, data),
  remove: (id: string) => api.del<void>(`/documents/${id}`),
};
```

- [ ] **Step 2: Verify**

Run: `cd client && npx tsc -b`
Expected: no errors.

---

### Task 10: Wire documents into `DataContext`

**Files:**
- Modify: `client/src/context/DataContext.tsx`

- [ ] **Step 1: Update imports**

Current imports:
```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { contextApi } from '../api/context';
import type { ContextEntryCreate, ContextEntryUpdate } from '../api/context';
import { miscApi } from '../api/misc';
import { ticketsApi } from '../api/tickets';
import type { SubtaskCreate } from '../api/tickets';
import { useResourceController } from '../hooks/useResourceController';
import type { ContextEntry, MiscTask, Ticket } from '../types/resources';
```

Add the documents API import and extend the type import:
```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { contextApi } from '../api/context';
import type { ContextEntryCreate, ContextEntryUpdate } from '../api/context';
import { documentsApi } from '../api/documents';
import type { DocumentCreate, DocumentUpdate } from '../api/documents';
import { miscApi } from '../api/misc';
import { ticketsApi } from '../api/tickets';
import type { SubtaskCreate } from '../api/tickets';
import { useResourceController } from '../hooks/useResourceController';
import type { ContextEntry, Document, MiscTask, Ticket } from '../types/resources';
```

- [ ] **Step 2: Add `documents` state and fetch it on load**

Current:
```tsx
function useDataValue() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [miscTasks, setMiscTasks] = useState<MiscTask[]>([]);
  const [contextEntries, setContextEntries] = useState<ContextEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([ticketsApi.list(), miscApi.list(), contextApi.list()])
      .then(([t, m, c]) => {
        if (!active) return;
        setTickets(t);
        setMiscTasks(m);
        setContextEntries(c);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
```

Change to:
```tsx
function useDataValue() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [miscTasks, setMiscTasks] = useState<MiscTask[]>([]);
  const [contextEntries, setContextEntries] = useState<ContextEntry[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([ticketsApi.list(), miscApi.list(), contextApi.list(), documentsApi.list()])
      .then(([t, m, c, d]) => {
        if (!active) return;
        setTickets(t);
        setMiscTasks(m);
        setContextEntries(c);
        setDocuments(d);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
```

- [ ] **Step 3: Add `documentsController`**

Directly after the existing `contextController` block (the `useMemo` that
returns `{ create, update, remove }` for context entries), add:
```tsx
  const documentsController = useMemo(
    () => ({
      create: async (data: DocumentCreate) => {
        const document = await documentsApi.create(data);
        setDocuments((prev) => [document, ...prev]);
        return document;
      },
      update: async (id: string, data: Partial<DocumentUpdate>) => {
        const document = await documentsApi.update(id, data);
        setDocuments((prev) => prev.map((d) => (d.id === id ? document : d)));
        return document;
      },
      remove: async (id: string) => {
        await documentsApi.remove(id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      },
    }),
    [],
  );
```

- [ ] **Step 4: Return the new state/controller**

Current return statement:
```tsx
  return {
    tickets,
    miscTasks,
    contextEntries,
    loading,
    error,
    ticketsController,
    addTicketComment,
    addTicketSubtask,
    toggleTicketSubtask,
    miscController,
    contextController,
  };
```

Change to:
```tsx
  return {
    tickets,
    miscTasks,
    contextEntries,
    documents,
    loading,
    error,
    ticketsController,
    addTicketComment,
    addTicketSubtask,
    toggleTicketSubtask,
    miscController,
    contextController,
    documentsController,
  };
```

- [ ] **Step 5: Verify**

Run: `cd client && npx tsc -b`
Expected: no errors.

---

### Task 11: Document grid card

**Files:**
- Create: `client/src/components/documents/DocumentCard.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/documents/DocumentCard.tsx
import { useNavigate } from 'react-router-dom';
import type { Document } from '../../types/resources';

function toSnippet(markdown: string, maxLength = 120): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

interface DocumentCardProps {
  doc: Document;
}

export function DocumentCard({ doc }: DocumentCardProps) {
  const navigate = useNavigate();
  const snippet = toSnippet(doc.content);

  return (
    <li
      onClick={() => navigate(`/documents/${doc.id}`)}
      className="bg-card border border-border rounded-sm p-4 hover:bg-accent/40 transition-colors cursor-pointer flex flex-col gap-2 min-h-[140px]"
    >
      <p className="text-sm font-normal text-foreground line-clamp-2">{doc.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{snippet || 'Empty document.'}</p>
      <p className="text-[10px] text-muted-foreground/80 pt-2 border-t border-border">Updated {formatDate(doc.updatedAt)}</p>
    </li>
  );
}
```

(The prop is named `doc`, not `document`, to avoid shadowing the global `document` object.)

- [ ] **Step 2: Verify**

Run: `cd client && npx tsc -b && npx eslint src/components/documents/DocumentCard.tsx`
Expected: no errors.

---

### Task 12: Document form (create + edit)

**Files:**
- Create: `client/src/components/documents/DocumentForm.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/documents/DocumentForm.tsx
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Document } from '../../types/resources';

export interface DocumentFormValues {
  title: string;
  filename: string;
  content: string;
}

interface DocumentFormProps {
  initial?: Partial<Document>;
  submitLabel: string;
  onSubmit: (values: DocumentFormValues) => Promise<void> | void;
}

const inputClass =
  'w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground';
const labelClass = 'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5';

function titleFromFilename(name: string): string {
  return name.replace(/\.(md|markdown)$/i, '');
}

export function DocumentForm({ initial, submitLabel, onSubmit }: DocumentFormProps) {
  const isEdit = initial !== undefined;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [filename, setFilename] = useState(initial?.filename ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setFilename(file.name);
    setContent(text);
    if (!title.trim()) setTitle(titleFromFilename(file.name));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), filename, content });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {!isEdit && (
        <div>
          <label className={labelClass}>Markdown file</label>
          <input type="file" accept=".md,.markdown" onChange={(e) => void handleFileChange(e)} className={inputClass} />
        </div>
      )}

      <div>
        <label className={labelClass}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={inputClass}
          autoFocus={isEdit}
        />
      </div>

      {isEdit && (
        <div>
          <label className={labelClass}>Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Markdown content"
            className={`${inputClass} font-mono resize-none`}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="mt-1 px-3 py-2 text-sm font-normal text-primary-foreground bg-primary hover:bg-primary-active disabled:opacity-50 rounded-pill transition-colors"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd client && npx tsc -b && npx eslint src/components/documents/DocumentForm.tsx`
Expected: no errors.

---

### Task 13: Documents grid page

**Files:**
- Create: `client/src/pages/DocumentsPage.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/pages/DocumentsPage.tsx
import { useState } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { Modal } from '../components/ui/Modal';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentForm } from '../components/documents/DocumentForm';
import { useData } from '../context/DataContext';

export default function DocumentsPage() {
  const { documents, documentsController } = useData();
  const [isCreateOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-primary-foreground bg-primary hover:bg-primary-active rounded-pill transition-colors"
        >
          <RiAddLine className="text-[14px]" />
          New Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm py-12 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No documents yet — upload your first markdown file.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </ul>
      )}

      {isCreateOpen && (
        <Modal title="New Document" onClose={() => setCreateOpen(false)} widthClassName="max-w-xl">
          <DocumentForm
            submitLabel="Upload"
            onSubmit={async (values) => {
              await documentsController.create(values);
              setCreateOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd client && npx tsc -b && npx eslint src/pages/DocumentsPage.tsx`
Expected: no errors.

---

### Task 14: Document detail page

**Files:**
- Create: `client/src/pages/DocumentDetailPage.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/pages/DocumentDetailPage.tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RiDeleteBinLine, RiPencilLine } from 'react-icons/ri';
import { useData } from '../context/DataContext';
import { Modal } from '../components/ui/Modal';
import { DocumentForm } from '../components/documents/DocumentForm';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function DocumentDetailPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { documents, documentsController, loading } = useData();
  const [isEditOpen, setEditOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const doc = documents.find((d) => d.id === documentId);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!doc) {
    return (
      <div className="border border-dashed border-border rounded-sm py-12 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-lg font-normal text-foreground">{doc.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-foreground border border-border hover:bg-accent rounded-pill transition-colors"
            >
              <RiPencilLine className="text-[14px]" />
              Edit
            </button>
            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await documentsController.remove(doc.id);
                    navigate('/documents');
                  }}
                  className="px-3 py-1.5 text-xs font-normal text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-pill transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="px-3 py-1.5 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-accent rounded-pill transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-destructive hover:bg-destructive/10 rounded-pill transition-colors"
              >
                <RiDeleteBinLine className="text-[14px]" />
                Delete
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {doc.filename && <span className="font-mono mr-2">{doc.filename}</span>}
          Updated {formatDateTime(doc.updatedAt)}
        </p>
      </div>

      <div className="bg-card border border-border rounded-sm p-5">
        {doc.content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No content.</p>
        )}
      </div>

      {isEditOpen && (
        <Modal title="Edit document" onClose={() => setEditOpen(false)} widthClassName="max-w-2xl">
          <DocumentForm
            initial={doc}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              await documentsController.update(doc.id, { title: values.title, content: values.content });
              setEditOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
```

Note: the `prose` classes are applied to a wrapping `<div>`, not passed
as a `className` prop directly to `<ReactMarkdown>` — `react-markdown`
does not render a wrapping element itself (it renders markdown straight
to sibling React elements), so styling has to be applied via an ancestor
element instead.

- [ ] **Step 2: Verify**

Run: `cd client && npx tsc -b && npx eslint src/pages/DocumentDetailPage.tsx`
Expected: no errors. (This is also the step that will surface it if `react-markdown`'s actual installed type definitions don't match the import shown here — if `tsc -b` reports a type error on the `ReactMarkdown`/`remarkGfm` import or props, check `client/node_modules/react-markdown/index.d.ts` for the exact exported API and adjust the import/props to match before moving on.)

---

### Task 15: Routing and sidebar tab

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Update imports and `TABS`**

Current:
```tsx
// src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RiStickyNoteLine, RiTaskLine, RiTicketLine } from 'react-icons/ri';
import { SidebarProvider } from './context/SidebarContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { LeftSidebar } from './components/layout/LeftSidebar';
// import { RightSidebar } from './components/layout/RightSidebar'; // disabled — see README "Right sidebar" section to re-enable
import { MainContent } from './components/layout/MainContent';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import MiscPage from './pages/MiscPage';
import ContextPage from './pages/ContextPage';
import type { TabConfig } from './types/sidebar';

const TABS: TabConfig[] = [
  { label: 'Jira Tickets', path: '/tickets', icon: RiTicketLine },
  { label: 'Miscellaneous Tasks', path: '/misc', icon: RiTaskLine },
  { label: 'Context', path: '/context', icon: RiStickyNoteLine },
];
```

Change to:
```tsx
// src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RiMarkdownLine, RiStickyNoteLine, RiTaskLine, RiTicketLine } from 'react-icons/ri';
import { SidebarProvider } from './context/SidebarContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { LeftSidebar } from './components/layout/LeftSidebar';
// import { RightSidebar } from './components/layout/RightSidebar'; // disabled — see README "Right sidebar" section to re-enable
import { MainContent } from './components/layout/MainContent';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import MiscPage from './pages/MiscPage';
import ContextPage from './pages/ContextPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import type { TabConfig } from './types/sidebar';

const TABS: TabConfig[] = [
  { label: 'Jira Tickets', path: '/tickets', icon: RiTicketLine },
  { label: 'Miscellaneous Tasks', path: '/misc', icon: RiTaskLine },
  { label: 'Context', path: '/context', icon: RiStickyNoteLine },
  { label: 'Documents', path: '/documents', icon: RiMarkdownLine },
];
```

- [ ] **Step 2: Add the routes**

Current routes block:
```tsx
            <Routes>
              <Route path="/" element={<AppGrid />}>
                <Route index element={<Navigate to="/tickets" replace />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
                <Route path="misc" element={<MiscPage />} />
                <Route path="context" element={<ContextPage />} />
              </Route>
            </Routes>
```

Change to:
```tsx
            <Routes>
              <Route path="/" element={<AppGrid />}>
                <Route index element={<Navigate to="/tickets" replace />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
                <Route path="misc" element={<MiscPage />} />
                <Route path="context" element={<ContextPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="documents/:documentId" element={<DocumentDetailPage />} />
              </Route>
            </Routes>
```

- [ ] **Step 3: Verify**

Run: `cd client && npx tsc -b && npx eslint src/App.tsx`
Expected: no errors.

---

### Task 16: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full type-check**

Run: `cd client && npx tsc -b`
Expected: no output, exit code 0.

- [ ] **Step 2: Full lint**

Run: `cd client && npx eslint .`
Expected: no new errors/warnings. The pre-existing `react-refresh/only-export-components` warning on `SidebarContext.tsx`/`DataContext.tsx`/`ThemeContext.tsx` (their `use*` hook exports) is a known, already-confirmed non-regression — unrelated to this feature and not touched by it.

- [ ] **Step 3: Production build**

Run: `cd client && npm run build`
Expected: build succeeds, emits `dist/assets/*.css` and `dist/assets/*.js`.

- [ ] **Step 4: Manual browser verification checklist**

There is no browser/screenshot tool available in this environment to
perform this automatically — this step must be done by hand, the same
disclosed limitation that applied to every prior UI change in this
project. With both the backend (Task 6, Step 1) and `npm run dev`
running:

1. Open the app — confirm a "Documents" tab with a markdown icon appears
   in the left sidebar, below "Context".
2. Click it — `/documents` loads, shows the empty-state message if no
   documents exist yet.
3. Click "New Document", pick a real `.md` file from disk — confirm the
   title field auto-fills from the filename (minus extension) and is
   still editable before submitting. Submit.
4. Confirm a new card appears in the 3-column grid showing the title, a
   text snippet from the file's content, and "Updated <date>".
5. Click the card — confirm it navigates to `/documents/<id>` (a full
   page, not a modal) and the markdown renders as actual formatted HTML
   (headings, bold/italic, lists, links, and — if the test file has a
   table or `~~strikethrough~~` — those render correctly too, confirming
   `remark-gfm` is active).
6. Click "Edit", change the title and/or content text, save — confirm
   the detail page updates immediately and the change persists on a page
   reload.
7. Click "Delete", confirm — confirm it navigates back to `/documents`
   and the card is gone.
8. Reload the whole app and confirm documents persist (i.e., they're
   really being read from `server/data/documents.json`, not just kept in
   memory).
