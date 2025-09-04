"""
Bulletproof FastAPI server that serves both frontend and backend.
Bypasses complex import chains that cause deployment failures.
Includes production-ready security hardening.
"""
import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Production-ready security headers middleware.
    Implements all security headers mentioned in HEALTH_CHECK_REPORT_20250808.md.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.security_headers = {
            # Content Security Policy - Prevent XSS attacks
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
                "img-src 'self' data: https: blob:; "
                "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; "
                "connect-src 'self' wss: https:; "
                "media-src 'self' data:; "
                "object-src 'none'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "upgrade-insecure-requests"
            ),
            # Prevent page embedding in frames - Clickjacking protection
            "X-Frame-Options": "DENY",
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",
            # Force HTTPS connections
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            # Control referrer information
            "Referrer-Policy": "strict-origin-when-cross-origin",
            # Limit browser permissions
            "Permissions-Policy": (
                "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
                "magnetometer=(), microphone=(), payment=(), usb=()"
            ),
            # Hide server information
            "Server": "War Room Analytics",
            # Cache control for security
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            # Prevent cross-domain policies
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-origin",
        }

    async def dispatch(self, request, call_next):
        """Add security headers to all responses."""
        try:
            response = await call_next(request)
            
            # Add security headers
            for header_name, header_value in self.security_headers.items():
                response.headers[header_name] = header_value
            
            # Add security headers based on response type
            if hasattr(response, 'media_type'):
                # For JSON API responses, add additional security
                if response.media_type == "application/json":
                    response.headers["X-Content-Type-Options"] = "nosniff"
                    response.headers["X-API-Version"] = "1.0"
            
            return response
            
        except Exception as e:
            logger.error(f"Security middleware error: {e}")
            # Return the response even if security header addition fails
            return await call_next(request)


logger.info("=== War Room Bulletproof Server Starting ===")
logger.info(f"Python version: {sys.version}")
logger.info(f"Working directory: {os.getcwd()}")
logger.info(f"Environment: {os.environ.get('RENDER_ENV', 'development')}")

# Create FastAPI app with minimal dependencies
app = FastAPI(
    title="War Room Full Stack",
    description="Unified frontend + backend service",
    version="1.0.0",
)

# Add security middleware FIRST (highest priority)
app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS with production-ready settings
# In production, this will be restricted to specific domains via render.yaml
allowed_origins = os.environ.get("BACKEND_CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization", 
        "X-Requested-With",
        "Accept",
        "Origin",
        "User-Agent",
        "X-CSRF-Token",
        "X-API-Version"
    ],
    expose_headers=["X-API-Version", "X-Rate-Limit-Remaining"],
)

# Get the frontend build directory (prefer repo root /dist; fallback to /src/dist)
REPO_ROOT_DIST = Path(__file__).parent.parent.parent / "dist"
SRC_DIST = Path(__file__).parent.parent / "dist"
FRONTEND_BUILD_DIR = REPO_ROOT_DIST if REPO_ROOT_DIST.exists() else SRC_DIST
logger.info(f"Frontend primary: {REPO_ROOT_DIST} (exists={REPO_ROOT_DIST.exists()})")
logger.info(f"Frontend fallback: {SRC_DIST} (exists={SRC_DIST.exists()})")
logger.info(f"Selected frontend directory: {FRONTEND_BUILD_DIR}")

# List build contents if it exists
if FRONTEND_BUILD_DIR.exists():
    build_files = list(FRONTEND_BUILD_DIR.glob("*"))
    logger.info(f"Build contains {len(build_files)} files/directories")
    for file in build_files[:5]:  # Show first 5 files
        logger.info(f"  - {file.name}")
else:
    logger.warning("⚠️ Frontend build directory does not exist!")


# Essential API endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint for Render."""
    return {
        "status": "healthy",
        "service": "war-room-bulletproof",
        "frontend_available": FRONTEND_BUILD_DIR.exists(),
        "version": "2.0.0",  # Bumped to prove deployment
        "deployment": "2025-08-11-OAUTH",
        "logo": "glassmorphic_WR"
    }


@app.get("/")
async def root():
    """Root endpoint - will be overridden by frontend SPA if available."""
    if FRONTEND_BUILD_DIR.exists():
        # Serve React app
        index_path = FRONTEND_BUILD_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)

    # Fallback API response
    return {
        "name": "War Room Full Stack",
        "version": "1.0.0",
        "status": "operational",
        "frontend": "available" if FRONTEND_BUILD_DIR.exists() else "not built",
        "api": "operational",
    }


