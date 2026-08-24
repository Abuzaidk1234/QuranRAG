import re

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """        # 1. Query Expansion & History Awareness
        # We use a fast LLM for query rewriting so we don't wait for a reasoning model to 'think'.
        try:
            fast_llm = ChatGroq(model_name='llama-3.3-70b-versatile', api_key=os.getenv('GROQ_API_KEY'), temperature=0)
        except Exception:
            fast_llm = llm  # fallback to the requested model if missing

        history_aware_retriever = create_history_aware_retriever(
            fast_llm, temp_retriever, contextualize_q_prompt
        )"""

# Find the block to replace
pattern = r"# 1\. Query Expansion & History Awareness\s*# We use create_history_aware_retriever to rewrite short or contextual queries into detailed standalone search queries\.\s*history_aware_retriever = create_history_aware_retriever\(\s*llm, temp_retriever, contextualize_q_prompt\s*\)"

content = re.sub(pattern, replacement, content)

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)
