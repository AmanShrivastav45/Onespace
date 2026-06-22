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
