# Connecting Jira Tickets to the Real Jira API

## Status quo

The "Jira Tickets" resource in TaskBoard is currently **mock data**, served entirely
from our own backend (`server/data/tickets.json`) via `server/app/routers/tickets.py`.
Nothing in the app talks to Atlassian yet. This document tells you exactly what to
change when that becomes a real Jira-backed connection instead of manually-entered
tickets.

Read this top to bottom before touching code — the field mapping and the
read-vs-write decision affect almost every file listed below.

## Files involved today

| File | Current role |
|---|---|
| `server/app/models/ticket.py` | Pydantic schema for `Ticket`/`TicketCreate`/`TicketUpdate` + nested `TicketComment`/`TicketSubtask`/`TicketAttachment` |
| `server/app/services/collection_service.py` | Generic CRUD (`ChecklistCollectionService`) shared with Misc Tasks; tickets use it via `tickets_service` |
| `server/app/services/__init__.py` | Instantiates `tickets_store`/`tickets_service` pointed at `server/data/tickets.json` |
| `server/app/routers/tickets.py` | `/api/tickets` REST routes — list/create/update/delete/reorder/checklist/comments/subtasks |
| `server/data/tickets.json` | The mock data file itself |
| `client/src/types/resources.ts` | Frontend `Ticket` type |
| `client/src/api/tickets.ts` | Frontend API client (`ticketsApi`) |
| `client/src/components/board/TicketCard.tsx`, `TicketBoard.tsx`, `TicketForm.tsx`, `client/src/pages/TicketDetailPage.tsx` | UI — these should need **no changes** if the field mapping below is respected, since they only consume the `Ticket` shape, not its data source |

## Step 0 — decide: mirror (read-only) or two-way sync?

Pick one before writing any code, because it changes the architecture:

- **Mirror (recommended to start)**: TaskBoard reads from Jira and caches locally;
  edits made in TaskBoard (status, comments, etc.) are pushed to Jira but the
  source of truth for everything else stays in Jira. Simpler, safer, matches "I
  will be connecting a Jira ticket instead of adding details manually."
- **Two-way sync**: Jira and TaskBoard are kept eventually-consistent in both
  directions, including fields like priority/components/assignee. Needs webhooks
  or polling plus conflict handling. Only do this if TaskBoard needs to be a true
  alternate editor for Jira issues, not just a viewer/commenter.

Everything below assumes **Mirror**.

## Step 1 — auth

