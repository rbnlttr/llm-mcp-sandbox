from services.llm.base import LLMClient as LLM
from services.context_builder.production_builder import ProductionMCPContextBuilder
from services.answer_validator import CitationValidator

class ChatService:

    def __init__(self, llm: LLM):
        self.llm = llm
        self.validator = CitationValidator()

    async def chat(self, message: str, context_builder: ProductionMCPContextBuilder):
        response = await self.llm.chat(message, context_builder.build())
        # valid_ids = {c.id for c in context_builder.citations.all()}
        # self.validator.validate(response["response"], valid_ids)
        return response
        