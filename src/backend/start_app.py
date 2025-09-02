"""
Simple startup script to test Railway deployment
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="War Room API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "War Room API is running!"}


@app.get("/api/v1/monitoring/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "war-room-api",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
    }


@app.get("/docs")
async def redirect_docs():
    return {"message": "API docs available at /docs"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
