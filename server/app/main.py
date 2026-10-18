import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.routes import router
from app.api.calendar import router as calendar_router
from app.api.skills import router as skills_router
from app.api.tasks import router as tasks_router
from app.api.tasks import subtask_router
from app.api.deadlines import router as deadlines_router
from app.api.backlog import router as backlog_router
from app.services.reminders import reminder_loop

@asynccontextmanager
async def lifespan(app):
    worker = asyncio.create_task(reminder_loop())
    yield
    worker.cancel()
    try:
        await worker
    except asyncio.CancelledError:
        pass

app = FastAPI(title='Onespace API', lifespan=lifespan)

app.include_router(router)
app.include_router(calendar_router)
app.include_router(skills_router)
app.include_router(tasks_router)
app.include_router(subtask_router)
app.include_router(deadlines_router)
app.include_router(backlog_router)
