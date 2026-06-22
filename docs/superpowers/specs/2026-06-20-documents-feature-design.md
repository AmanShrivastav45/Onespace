# Documents feature — design

Date: 2026-06-20

## Goal

Add a "Documents" resource to the TaskBoard app: users upload markdown
(`.md`) files, see them in a 3-column grid (mirroring the Jira Tickets
grid), and click through to a dedicated detail page (mirroring
`TicketDetailPage`'s routing pattern) where the markdown is rendered as
formatted HTML rather than shown as raw text.

## Scope decisions

- **Full CRUD.** Documents support rename/edit-content and delete, same
  parity as Tickets/Misc/Context — not just upload + view.
- **Title defaults to filename, editable afterward.** On upload, the title
  auto-fills from the picked file's name (minus extension) and can be
  changed immediately or later via edit.
- **Grid card shows title + content snippet + updated date.** The snippet
  is a short auto-extracted plain-text preview (~120 chars, markdown syntax
  stripped) so cards are distinguishable at a glance, mirroring how the
  Ticket card previews title/components/fix-version.
- No git repo exists in this project; this spec is saved as a plain file,
  not committed.

## Data model & storage

New `server/data/documents.json`, default `{"documents": []}` — same
atomic JSON-file pattern (`JSONFileStore`) as every other resource.

```python
class Document(BaseModel):
    id: str
    title: str
    filename: str = ""      # original uploaded filename, kept for display even after a rename
    content: str            # raw markdown text
    createdAt: str
    updatedAt: str

class DocumentCreate(BaseModel):
    title: str
    filename: str = ""
    content: str

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
```

No `order`, `checklist`, `tags`, or `status` fields — not part of this
resource. List sorted by `createdAt` descending (newest first), same as
Context.

## Backend approach

Generalize `ContextService` (`server/app/services/context_service.py`)
into a `SimpleCollectionService(store, collection_key)`, threading
`collection_key` through its four methods (`list_items`, `create`,
`update`, `delete`) instead of hardcoding `"entries"`. This mirrors the
constructor pattern `ChecklistCollectionService` already uses
(`server/app/services/collection_service.py:24`), and avoids duplicating
~30 lines of proven CRUD logic into a near-identical new class.

`server/app/services/__init__.py` adds:

```python
documents_store = JSONFileStore(DOCUMENTS_FILE, default={"documents": []})
context_service = SimpleCollectionService(context_store, "entries")
documents_service = SimpleCollectionService(documents_store, "documents")
```

New router `server/app/routers/documents.py`, prefix `/api/documents`,
5 endpoints (list/create/update/delete — same shape as
`server/app/routers/context.py`, no sub-resource routes needed since
Documents have no comments/subtasks/checklist).

## Frontend structure

- `client/src/types/resources.ts` — add `Document` interface.
- `client/src/api/documents.ts` — `documentsApi` (`list/create/update/remove`),
  same shape as `client/src/api/context.ts`.
- `client/src/context/DataContext.tsx` — add `documents` state +
  `documentsController` as a hand-rolled `create`/`update`/`remove` object
  via `useMemo`, mirroring `contextController` exactly. (`useResourceController`
  doesn't fit here — it requires items to have `checklist`/`order` fields,
  which Tickets and Misc have but Documents don't; Context already
  established this hand-rolled pattern for fields-only resources.)
- `client/src/components/documents/DocumentCard.tsx` — grid card: title,
  snippet, updated date. Click navigates to `/documents/:id` (same pattern
  as `TicketCard`).
- `client/src/components/documents/DocumentForm.tsx` — two modes:
  - **Create**: file input (`accept=".md,.markdown"`) reads the picked
    file via `file.text()`, populating `content`/`filename`; title
    auto-fills from the filename the moment a file is picked but stays
    editable before submit.
  - **Edit**: title text input + content `<textarea>` (raw markdown,
    directly editable) — no file picker, consistent with how `ContextForm`
    edits its text fields in place.
- `client/src/pages/DocumentsPage.tsx` — 3-column grid
  (`grid grid-cols-3 gap-3`, same as `TicketBoard`), "New Document" button
  opens a `Modal` with `DocumentForm`.
- `client/src/pages/DocumentDetailPage.tsx` — dedicated route
  `/documents/:documentId` (a full page, not a modal, per the "open the
  same way Jira opened" requirement). Header with title/filename/dates +
  Edit/Delete buttons (same chrome as `TicketDetailPage`); body renders
  `content` through `<ReactMarkdown remarkPlugins={[remarkGfm]}>` inside a
  `bg-card border border-border rounded-sm p-5` panel. 404 (unknown/deleted
  id) renders the same "not found" empty-state pattern as
  `TicketDetailPage`.
- `client/src/App.tsx` — add a 4th `TabConfig` entry ("Documents",
  `/documents`, `RiMarkdownLine` from `react-icons/ri`, confirmed to exist
  in the already-installed package) and the two new `<Route>` entries.

## Markdown rendering

Add `react-markdown` + `remark-gfm` to `client/package.json`. Renders
markdown straight to React elements — no `dangerouslySetInnerHTML`
anywhere, so there's no HTML-injection surface to sanitize. Supports
GitHub-flavored markdown (tables, strikethrough, task-list checkboxes).

Rejected alternative: `marked` (markdown → HTML string) + `DOMPurify` +
`dangerouslySetInnerHTML`. Smaller/faster parser, but an XSS hole opens
the moment sanitization is forgotten anywhere — not worth the risk for a
feature whose entire point is rendering arbitrary uploaded text as HTML.

Add `@tailwindcss/typography` (the official Tailwind plugin built
specifically for styling rendered markdown/HTML) and use its `prose`
classes for the rendered body — this is its exact intended use case, and
a single well-maintained official plugin is simpler than hand-styling
headings/lists/tables/code blocks one by one.

## Error handling

No toast/error-banner system exists anywhere in this app today (confirmed
via `ContextForm.tsx` — failures just throw from the `api` client and
forms only track a local `submitting` boolean). Documents stay consistent
with that; no new error-UI pattern is introduced.

- File picker restricted to `.md`/`.markdown` via the `accept` attribute.
- Empty `content` is allowed (mirrors Context's `description`/`summary`
  defaulting to `""`) — title is the only required field, same rule
  already used for Tickets/Misc/Context (`!title.trim()` blocks submit).
- No artificial file-size limit — out of scope for this local,
  single-user, JSON-file-backed app.

## Verification plan

`tsc -b`, `eslint` on all new/touched files, `npm run build`, and backend
curl smoke tests (create/list/update/delete a document, with and without
content) against a temporary entry cleaned up afterward. As with every UI
change in this project so far, there is no browser tool available in this
environment to visually confirm the rendered markdown — verification is
CLI-level only (types, lint, build, API smoke tests).
