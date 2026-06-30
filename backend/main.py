from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import admin, assessment

app = FastAPI(
    title="Health Risk Assessment API",
    description=(
        "AI-powered health risk assessment and diagnostic test recommendation "
        "system for coal mine communities. Decision-support only — not a diagnostic tool."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment.router)
app.include_router(admin.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "health-risk-assessment-api"}
