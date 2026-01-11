from fastapi import APIRouter, Depends
from api.dependencies import get_chat_service
from core.models import ChatRequest
from core.config import settings
from services.directory import scan_directory
from services.context_builder.production_builder import ProductionMCPContextBuilder

router = APIRouter()

@router.post("/chat")
async def chat(req: ChatRequest, service = Depends(get_chat_service),):
    builder = ProductionMCPContextBuilder(query=req.message)

    for doc in req.documents:
        builder.add_document(
            title=doc.name,
            content=doc.content,
            source="upload"
        )

    if req.include_project:
        data = scan_directory(settings.project_dir)
        for f in data["files"]:
            builder.add_document(
                title=f["path"],
                content=f["content"],
                source=str(settings.project_dir / f["path"])
            )

    if req.include_reference:
        data = scan_directory(settings.reference_dir)
        for f in data["files"]:
            builder.add_document(
                title=f["path"],
                content=f["content"],
                source=str(settings.reference_dir / f["path"])
            )

    return await service.chat(req.message, builder)
