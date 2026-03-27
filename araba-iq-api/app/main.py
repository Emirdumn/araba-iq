from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import brands, cars, health, market, recommendations, scoring, segments, vehicle_models, sahibinden
from app.core.config import settings

app = FastAPI(
    title=settings.project_name,
    description=f"{settings.segmento_tagline}. Piyasa özeti ve araç kıyaslama API’si (MVP).",
    version="0.1.0",
)

_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
if _origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(health.router)
app.include_router(segments.router, prefix=settings.api_v1_prefix)
app.include_router(brands.router, prefix=settings.api_v1_prefix)
app.include_router(vehicle_models.router, prefix=settings.api_v1_prefix)
app.include_router(cars.router, prefix=settings.api_v1_prefix)
app.include_router(market.router, prefix=settings.api_v1_prefix)
app.include_router(scoring.router, prefix=settings.api_v1_prefix)
app.include_router(recommendations.router, prefix=settings.api_v1_prefix)
app.include_router(sahibinden.router, prefix=settings.api_v1_prefix)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "product": settings.project_name,
        "engine": "Segmento",
        "docs": "/docs",
        "api": settings.api_v1_prefix,
    }
