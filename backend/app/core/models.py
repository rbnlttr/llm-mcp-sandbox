from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Document(BaseModel):
    name: str
    content: str

class ChatRequest(BaseModel):
    message: str
    documents: List[Document] = []
    use_local: Optional[bool] = None
    include_project: bool = True
    include_reference: bool = True

class Usage(BaseModel):
    input_tokens: int
    output_tokens: int

class ChatResponse(BaseModel):
    response: str
    model: str
    llm_type: str
    usage: Usage
