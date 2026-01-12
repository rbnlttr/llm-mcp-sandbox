from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes_chat import router as chat_router
from api.routes_health import router as health_router
from api.routes_models import router as models_router
from api.routes_upload import router as upload_router
from core.config import settings

app = FastAPI(title="LLM MCP Sandbox API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "LLM MCP Sandbox API",
        "local_llm_enabled": settings.USE_LOCAL_LLM,
        "project_dir": str(settings.PROJECT_DIR),
        "reference_dir": str(settings.REFERENCE_DIR),
        "uploads": str(settings.UPLOAD_DIR)
    }

app.include_router(chat_router)
app.include_router(health_router)
app.include_router(models_router)
app.include_router(upload_router)
