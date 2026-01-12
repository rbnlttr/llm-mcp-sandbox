from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from core.config import settings
from services.file_extractor import FileExtractor
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter()

extractor = FileExtractor()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process a document"""
    try:
        content = await file.read()
        filename = file.filename.lower()

        # Extract text based on file type
        if filename.endswith('.pdf'):
            text = extractor.extract_from_pdf(content)
        elif filename.endswith('.docx'):
            text = extractor.extract_from_docx(content)
        elif filename.endswith('.doc'):
            raise HTTPException(status_code=400, detail="DOC format not supported, use DOCX")
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            text = extractor.extract_from_xlsx(content)
        elif filename.endswith('.pptx'):
            text = extractor.extract_from_pptx(content)
        elif filename.endswith('.txt'):
            text = content.decode('utf-8')
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Save file to upload directory
        file_path = settings.UPLOAD_DIR / file.filename
        settings.UPLOAD_DIR.mkdir(exist_ok=True)

        with open(file_path, 'wb') as f:
            f.write(content)

        return {
            "filename": file.filename,
            "content": text,
            "size": len(content),
            "status": "processed"
        }

    except Exception as e:
        logger.error(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")