import os
from dotenv import load_dotenv

load_dotenv()

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.prompts.chat import MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_groq import ChatGroq

from langchain_core.runnables import RunnablePassthrough

llm = ChatGroq(model_name='llama-3.1-8b-instant', api_key=os.getenv('GROQ_API_KEY'), temperature=0)

system_prompt = "You are a bot. {language_directive} Context: {context}"
prompt_template = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
])

contextualize_q_system_prompt = "Rewrite the question."
contextualize_q_prompt = ChatPromptTemplate.from_messages([
    ("system", contextualize_q_system_prompt),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
])

# Dummy retriever
class DummyRetriever:
    def get_relevant_documents(self, query):
        from langchain_core.documents import Document
        return [Document(page_content="dummy doc")]
    def invoke(self, query, config=None, **kwargs):
        from langchain_core.documents import Document
        return [Document(page_content="dummy doc")]

history_aware_retriever = create_history_aware_retriever(
    llm, DummyRetriever(), contextualize_q_prompt
)

question_answer_chain = create_stuff_documents_chain(llm, prompt_template)
retrieval_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

# Test 1: Empty history
print("--- TEST 1: Empty History ---")
resp1 = retrieval_chain.invoke({
    "input": "Hello", 
    "chat_history": [],
    "language_directive": ""
})
print(resp1['answer'])

# Test 2: With history
print("--- TEST 2: With History ---")
resp2 = retrieval_chain.invoke({
    "input": "And what about the other thing?", 
    "chat_history": [HumanMessage(content="Hello"), AIMessage(content="Hi there!")],
    "language_directive": ""
})
print(resp2['answer'])

