import pytest
from unittest.mock import AsyncMock
from app.services.chat_service import ChatService

@pytest.mark.asyncio
async def test_chat_service():
    llm = AsyncMock()
    llm.chat.return_value = {"response": "ok"}

    service = ChatService(llm)
    result = await service.chat("hi", context="test")

    assert result["response"] == "ok"
