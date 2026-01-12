from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional

class Settings(BaseSettings):
    """Application settings."""
    
    # LLM Configuration
    OLLAMA_HOST: str = "http://ollama:11434"
    ANTHROPIC_API_KEY: Optional[str] = None
    USE_LOCAL_LLM: bool = True
    LOCAL_MODEL: str = "llama3.2"
    LLM_TIMEOUT: int = 600  # in seconds
    
    # Directory Configuration
    UPLOAD_DIR: Path = Path("/data/uploads")
    PROJECT_DIR: Path = Path("/data/project")
    REFERENCE_DIR: Path = Path("/data/reference")
    
    # Processing Configuration
    MAX_FILES_PER_DIRECTORY: int = 100
    ENABLE_VERSION_FILTERING: bool = True
    
    class Config:
        case_sensitive = True

settings = Settings()
