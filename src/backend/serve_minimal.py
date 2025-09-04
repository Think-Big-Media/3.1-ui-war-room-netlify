"""
Minimal FastAPI server for testing Render deployment.
This bypasses database/Redis connections to verify basic deployment works.
"""
import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("=== War Room Minimal Server Starting ===")
logger.info(f"Python version: {sys.version}")
logger.info(f"Working directory: {os.getcwd()}")

# Create minimal FastAPI app
app = FastAPI(
    title="War Room API (Minimal)",
    description="Minimal deployment test",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the frontend build directory
FRONTEND_BUILD_DIR = Path(__file__).parent.parent / "frontend" / "dist"
logger.info(f"Frontend directory: {FRONTEND_BUILD_DIR}")
logger.info(f"Frontend exists: {FRONTEND_BUILD_DIR.exists()}")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Render."""
    return {
        "status": "healthy",
        "service": "war-room-minimal",
        "frontend_available": FRONTEND_BUILD_DIR.exists(),
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "War Room API (Minimal)",
        "version": "1.0.0",
        "status": "operational",
        "message": "Minimal deployment successful!",
    }


# API test endpoint
@app.get("/api/v1/test")
async def api_test():
    """Test API endpoint."""
    return {"message": "API is working!"}


# Mount frontend if available
if FRONTEND_BUILD_DIR.exists():
    assets_dir = FRONTEND_BUILD_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static")
        logger.info(f"Mounted static assets from {assets_dir}")

    # Serve index.html for all non-API routes (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes."""
        # Skip API routes
        if full_path.startswith("api/") or full_path.startswith("health"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)

        # Serve index.html for all other routes
        index_path = FRONTEND_BUILD_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return JSONResponse({"detail": "Frontend not built"}, status_code=404)

else:
    logger.warning("Frontend not found - serving API only")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    logger.info(f"Starting minimal server on port {port}")

    uvicorn.run(
        "serve_minimal:app", host="0.0.0.0", port=port, reload=False, log_level="info"
    )
