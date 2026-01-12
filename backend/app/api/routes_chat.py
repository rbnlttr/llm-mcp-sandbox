from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from api.dependencies import get_chat_service
from core.models import ChatRequest, ChatResponse
from core.config import settings
from services.document_service import DocumentService
from services.context_builder.production_builder import ProductionMCPContextBuilder
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

doc_service = DocumentService()

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, service = Depends(get_chat_service),):
    logger.info(f"Chat request: message='{req.message[:50]}...', documents={len(req.documents)}, include_project={req.include_project}, include_reference={req.include_reference}")
    
    builder = ProductionMCPContextBuilder(query=req.message)

    for doc in req.documents:
        builder.add_document(
            title=doc.name,
            content=doc.content,
            source="upload"
        )

    if req.include_project:
        data = doc_service.scan_directory(settings.PROJECT_DIR, apply_version_filtering=True)
        logger.info(f"Added {len(data['files'])} project files")
        for f in data["files"]:
            builder.add_document(
                title=f["path"],
                content=f["content"],
                source=str(settings.PROJECT_DIR / f["path"])
            )

    if req.include_reference:
        data = doc_service.scan_directory(settings.REFERENCE_DIR, apply_version_filtering=True)
        logger.info(f"Added {len(data['files'])} reference files")
        for f in data["files"]:
            builder.add_document(
                title=f["path"],
                content=f["content"],
                source=str(settings.REFERENCE_DIR / f["path"])
            )

    try:
        result = await service.chat(req.message, builder)
        logger.info(f"Chat response: model={result.get('model')}, usage={result.get('usage')}")
        return result
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return {"response": f"Validation Error: {str(e)}", "model": "error", "usage": {"input_tokens": 0, "output_tokens": 0}}
    except Exception as e:
        logger.error(f"Unexpected error in chat: {e}", exc_info=True)
        return {"response": f"Internal Error: {str(e)}", "model": "error", "usage": {"input_tokens": 0, "output_tokens": 0}}

@router.get("/directories/project")
async def get_project_directory():
    """Get project directory contents with version filtering."""
    result = doc_service.scan_directory(
        settings.PROJECT_DIR,
        apply_version_filtering=True  # Enable V/X filtering
    )
    return {
        "path": str(settings.PROJECT_DIR),
        "files": result["files"],
        "total_size": result["total_size"],
        "file_count": result["file_count"]
    }

@router.get("/directories/reference")
async def get_reference_directory():
    """Get reference directory contents with version filtering."""
    result = doc_service.scan_directory(
        settings.REFERENCE_DIR,
        apply_version_filtering=True  # Enable V/X filtering
    )
    return {
        "path": str(settings.REFERENCE_DIR),
        "files": result["files"],
        "total_size": result["total_size"],
        "file_count": result["file_count"]
    }

@router.post("/directories/refresh")
async def refresh_directories():
    """Manually refresh directory cache."""
    project = doc_service.scan_directory(
        settings.PROJECT_DIR,
        apply_version_filtering=True
    )
    reference = doc_service.scan_directory(
        settings.REFERENCE_DIR,
        apply_version_filtering=True
    )
    
    return {
        "project": {
            "file_count": project["file_count"],
            "total_size": project["total_size"]
        },
        "reference": {
            "file_count": reference["file_count"],
            "total_size": reference["total_size"]
        }
    }