Jira Cloud REST API v3 uses **Basic Auth with an API token** for this kind of
single-user, local tool (OAuth 2.0 3LO is overkill unless you're distributing this
to other people's Atlassian accounts).

1. Generate a token at `https://id.atlassian.com/manage-profile/security/api-tokens`.
2. Add to `server/app/config.py`:
   ```python
   import os

   JIRA_BASE_URL = os.environ.get("JIRA_BASE_URL", "")          # e.g. https://yourcompany.atlassian.net
   JIRA_EMAIL = os.environ.get("JIRA_EMAIL", "")
   JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
   ```
3. **Never commit the token.** Put it in a local `.env` (gitignored) and load it
   with `python-dotenv`, or just export it in the shell before running uvicorn.
4. Every request needs header `Authorization: Basic base64(email:token)` — most
   HTTP clients (httpx, requests) accept `auth=(email, token)` directly and do
   this for you.

## Step 2 — the Jira endpoints you need

| Purpose | Endpoint |
|---|---|
| Search/list issues | `GET /rest/api/3/search?jql=...&startAt=&maxResults=&fields=...` |
| Get one issue | `GET /rest/api/3/issue/{issueIdOrKey}?fields=...` |
| Add a comment | `POST /rest/api/3/issue/{issueIdOrKey}/comment` |
| List comments | `GET /rest/api/3/issue/{issueIdOrKey}/comment` |
| Update an issue (if doing any push-back) | `PUT /rest/api/3/issue/{issueIdOrKey}` |
| Transition status | `POST /rest/api/3/issue/{issueIdOrKey}/transitions` (status can't be set via plain field update — Jira workflows require a transition call) |
| List attachments | included in issue `fields.attachment[]`; binary download via `GET /rest/api/3/attachment/content/{id}` |

Pagination: `search` returns `startAt`/`maxResults`/`total`; loop until you've
fetched `total` issues. Rate limits: Jira Cloud returns `429` with a
`Retry-After` header — implement basic exponential backoff around all calls.

Use a JQL filter scoped to whatever project/board this tool should show, e.g.
`project = TPL ORDER BY updated DESC`.

## Step 3 — field mapping

This is the part that matters most. Our `Ticket` model
(`server/app/models/ticket.py`) and `client/src/types/resources.ts` must keep
these exact field names — map Jira's response into this shape rather than
renaming our fields to match Jira's.

| Our field | Jira source | Notes |
|---|---|---|
| `key` | `key` (e.g. `TPL-126`) | Use this as the stable identifier — see Step 4 |
| `title` | `fields.summary` | |
| `description` | `fields.description` | Jira Cloud v3 returns **Atlassian Document Format (ADF)**, not plain text. You need an ADF→plain-text (or ADF→markdown) renderer; don't try to regex it |
| `status` | `fields.status.name` | Jira's workflow statuses are project-specific free text (e.g. "Awaiting Feedback"), not our 3-value enum. Either (a) widen our `Status` type to a free string for Jira-sourced tickets, or (b) maintain a per-project status→`todo`/`in_progress`/`done` mapping table. Don't silently collapse statuses you haven't mapped — log/flag unmapped ones |
| `priority` | `fields.priority.name` | Jira's priority names vary by instance config; map them onto our `Priority` enum or widen it the same way as `status` |
| `severity` | *(no standard Jira field)* | Only exists if your Jira instance has a custom field for it — find its `customfield_xxxxx` id via `GET /rest/api/3/field` and map it explicitly |
| `resolution` | `fields.resolution.name` (nullable → `"Unresolved"`) | |
| `components` | `fields.components[].name` | |
| `labels` | `fields.labels` | |
| `fixVersion` | `fields.fixVersions[0].name` | Jira's field is actually multi-valued (`fixVersions[]`); we kept ours single-valued for the UI. If you need more than one, change `fixVersion: str` to `fixVersions: list[str]` in both the Pydantic model and `resources.ts`, and update `TicketCard`/`TicketDetailPage` accordingly |
| `responsibleTeam`, `associatedGroup`, `ticketRequester`, `detectedInRelease` | custom fields, instance-specific | Same as `severity` — look up the `customfield_xxxxx` ids for your Jira instance |
| `assignee` / `secondAssignee` / `reporter` | `fields.assignee.displayName` / custom field / `fields.reporter.displayName` | Jira only has one built-in assignee; "2nd assignee" is necessarily a custom field if it exists at all |
| `votes` | `fields.votes.votes` | |
| `watchers` | `fields.watches.watchCount` | |
| `attachments` | `fields.attachment[]` → `{id, filename, size, created}` | Map `size` (bytes) to our `sizeKb` (divide by 1024) |
| `subtasks` | `fields.subtasks[]` | Each entry only has `key`/`fields.summary`/`fields.status`; fetch each subtask issue (or use `fields` param with `expand=subtasks`) if you need its assignee too |
| `subtasks[].jiraLink` | issue URL, e.g. `{JIRA_BASE_URL}/browse/{key}` | Added for the manual "Add sub-task" flow (paste a Jira link — optional — and type a title; see `POST /api/tickets/{id}/subtasks`, `TicketDetailPage.tsx`'s add-sub-task form). A sub-task is just a checklist item: `title` + `done` (boolean, toggled via checkbox, never typed) + optional `jiraLink`. Today the link is just stored as a plain string; once real Jira access exists, replace the manual title entry with an actual `GET /rest/api/3/issue/{key}` fetch keyed off the parsed link, and auto-fill `title` instead of asking the user to type it |
| `comments` | `fields.comment.comments[]` or the dedicated comment endpoint | `body` is also ADF — convert it the same way as `description` |
| `order` | *(no Jira equivalent)* | Keep this as a local-only field for whatever ordering TaskBoard wants to show; don't try to derive it from Jira |
| `checklist` | *(no Jira equivalent — legacy field)* | Stays local-only, not Jira-sourced. This field is unrelated to Jira's native subtasks; see note below |

**Important distinction already baked into the schema:** `checklist` (used only by
the old generic `ResourceDetailModal`, not shown on the ticket detail page) and
`subtasks` (shown on the ticket detail page, read-only) are two different
concepts. When you wire up real Jira data, only `subtasks` should be populated
from Jira's `fields.subtasks`. Leave `checklist` alone — it's vestigial for
tickets once Jira is connected, kept only for backward schema compatibility with
the shared collection service.

## Step 4 — identifiers

Right now every ticket gets a local `uuid4` as `id`, and `/api/tickets/{id}`
routes by that uuid. Once tickets come from Jira, **switch to using the Jira
`key` (e.g. `TPL-126`) as the `id`** — it's stable, human-readable, and matches
what's in the URL/breadcrumb already. Concretely:
- When upserting a synced issue locally, set `id = jira_key` instead of
  generating a uuid.
- `client/src/pages/TicketDetailPage.tsx`'s `useParams().ticketId` and the
  `/tickets/:ticketId` route in `client/src/App.tsx` don't need to change — they're
  already just matching against whatever string is in `ticket.id`.

## Step 5 — suggested backend architecture

1. Add `server/app/services/jira_client.py`: a thin `httpx.Client` wrapper with
   `search_issues(jql)`, `get_issue(key)`, `add_comment(key, body)`, with
   built-in retry/backoff on 429.
2. Add `server/app/services/jira_sync.py`: pulls issues via JQL, runs them through
   the field mapping in Step 3, and **upserts** them into the existing
   `tickets_store` JSON file (keep the local JSON cache — it's what makes the UI
   fast and offline-tolerant; don't proxy every list request live to Jira).
3. Expose a manual sync trigger, e.g. `POST /api/tickets/sync`, that calls
   `jira_sync.run()`. A scheduled background sync (e.g. every few minutes via
   `BackgroundTasks` or APScheduler) can be layered on later — don't build that
   until manual sync is proven correct.
4. In `server/app/routers/tickets.py`, change `add_comment` to also call
   `jira_client.add_comment(ticket_key, body)` so comments actually land in Jira,
   not just the local cache. Set `author` from the authenticated Jira user
   (`fields.author.displayName` on the response) instead of the hardcoded
   `"You"` constant.
5. Decide whether `update_ticket` (status/resolution dropdowns on the detail
   page) should push back to Jira. If yes: status changes need Jira's
   *transitions* endpoint (Step 2), not a plain field PATCH — look up valid
   transitions via `GET /rest/api/3/issue/{key}/transitions` first, since Jira
   workflows restrict which status changes are legal from the current state.
6. Update `add_subtask` (used by `POST /api/tickets/{id}/subtasks`) to parse the
   issue key out of the pasted `jiraLink`, call
   `jira_client.get_issue(key)`, and populate `title` from the response instead
   of trusting the manually-typed field (`done` still defaults to `false` and is
   only ever changed locally via the checkbox/`PATCH .../subtasks/{subtask_id}`,
   not synced from Jira's own subtask status). Keep the endpoint signature the
   same — `client/src/pages/TicketDetailPage.tsx`'s add-sub-task form just stops
   sending `title` and only sends `jiraLink` once this is in place.
7. Optional, later: register a Jira Cloud **webhook**
   (`issue_updated`/`comment_created`) pointed at a new
   `POST /api/tickets/webhook` route, so changes made in Jira itself show up in
   TaskBoard without waiting for the next poll. Only worth it once polling sync
   is working and you find the polling interval too slow.

## Step 6 — what stays untouched

- `client/src/components/board/TicketCard.tsx`, `TicketBoard.tsx`,
  `TicketForm.tsx`, `client/src/pages/TicketDetailPage.tsx`: these only consume
  the `Ticket` shape. As long as the field mapping in Step 3 fills in real values
  for the fields they read, no UI changes are needed.
- The Misc Tasks and Context resources are completely unrelated to this work —
  don't touch `MiscPage.tsx`, `ContextPage.tsx`, or the generic
  `ResourceBoard`/`ResourceCard`/`ResourceForm`/`ResourceDetailModal` components.
- `ChecklistCollectionService` stays as-is; the sync layer should sit in front of
  it (calling `.update()`/`.create()` under the hood for the local cache), not
  replace it.

## Migration checklist

- [ ] Decide mirror vs two-way sync (Step 0)
- [ ] Set up `JIRA_BASE_URL` / `JIRA_EMAIL` / `JIRA_API_TOKEN` env vars, never committed
- [ ] Look up any custom field ids your Jira instance uses for severity / responsible team / associated group / ticket requester / detected-in-release
- [ ] Build an ADF → plain text/markdown converter for `description` and comment bodies
- [ ] Decide how to map Jira's free-text `status`/`priority` values onto our enums (widen the enum, or build a mapping table — flag unmapped values loudly, don't silently drop them)
- [ ] Add `jira_client.py` + `jira_sync.py`
- [ ] Switch `id` generation to use the Jira `key`
- [ ] Wire `POST /api/tickets/{id}/comments` to also post to Jira
- [ ] Wire `POST /api/tickets/{id}/subtasks` to fetch by `jiraLink` instead of trusting manually-typed title/status/assignee
- [ ] Add a manual `POST /api/tickets/sync` trigger; verify it end-to-end against one real project before automating it
- [ ] Only then consider scheduled sync / webhooks
