from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import health, brands, detections, monitoring, dashboard, investigations, sources
from app.core.config import get_settings
from app.logos import ensure_logo_directory


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed on startup — idempotent, safe to run every time
    try:
        from app.database.session import SessionLocal
        from app.seed import seed_demo_data
        db = SessionLocal()
        seed_demo_data(db)
        db.close()
        print("[startup] seed complete")
    except Exception as e:
        print(f"[startup] seed skipped: {e}")
    yield


settings = get_settings()

app = FastAPI(title="BrandShield API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(brands.router, prefix="/api")
app.include_router(detections.router, prefix="/api")
app.include_router(investigations.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(sources.router, prefix="/api")

app.mount("/static/logos", StaticFiles(directory=ensure_logo_directory()), name="logos")