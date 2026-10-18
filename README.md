# Onespace

A single-user work manager built with React, TypeScript, Tailwind CSS and FastAPI. Runtime records use local JSON files instead of a database.

## Run locally

Requires Node.js 20+ and Python 3.11+.

```powershell
python -m venv server/.venv
./server/.venv/Scripts/python.exe -m pip install -r server/requirements.txt
Copy-Item server/.env.example server/.env
./server/.venv/Scripts/python.exe -m uvicorn main:app --app-dir server --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
cd client
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies API requests to FastAPI on port 8000. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Features

- Overview of open work, upcoming deadlines and events.
- Tasks with single-line titles, priorities and one level of subtasks.
- Deadlines with titles, descriptions, due dates and optional email reminders. Deadlines have no subtasks.
- Backlog items with titles, descriptions and description-only subtasks.
- Sticky period/search controls and status/priority filters. Tasks and backlog use creation dates; deadlines use due dates.
- DayFlow calendar with day, week, month, year and agenda views. Existing events and deadlines share the calendar without duplicating stored records.
- Saved skills with reusable instructions and an optional read-only Jira release-components action.

Creation uses rough-note inputs. With an LLM configured, the backend extracts and polishes the relevant fields. Without one, basic cleanup, explicit priority phrases and limited deadline-date parsing are available. Existing records can be edited directly.

## Optional integrations

All credentials are configured on the backend through environment variables. The checked-in `server/.env.example` contains no credentials; copy it to a local `.env` file and fill in only the integrations needed.

### AI polishing

Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. Configured create/edit operations send the submitted note and relevant item context to the OpenAI API. Prompts are maintained in `server/prompts/`. Failed requests retain the unsaved input for retry.

### Jira

Set `JIRA_BASE_URL` to an HTTPS URL and `JIRA_TOKEN` to a token authorized for the intended instance. The default authentication mode is bearer; basic authentication additionally requires `JIRA_AUTH_MODE=basic` and `JIRA_USERNAME`. URLs containing embedded credentials are rejected. TLS verification remains enabled; use `SSL_CERT_FILE` for a trusted private certificate authority if required.

The initial generic release-components skill has blank project and release fields. Supply these in the UI before running it. The action makes read-only requests to `/rest/api/2/search`, querying the selected project and Fix Version, and groups matching issues by component. Requests are bounded and pagination errors are reported. Saved instructions are guidance, not arbitrary executable code. Jira work-log posting is not implemented.

### Email reminders

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` and `REMINDER_EMAIL`. Set `SMTP_USER` and `SMTP_PASSWORD` when authentication is required. SMTP uses STARTTLS. The background worker checks open deadlines once per minute while the server runs, using `APP_TIMEZONE`.

Delivery markers prevent routine duplicate reminders. A process failure between delivery and saving its marker can still produce a duplicate. Demo records do not send reminders.

## Data and calendar behavior

Runtime files are created under `server/data/` and are excluded from Git:

- `store.json`: tasks, deadlines, backlog items and calendar events.
- `skills.json`: saved skill definitions.
- `calendars.json`: calendar names, colors, groups and visibility.

Calendar events preserve native timing, descriptions and metadata. Date-only deadlines appear as all-day entries. Tasks and backlog items are excluded from the calendar. Changes in workspace data refresh the calendar through remote hydration without writing duplicate records.

The JSON store uses atomic replacement and a process lock. Run one backend worker. Back up runtime files separately. This application has no authentication and is intended for loopback/local use; committing its source does not make it suitable for public deployment.

## Optional demo data

New stores start empty apart from a generic skill template. Fixtures contain synthetic examples, role-based contacts and placeholder project identifiers.

From `server`, while the backend is stopped:

```powershell
./.venv/Scripts/python.exe -m scripts.seed_demo
./.venv/Scripts/python.exe -m scripts.seed_task_periods
```

Repeat runs avoid duplicate demo IDs. Remove demo records with `python -m scripts.seed_demo --remove`; user-created records are preserved. Runtime demo copies remain private and ignored, like all other runtime records.

## Verification

From `client`:

```powershell
npm run format:check
npm run build
npm test
```

From `server`:

```powershell
./.venv/Scripts/python.exe -m unittest discover -s tests
```

Tests use temporary stores and mocked external services. They do not require live credentials or company-network access.

## Repository layout

```text
client/src/
  api/             Shared Axios client
  components/      Layout, item forms/rows, calendar and skill views
  hooks/           Workspace state and actions
  pages/           Page composition and filters
  styles/          Tailwind styles and calendar overrides
  types/           Shared TypeScript types
  utils/           Date, filtering and calendar adapters
server/
  app/api/         FastAPI endpoints
  app/core/        Environment and path configuration
  app/models/      Request and record validation
  app/repositories/ JSON persistence
  app/services/    Polishing, calendar, Jira and reminder integrations
  prompts/         LLM instructions
  fixtures/        Synthetic, optional demo data
  scripts/         Demo seeding and maintenance
  tests/           Isolated backend tests
docs/architecture.md
```

Local environment files, runtime data, editor history, private keys, logs, build output and dependency folders are ignored. `.env.example` and dependency lock files are included. Review the files staged for a commit before pushing; ignore rules do not remove files already committed in another repository.
