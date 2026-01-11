from pydantic import BaseModel
from typing import List, Optional

class Document(BaseModel):
    name: str
    content: str

class ChatRequest(BaseModel):
    message: str
    documents: List[Document] = []
    use_local: Optional[bool] = None
    include_project: bool = True
    include_reference: bool = True