# Basic API endpoints
@app.get("/api/v1/test")
async def api_test():
    """Test API endpoint."""
    return {"message": "API is working!", "timestamp": "2025-08-11"}


@app.get("/deployment-version")
async def deployment_version():
    """Simple endpoint to verify deployment."""
    version_file = Path(__file__).parent.parent.parent / "DEPLOYMENT_VERSION.txt"
    if version_file.exists():
        return {"content": version_file.read_text(), "exists": True}
    return {"exists": False, "note": "Old deployment - file not found"}


@app.get("/api/v1/status")
async def api_status():
    """API status endpoint."""
    return {
        "api_status": "operational",
        "frontend_built": FRONTEND_BUILD_DIR.exists(),
        "server": "bulletproof",
    }


# Debug endpoint removed for security - exposing environment variables is a security risk
# If debug information is needed, use proper logging instead

@app.get("/api/v1/health")
async def api_health():
    """API health check endpoint."""
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "war-room-api",
        "version": "1.0.0"
    }


@app.get("/api/v1/monitoring/health")
async def monitoring_health():
    """Monitoring health check endpoint."""
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "war-room-monitoring",
        "version": "1.0.0",
        "checks": {
            "frontend": "available" if FRONTEND_BUILD_DIR.exists() else "not built",
            "api": "operational"
        }
    }


# Import and setup API endpoints
try:
    # Include full v1 API router (ensures /api/v1/* and WebSocket routes are active)
    from api.v1.api import api_router as v1_api_router

    app.include_router(v1_api_router, prefix="/api")
    logger.info("✅ Mounted v1 API router at /api")

    # Also add lightweight mock endpoints as fallback for missing external creds
    from api_endpoints import setup_api_endpoints

    setup_api_endpoints(app)
    logger.info("✅ Added mock API endpoints as fallback")
except ImportError as e:
    logger.warning(f"⚠️ Could not load one or more API routers: {e}")
except Exception as e:
    logger.error(f"❌ Error setting up API routers: {e}")


# Mount frontend if available
if FRONTEND_BUILD_DIR.exists():
    # Mount static assets first (specific path)
    assets_dir = FRONTEND_BUILD_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        logger.info(f"✅ Mounted static assets from {assets_dir}")

        # Count assets for debugging
        asset_files = list(assets_dir.glob("*"))
        logger.info(f"📁 Found {len(asset_files)} asset files")

    # Mount images directory from frontend public folder
    images_dir = FRONTEND_BUILD_DIR.parent / "public" / "images"
    if images_dir.exists():
        app.mount("/images", StaticFiles(directory=images_dir), name="images")
        logger.info(f"✅ Mounted images from {images_dir}")
        image_files = list(images_dir.glob("*"))
        logger.info(f"🖼️ Found {len(image_files)} image files")

    # SPA catch-all route (must be last)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes."""
        # Skip API routes and other service routes
        if (
            full_path.startswith("api/")
            or full_path.startswith("health")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path.startswith("openapi.json")
            or full_path.startswith("assets/")
            or full_path.startswith("images/")
            or full_path.startswith("ws/")  # Allow WebSocket endpoints to be handled by routers
        ):
            return JSONResponse({"detail": "Not Found"}, status_code=404)

        # Serve React app for all other routes
        index_path = FRONTEND_BUILD_DIR / "index.html"
        if index_path.exists():
            logger.info(f"🌐 Serving SPA for route: /{full_path}")
            return FileResponse(index_path)

        return JSONResponse({"detail": "Frontend not available"}, status_code=404)

else:
    logger.warning("⚠️ Frontend not found - API only mode")
    logger.warning(f"Expected frontend at: {FRONTEND_BUILD_DIR}")


# Add a simple route for testing
@app.get("/ping")
async def ping():
    """Simple ping endpoint."""
    return {"message": "pong", "server": "bulletproof"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    logger.info(f"🚀 Starting bulletproof server on port {port}")
    logger.info(
        f"🔧 Frontend serving: {'enabled' if FRONTEND_BUILD_DIR.exists() else 'disabled'}"
    )

    uvicorn.run(
        "serve_bulletproof:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
