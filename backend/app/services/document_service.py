from pathlib import Path
from typing import Dict, List
from datetime import datetime
import logging

from .version_handler import VersionHandler
from utils.file_extractors import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_xlsx,
    extract_text_from_pptx
)

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for scanning and processing documents."""
    
    SUPPORTED_EXTENSIONS = {
        '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx',
        '.txt', '.md', '.py', '.js', '.java', '.cpp', '.c', 
        '.h', '.cs', '.go', '.rs', '.json', '.yaml', '.yml'
    }
    
    def __init__(self):
        self.version_handler = VersionHandler()
    
    def extract_text_from_file(self, file_path: Path) -> str:
        """Extract text from any supported file."""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            filename = file_path.name.lower()
            
            if filename.endswith('.pdf'):
                return extract_text_from_pdf(content)
            elif filename.endswith('.docx'):
                return extract_text_from_docx(content)
            elif filename.endswith('.xlsx') or filename.endswith('.xls'):
                return extract_text_from_xlsx(content)
            elif filename.endswith('.pptx'):
                return extract_text_from_pptx(content)
            elif filename.endswith(('.txt', '.md', '.py', '.js', '.java', 
                                   '.cpp', '.c', '.h', '.cs', '.go', '.rs',
                                   '.json', '.yaml', '.yml')):
                return content.decode('utf-8', errors='ignore')
            else:
                return f"[Unsupported file type: {filename}]"
                
        except Exception as e:
            logger.error(f"Error reading {file_path.name}: {e}")
            return f"[Error reading {file_path.name}: {str(e)}]"
    
    def scan_directory(
        self, 
        directory: Path, 
        max_files: int = 100,
        apply_version_filtering: bool = True
    ) -> Dict:
        """
        Scan directory and extract content from all supported files.
        
        Args:
            directory: Directory to scan
            max_files: Maximum number of files to process
            apply_version_filtering: If True, apply V/X version filtering
            
        Returns:
            Dict with files, total_size, and file_count
        """
        if not directory.exists():
            logger.warning(f"Directory does not exist: {directory}")
            return {"files": [], "total_size": 0, "file_count": 0}
        
        # Collect all supported files
        all_files = []
        for file_path in directory.rglob('*'):
            if file_path.is_file():
                if file_path.suffix.lower() in self.SUPPORTED_EXTENSIONS:
                    all_files.append(file_path)
        
        logger.info(f"Found {len(all_files)} supported files in {directory}")
        
        # Apply version filtering if enabled
        if apply_version_filtering:
            selected_files = self.version_handler.select_latest_versions(all_files)
        else:
            selected_files = all_files
        
        # Limit to max_files
        selected_files = selected_files[:max_files]
        
        # Process files
        files = []
        total_size = 0
        
        for file_path in selected_files:
            try:
                size = file_path.stat().st_size
                content = self.extract_text_from_file(file_path)
                relative_path = file_path.relative_to(directory)
                
                # Parse version for metadata
                version_info = self.version_handler.parse_version_from_filename(
                    file_path.name
                )
                
                file_data = {
                    "name": file_path.name,
                    "path": str(relative_path),
                    "size": size,
                    "content": content,
                    "modified": datetime.fromtimestamp(
                        file_path.stat().st_mtime
                    ).isoformat(),
                }
                
                # Add version metadata if present
                if version_info['has_v']:
                    file_data["version"] = '.'.join(
                        map(str, version_info['v_version'])
                    )
                    file_data["is_released"] = True
                    file_data["version_type"] = "V"
                elif version_info['has_x']:
                    file_data["version"] = '.'.join(
                        map(str, version_info['x_version'])
                    )
                    file_data["is_released"] = False
                    file_data["version_type"] = "X"
                else:
                    file_data["version"] = None
                    file_data["is_released"] = False
                    file_data["version_type"] = None
                
                files.append(file_data)
                total_size += size
                
            except Exception as e:
                logger.error(f"Error processing {file_path}: {e}")
        
        logger.info(
            f"Processed {len(files)} files from {directory}, "
            f"total size: {total_size} bytes"
        )
        
        return {
            "files": files,
            "total_size": total_size,
            "file_count": len(files)
        }