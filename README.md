# TaskBoard

A local, single-user task management app: Jira-style tickets, miscellaneous tasks, and freeform context notes — backed by plain JSON files on disk, no database, no accounts.

## Stack

- **Backend:** FastAPI (Python), JSON files in `server/data/`
- **Frontend:** React + TypeScript + Tailwind CSS (Vite), drag-and-drop via `@dnd-kit`

## Run it

Two terminals, run both:

```bash
cd server
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (defaults to `http://localhost:5173`). The backend runs on `http://localhost:8000`. Both have zero required configuration — `server/data/*.json` files are created automatically on first run.

## Project layout

```
server/             FastAPI app
  app/
    main.py         App entrypoint, CORS, router registration
    config.py       Paths and CORS origins
    models/         Pydantic request/response models
    services/       Storage (atomic JSON read/write) and business logic
    routers/        API route definitions
  data/             tickets.json, misc.json, context.json (auto-created)

client/             React + Vite app
  src/
    api/            Typed fetch client, one module per resource
    components/     Layout (sidebars), board (tickets/tasks), context, ui
    context/        DataProvider (app state), SidebarProvider
    pages/          TicketsPage, TicketDetailPage, MiscPage, ContextPage
    types/          Shared TS types
```

## Features

- **Jira Tickets** — 3-column card grid (priority, title, components, fix version); clicking a card opens a dedicated detail page (`/tickets/:ticketId`) with description, attachments, a details grid (priority/severity/components/labels/fix version/responsible team/associated group/ticket requester/detected-in-release), sub-tasks (a plain checklist — add one with a title and an optional Jira link, no assignee; toggle done/not-done with a checkbox; stored only in that ticket's `subtasks` list, nothing else on the ticket changes), a People panel (assignee/2nd assignee/reporter/votes/watchers), and a tabbed Comments/Work Log/History/Activity section (comments are fully functional; the others show honest empty states). Tickets are still served from our own mock backend — see [`docs/JIRA_INTEGRATION.md`](docs/JIRA_INTEGRATION.md) for how to swap this for the real Jira REST API later, including auto-filling sub-task details from the pasted link instead of typing them in.
- **Miscellaneous Tasks** — key-less tasks with status, drag-to-reorder, per-task checklist with drag-to-reorder, shown as a list with a detail modal
- **Context** — title, description, summary, free-text tags rendered as pills, filter by tag
- All writes go through an in-process lock per file and a temp-file + atomic rename, so concurrent requests can't corrupt the JSON files

## Right sidebar (currently disabled)

The right sidebar (`client/src/components/layout/RightSidebar.tsx`) shows a
collapsible "Recent Activity" feed — the 20 most recently updated tickets,
misc tasks, and context entries, merged and sorted by `updatedAt`. It's not
deleted, just switched off because it wasn't needed for now.

What's disabled, all in `client/src/App.tsx`:
- The `import { RightSidebar } from './components/layout/RightSidebar';` line
- `isRightOpen` is no longer destructured from `useSidebarCtx()`, and the
  `rightW` width calculation is removed
- The `<div>` wrapping `<RightSidebar />` in `AppGrid` is commented out

To re-enable it:
1. Uncomment the import.
2. Restore `const { isRightOpen } = useSidebarCtx();` and
   `const rightW = isRightOpen ? 280 : 60;`.
3. Uncomment the right-sidebar `<div>` block in `AppGrid` (it's left in place
   as a comment with the exact code to restore).

Note: the left sidebar (`client/src/components/layout/LeftSidebar.tsx`) is no
longer collapsible — it has a fixed 240px width and no toggle button, and
`SidebarContextValue`/`useSidebar()` no longer track `isLeftOpen`/`toggleLeft`
at all (only the right sidebar's open state remains, for the restore above).

Nothing else needs to change — `RightSidebar.tsx`, `useSidebar.ts`, and
`types/sidebar.ts` (`isRightOpen`/`toggleRight`) were left untouched, so the
component and its state are ready to go as soon as it's wired back into
`AppGrid`.

## Notes

- No authentication — this is built for local, single-user use on one machine.
- To reset all data, stop the backend and replace the contents of the files in `server/data/` with their empty defaults (`{"tickets": []}`, `{"tasks": []}`, `{"entries": []}`), or just delete them — they'll be recreated on the next backend start.
