from services.context_builder.builder import AdvancedMCPContextBuilder

def test_relevance_ordering():
    from usecases.context_builder.builder import AdvancedMCPContextBuilder

    builder = AdvancedMCPContextBuilder(query="safety norm")

    builder.add_document(
        title="A",
        content="This is about safety norm ABC",
        source="docA"
    )

    ctx = builder.build()
    assert "[C1]" in ctx
    assert "safety norm" in ctx.lower()
