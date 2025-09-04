"""
Serve both frontend and backend from a single FastAPI application.
This is used for production deployments on Render.
"""
import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("=== War Room Full App Starting ===")
logger.info(f"Python version: {sys.version}")
logger.info(f"Current working directory: {os.getcwd()}")
logger.info(f"Script location: {__file__}")
logger.info(f"Environment: {os.environ.get('RENDER_ENV', 'development')}")

# Import the main FastAPI app
try:
    from main import app

    logger.info("Successfully imported main FastAPI app")
except Exception as e:
    logger.error(f"Failed to import main app: {e}")
    raise

# Get the frontend build directory
FRONTEND_BUILD_DIR = Path(__file__).parent.parent / "frontend" / "dist"
logger.info(f"Frontend build directory: {FRONTEND_BUILD_DIR}")
logger.info(f"Frontend build exists: {FRONTEND_BUILD_DIR.exists()}")

# Check if frontend build exists
if FRONTEND_BUILD_DIR.exists():
    # Mount static files (JS, CSS, images, etc.)
    assets_dir = FRONTEND_BUILD_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static")
        logger.info(f"Mounted static assets from {assets_dir}")
    else:
        logger.warning(f"Assets directory not found at {assets_dir}")

    # Serve index.html for all non-API routes (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes."""
        # Skip API routes
        if (
            full_path.startswith("api/")
            or full_path.startswith("ws/")
            or full_path in ["health", "docs", "redoc", "openapi.json"]
        ):
            return {"detail": "Not Found"}, 404

        # Serve index.html for all other routes
        index_path = FRONTEND_BUILD_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return {"detail": "Frontend not built"}, 404

else:
    logger.warning(f"Frontend build directory not found at {FRONTEND_BUILD_DIR}")
    logger.warning(
        "Frontend will not be served. Run 'npm run build' in the frontend directory."
    )
    logger.info("API endpoints will still be available")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    logger.info(f"Starting server on port {port}")
    logger.info(f"Database URL configured: {'DATABASE_URL' in os.environ}")
    logger.info(f"Redis URL configured: {'REDIS_URL' in os.environ}")

    uvicorn.run(
        "serve_full_app:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # No reload in production
        log_level="info",
    )
