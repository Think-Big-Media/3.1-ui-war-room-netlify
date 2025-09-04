"""
Simple AI Proxy Server for War Room
Handles OpenAI and Pinecone API calls from the frontend
"""
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx

app = FastAPI(title="War Room AI Proxy", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables - NO HARDCODED CREDENTIALS
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

# Validate required API keys at startup
if not OPENAI_API_KEY:
    print("⚠️ WARNING: OPENAI_API_KEY environment variable not set")
if not PINECONE_API_KEY:
    print("⚠️ WARNING: PINECONE_API_KEY environment variable not set")


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[int] = None


class ChatRequest(BaseModel):
    message: str
    context: Optional[List[ChatMessage]] = []
    include_documents: bool = True


class ChatResponse(BaseModel):
    message: str
    sources: Optional[List[dict]] = []
    usage: Optional[dict] = None


@app.get("/")
async def root():
    return {"message": "War Room AI Proxy is running", "status": "ok"}


@app.get("/health/openai")
async def health_openai():
    """Test OpenAI API connection"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 5,
                },
                timeout=10.0,
            )

            if response.status_code == 200:
                return {"connected": True, "model": "gpt-4o-mini"}
            else:
                return {
                    "connected": False,
                    "error": f"API error: {response.status_code}",
                }

    except Exception as e:
        return {"connected": False, "error": str(e)}


@app.post("/chat/message")
async def chat_message(request: ChatRequest):
    """Handle chat messages with AI"""

    # Mock sources based on L2_API.pdf content
    mock_sources = [
        {
            "title": "L2_API.pdf",
            "content": "The L2 DataMapping API provides access to comprehensive voter data including VM (voters), CM (constituents), AUTO (auto owners), and COM (consumers) collections with RESTful endpoints for searching and filtering.",
            "similarity": 0.94,
            "metadata": {"page": 4, "type": "pdf", "uploadedAt": "2024-01-30"},
        }
    ]

    try:
        # Prepare the messages for OpenAI
        messages = [
            {
                "role": "system",
                "content": "You are a campaign intelligence AI assistant for War Room. You have access to voter data APIs, campaign documents, and strategic insights. Provide concise, actionable responses focused on political campaign strategy and voter outreach.",
            }
        ]

        # Add context messages
        for msg in request.context[-5:]:  # Last 5 messages for context
            messages.append({"role": msg.role, "content": msg.content})

        # Add current message with document context if requested
        if request.include_documents:
            enhanced_message = f"{request.message}\\n\\nContext: Based on uploaded campaign documents including L2 voter data API documentation, provide insights relevant to political campaign strategy and voter targeting."
        else:
            enhanced_message = request.message

        messages.append({"role": "user", "content": enhanced_message})

        # Call OpenAI API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, detail=f"OpenAI API error: {response.status_code}"
                )

            result = response.json()
            ai_message = result["choices"][0]["message"]["content"]

            # Add sources if document search was requested
            sources = mock_sources if request.include_documents else []

            return ChatResponse(
                message=ai_message,
                sources=sources,
                usage={
                    "promptTokens": result["usage"]["prompt_tokens"],
                    "completionTokens": result["usage"]["completion_tokens"],
                    "totalTokens": result["usage"]["total_tokens"],
                },
            )

    except Exception as e:
        # Fallback response
        fallback_message = f"I understand you're asking about '{request.message}'. Based on the campaign data available, I can provide strategic insights. However, I'm currently experiencing connectivity issues with the AI services. Please try again in a moment."

        return ChatResponse(
            message=fallback_message,
            sources=mock_sources if request.include_documents else [],
            usage={"promptTokens": 0, "completionTokens": 0, "totalTokens": 0},
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
