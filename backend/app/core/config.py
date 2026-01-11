from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    use_local_llm: bool = True
    ollama_host: str = "http://ollama:11434"
    local_model: str = "llama3.2"
    anthropic_api_key: str | None = None

    upload_dir: Path = Path("./uploads")
    project_dir: Path = Path("./project")
    reference_dir: Path = Path("./reference")

    class Config:
        env_file = ".env"

settings = Settings()

