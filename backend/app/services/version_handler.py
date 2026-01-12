import re
from pathlib import Path
from typing import List, Dict, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class VersionHandler:
    """
    Handles document versioning logic.
    Prefers released V-versions over draft X-versions.
    """
    
    @staticmethod
    def parse_version_from_filename(filename: str) -> Dict:
        """
        Parse version information from filename.
        
        Supported patterns:
        - document_V1.2.pdf (released version)
        - document_X0.5.pdf (draft version)
        - document_V2.0_X1.0.pdf (both versions present)
        - document-v1.0.pdf (lowercase v)
        
        Args:
            filename: The filename to parse
            
        Returns:
            Dict with version info: {
                'filename': str,
                'v_version': Optional[Tuple[int, int, int]],
                'x_version': Optional[Tuple[int, int, int]],
                'has_v': bool,
                'has_x': bool
            }
        """
        # Patterns für V-Version (freigegeben) und X-Version (Entwurf)
        v_pattern = r'[_\-\s]V(\d+)\.(\d+)(?:\.(\d+))?'
        x_pattern = r'[_\-\s]X(\d+)\.(\d+)(?:\.(\d+))?'
        
        v_match = re.search(v_pattern, filename, re.IGNORECASE)
        x_match = re.search(x_pattern, filename, re.IGNORECASE)
        
        result = {
            'filename': filename,
            'v_version': None,
            'x_version': None,
            'has_v': False,
            'has_x': False
        }
        
        if v_match:
            major, minor, patch = v_match.groups()
            result['v_version'] = (int(major), int(minor), int(patch or 0))
            result['has_v'] = True
            logger.debug(f"Found V-version in {filename}: {result['v_version']}")
        
        if x_match:
            major, minor, patch = x_match.groups()
            result['x_version'] = (int(major), int(minor), int(patch or 0))
            result['has_x'] = True
            logger.debug(f"Found X-version in {filename}: {result['x_version']}")
        
        return result

    @staticmethod
    def get_base_filename(filename: str) -> str:
        """
        Extract base filename without version suffix.
        
        Examples:
        - "specification_V1.2.pdf" -> "specification.pdf"
        - "doc_X0.5_final.docx" -> "doc_final.docx"
        - "report-v2.0.txt" -> "report.txt"
        
        Args:
            filename: The filename to process
            
        Returns:
            Base filename without version tags
        """
        # Remove version patterns (both V and X)
        base = re.sub(
            r'[_\-\s][VX]\d+\.\d+(?:\.\d+)?', 
            '', 
            filename, 
            flags=re.IGNORECASE
        )
        
        # Clean up double separators
        base = re.sub(r'[_\-]{2,}', '_', base)
        base = re.sub(r'^[_\-]+|[_\-]+$', '', base)
        
        return base

    def select_latest_versions(self, files: List[Path]) -> List[Path]:
        """
        Select latest version of each document.
        
        Logic:
        1. Group files by base name (without version)
        2. For each group:
           - If V-versions exist: use latest V-version
           - Else if X-versions exist: use latest X-version
           - Else: include file without version
        
        Args:
            files: List of file paths to filter
            
        Returns:
            List of selected file paths (latest versions only)
        """
        # Group files by base name
        file_groups = defaultdict(list)
        
        for file_path in files:
            # Get base name without extension and version
            base_name = self.get_base_filename(file_path.stem)
            extension = file_path.suffix
            full_base = f"{base_name}{extension}"
            
            version_info = self.parse_version_from_filename(file_path.name)
            version_info['path'] = file_path
            
            file_groups[full_base].append(version_info)
        
        selected_files = []
        
        for base_name, versions in file_groups.items():
            # Separate by version type
            v_versions = [v for v in versions if v['has_v']]
            x_versions = [v for v in versions if v['has_x'] and not v['has_v']]
            no_versions = [v for v in versions if not v['has_v'] and not v['has_x']]
            
            if v_versions:
                # Prefer latest V-version (released)
                latest = max(v_versions, key=lambda x: x['v_version'])
                selected_files.append(latest['path'])
                logger.info(
                    f"Selected V-version: {latest['path'].name} "
                    f"(V{'.'.join(map(str, latest['v_version']))})"
                )
                
            elif x_versions:
                # Use latest X-version (draft)
                latest = max(x_versions, key=lambda x: x['x_version'])
                selected_files.append(latest['path'])
                logger.info(
                    f"Selected X-version: {latest['path'].name} "
                    f"(X{'.'.join(map(str, latest['x_version']))})"
                )
                
            elif no_versions:
                # Include all files without version tags
                for v in no_versions:
                    selected_files.append(v['path'])
                    logger.info(f"Selected file without version: {v['path'].name}")
        
        logger.info(
            f"Version filtering: {len(files)} files -> "
            f"{len(selected_files)} selected"
        )
        
        return selected_files