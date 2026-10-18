# Project maintenance

## Product scope and UI copy

Onespace is a personal tool used by its owner only. Keep interface copy direct and functional. Avoid marketing slogans, promotional hero sections, motivational filler, and brand taglines. Keep one short description under every page title (overview, calendar, deadlines, tasks, and backlog), along with item descriptions, factual counts, useful instructions, and clear empty states. Preserve the deadlines subtitle, “Keep your commitments in sight, and ahead of schedule.”

## Client

`main.tsx` only mounts React and loads fonts/styles. `App.tsx` composes the shell and selects the active page. `Sidebar` owns navigation presentation; pages own their content; item components share create/edit and row presentation across pages.

All pages use a viewport-height main area, a shared compact title/description bar, and independently scrolling content. Non-calendar pages use `components/layout/PageWorkspace.tsx` for a 240px internal sidebar and the main pane, matching DayFlow's layout. Narrow screens stack the inner sidebar above the content without collapsing the main navigation. Keep bottom breathing room inside the scrolling content pane. Tasks, deadlines, and backlog share working status/priority/date filters from `utils/itemFilters.ts`; Skills uses saved definitions as its internal navigation; Overview provides section links and today's items.

`useWorkspace` owns the current personal workspace session and coordinates API calls. Components receive explicit, typed subsets of its state and actions. Shared item types live in `types`; pure date and label helpers live in `utils`. The Axios instance lives in `api/client.ts`, so backend URL configuration has one home.

The three item-list destinations intentionally share `ItemsPage` because they use the same layout and behavior. Add a dedicated page when a destination gains its own workflow. Avoid copying the same list implementation into three files.

The Calendar page uses DayFlow's own views, toolbar, sidebar, and event dialogs. Do not recreate its forms, controls, or filters. `components/calendar/DayflowCalendar.tsx` owns native configuration and the persistence queue. `utils/dayflow.ts` converts native Temporal dates to/from JSON strings; types live in `types/dayflow.ts`. The calendar component is loaded lazily. Pin the Temporal polyfill to DayFlow's compatible 0.3.x version to avoid mixing incompatible date types.

Customize the calendar appearance with `utils/dayflowTheme.ts` (native color tokens) and `styles/dayflow.css` (Tailwind utilities applied to scoped native library selectors). Keep Geist, muted lavender accents, light borders, and compact controls consistent with the rest of Onespace. Preserve native positioning, event geometry, forms, and interactions when styling. Portaled DayFlow dialogs need narrowly targeted selectors because they render outside the wrapper.

The adapter listens to confirmed `subscribeEventChanges` events, skipping the `remote` source. This captures native create/update/delete, drag, resize, and batch operations. Visibility actions persist native calendar settings; keyboard undo persists the resulting snapshot. Keep failures visible and restore saved state using remote changes without triggering another write. Workspace event links navigate to the native event details rather than the custom item editor. Run `npm test` in `client` for serialization tests.

`styles/index.css` loads Tailwind CSS v4 and defines the font theme. Component layout, colors, spacing, states, and responsive behavior use Tailwind utilities directly in TSX. `styles/base.css` contains only global defaults in Tailwind's base layer, including the root rem scale and stable scrollbar gutter. Geist is bundled locally through its font import in `client/src/main.tsx`. To try another font, update that import and the `--font-sans` theme value; the whole app, including native DayFlow components and dialogs, inherits that setting.

Use complete, literal utility classes so Tailwind can discover them at build time. Do not construct utility names from fragments. Shared variants can use a typed map of complete class strings. Semantic marker classes on some components are only targets for Tailwind descendant/state variants; they have no separate CSS rules.

## Server

Dependency direction is routes → services/repository → configuration and models. Configuration resolves paths from its own file, so data and prompt locations do not depend on the terminal's working directory. Import application code through `app`; keep the top-level `main.py` as the stable Uvicorn entry point.

Item persistence goes through `repositories/json_store.py`. Native calendar settings are stored atomically in `server/data/calendars.json` by `services/calendar.py`, using the same process lock. Routes and the reminder service share that lock. Keep a read-modify-write operation inside that lock; do not bypass that lock or atomic writes. This design still requires a single server process.

AI instructions belong in `prompts`, while Python integration code belongs in `services`. Runtime data and secrets stay in `server/data` and `server/.env`, outside application source and version control.

Tests use a temporary JSON file and mocked email delivery. Run them from the root with `server/.venv/Scripts/python.exe -m unittest discover -s server/tests -t server`. Never point tests at the personal data file.

## Verification

After client changes, run `npm run build` in `client`. Use `npm run format` before finishing source edits. After backend changes, run the isolated test suite. Keep dependency updates accompanied by the corresponding lock files (`client/package-lock.json` and `server/requirements.lock.txt`).

