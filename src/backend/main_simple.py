"""
Simplified main entry point with better error handling
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Simplified lifespan without external dependencies"""
    logger.info("Starting up War Room backend (simplified)...")
    logger.info(f"Python path: {sys.path}")
    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"PORT: {os.getenv('PORT', 'not set')}")
    yield
    logger.info("Shutting down War Room backend...")


# Create FastAPI app
app = FastAPI(
    title="War Room API",
    version="1.0.0",
    description="War Room Campaign Management Platform",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Basic routes
@app.get("/")
async def root():
    return {
        "message": "War Room API is running!",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/monitoring/health",
    }


@app.get("/api/v1/monitoring/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "war-room-api",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "database": "not connected (migrations disabled)",
        "cache": "not connected (simplified mode)",
    }


# Try to import and include the main API router
try:
    from api.v1.api import api_router

    app.include_router(api_router, prefix="/api/v1")
    logger.info("Successfully loaded API routes")
except Exception as e:
    logger.error(f"Could not load API routes: {e}")

    @app.get("/api/v1/error")
    async def error_info():
        return {
            "error": "API routes could not be loaded",
            "details": str(e),
            "message": "The API is running in limited mode",
        }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