## Skills

Skills inside Onespace are application records, separate from Codex agent skills. `pages/SkillsPage.tsx` manages definitions and action inputs; `components/skills/SkillResults.tsx` presents grouped issues. Definitions persist in `server/data/skills.json` through `repositories/skills.py`, sharing the item repository's process lock and atomic-write convention.

`api/skills.py` exposes CRUD and supported runs. `models/skill.py` validates definitions and run parameters. `services/jira.py` reads server-side connection settings and implements the deterministic, read-only Jira Server/Data Center release-components action. Project/release values are JQL-escaped; pagination is bounded, incomplete results are flagged, and upstream error bodies are never passed to the client. Use mocked HTTP responses in tests; do not test against company Jira or print credentials during routine verification.

Stored prose is not a general-purpose executor. New integrations need explicit actions, input validation, and service implementations. Until an LLM workflow is deliberately added, keep this distinction visible in the UI. Never put Jira credentials in client environment variables, skill definitions, logs, or responses.

## Tasks

`TasksPage` owns creation-period navigation, title/subtask search, and completion filters. `TaskRow` renders one title line and a single accordion layer of subtasks. `TaskComposer` handles the one-note create/edit form. `utils/taskFilters.ts` uses creation timestamps and local Monday-based weeks; All includes legacy tasks with unknown creation times. The shared row renderer uses `TaskRow` for task entries in Overview too.

`api/tasks.py` sends rough notes to `services/tasks.py` and its dedicated task-polishing prompt, then writes the normalized title through the existing JSON store. Task models enforce no description, deadline, or calendar schedule. Creation timestamps remain server-owned. Nested subtask structures are rejected. Existing legacy task data is hidden from scheduling rather than destructively migrated.

Task records in the JSON store contain only id, kind, title, status, priority, created_at and subtasks (plus the demo marker when applicable). Subtasks contain id, title, done and created_at. The shared items API supplies default fields for common client views without persisting those unused fields on tasks. Run python -m scripts.clean_task_store from server to clean legacy task records; only demo subtasks inherit missing timestamps from their fixture's creation time. Personal timestamps are never guessed.

Subtask creation and title edits use the shared polishing service with prompts/subtask_polishing.md and the parent task title as context. The subtask title PATCH endpoint updates only the title after polishing succeeds, preserving creation time and completion. Without an LLM key, notes receive whitespace cleanup; failures leave stored data unchanged.

Task priority is high, medium or low, defaulting to medium. The task polishing prompt extracts priority from the note; title edits preserve existing priority unless a new priority is specified. Explicit UI priority edits override inference and require no LLM call when the title is unchanged. Without an LLM key, explicit high/medium/low priority phrases are parsed locally. Sidebar priority filters combine with status, creation period and search. Subtasks do not have a separate priority.

Deadlines share the TasksPage filter layout, but use a dedicated DeadlineRow with title, description, priority, due date and edit/delete actions. They have no accordion or subtasks. Due periods use local dates; completed records sort below open deadlines. NoteComposer creates a deadline from one rough-note textarea through POST /api/deadlines and prompts/deadline_polishing.md. The backend extracts title, description, date, priority, contact and reminder interval. Without an LLM, it preserves the note and supports ISO dates, today/tomorrow and weekday phrases, plus explicit priority and reminder phrases. Missing or invalid dates fail without saving. Existing deadlines retain the structured editor for direct corrections. Shared subtask endpoints under /api/items support tasks and backlog items; /api/tasks subtask URLs remain compatible. Calendar and reminder storage are preserved.



Backlog shares the TasksPage filters and TaskRow accordion. Parent items have a title, description, priority, creation timestamp and status, with no due date. Date filters use creation time. NoteComposer creates a backlog item from one note via POST /api/backlog and prompts/backlog_polishing.md; existing items use the structured editor. Backlog subtasks use BacklogSubtask with description, id, done and created_at only. Creation and editing use backlog_subtask_polishing.md; description edits preserve timestamps and completion. Legacy subtask titles are converted to descriptions without losing their text. The compact JSON writer retains only used backlog attributes, and shared list responses fill common view defaults. Task subtasks still require titles and deadlines have no subtasks.

CalendarPage reloads its feed when workspace items change. DayflowCalendar reconciles incoming records through calendarEventChanges after pending local saves, applying only remote additions/updates/removals so hydration does not trigger persistence. Day/week views explicitly show all-day records, including date-only deadlines. read_settings restores a missing Deadlines calendar for legacy settings while preserving custom event calendars, visibility and groups. Deadline projection uses the stored record ID without creating duplicate event records; timed events and native metadata are unchanged.
