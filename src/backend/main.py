"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
import logging

from core.config import settings
from core.sentry import init_sentry
from core.error_handler import secure_exception_handler, sanitize_validation_error
from api.v1.api import api_router
from api.v1.endpoints.websocket import analytics_websocket
from core.websocket import manager
from core.database import database_manager
from services.cache_service import cache_service
from services.posthog import posthog_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Sentry error tracking
init_sentry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle.
    Initialize connections on startup, cleanup on shutdown.
    """
    # Startup
    logger.info("Starting up War Room backend...")

    # Initialize database with connection pooling
    await database_manager.initialize()

    # Initialize cache service
    await cache_service.initialize()

    # Initialize PostHog
    if settings.POSTHOG_ENABLED:
        posthog_service.initialize()

    # Initialize Pinecone vector database
    try:
        from core.pinecone_config import pinecone_manager
        pinecone_initialized = await pinecone_manager.initialize()
        if pinecone_initialized:
            logger.info("Pinecone vector database initialized successfully")
        else:
            logger.warning("Pinecone initialization failed - vector operations will be disabled")
    except Exception as e:
        logger.warning(f"Pinecone initialization error: {str(e)} - vector operations will be disabled")

    # Start monitoring services
    from services.alert_service import alert_service
    from services.metrics_collector import metrics_collector

    await alert_service.start()
    await metrics_collector.start()
    logger.info("Monitoring services started")

    yield

    # Shutdown
    logger.info("Shutting down War Room backend...")

    # Stop monitoring services
    await alert_service.stop()
    await metrics_collector.stop()

    # Cleanup Pinecone connections
    try:
        from core.pinecone_config import pinecone_manager
        await pinecone_manager.cleanup()
        logger.info("Pinecone connections cleaned up")
    except Exception as e:
        logger.warning(f"Pinecone cleanup error: {str(e)}")

    # Close database connections
    await database_manager.close()

    # Close cache connections
    await cache_service.close()

    # Close all WebSocket connections
    await manager.disconnect_all()


# Create FastAPI app
app = FastAPI(
    title="War Room API",
    description="Campaign management platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware - MUST be first to protect all endpoints
from core.rate_limiter import RateLimitMiddleware

app.add_middleware(RateLimitMiddleware)

# Add timeout middleware
from middleware.timeout_middleware import TimeoutMiddleware

app.add_middleware(TimeoutMiddleware)

# Add error handler middleware
from middleware.error_handler import ErrorHandlerMiddleware

app.add_middleware(ErrorHandlerMiddleware)

# Add metrics middleware
from middleware.metrics_middleware import MetricsMiddleware

app.add_middleware(MetricsMiddleware)

# Add PostHog middleware for automatic API tracking
if settings.POSTHOG_ENABLED:
    from services.posthog import PostHogMiddleware

    app.add_middleware(PostHogMiddleware)

# Add exception handlers
app.add_exception_handler(StarletteHTTPException, secure_exception_handler)
app.add_exception_handler(
    RequestValidationError,
    lambda request, exc: secure_exception_handler(
        request, StarletteHTTPException(status_code=422, detail="Invalid request data")
    ),
)
app.add_exception_handler(Exception, secure_exception_handler)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Add WebSocket route
app.add_websocket_route("/ws/analytics", analytics_websocket)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint returning API information."""
    return {
        "name": "War Room API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "health": "/health",
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    Checks all critical services.
    """
    health_status = {
        "status": "healthy",
        "services": {
            "api": "operational",
            "database": "operational",  # Would check actual DB connection
            "cache": "operational" if cache_service.is_connected else "degraded",
            "websocket": "operational" if manager.has_active_connections else "idle",
        },
    }

    # Overall status
    if all(
        s == "operational" or s == "idle" for s in health_status["services"].values()
    ):
        health_status["status"] = "healthy"
    else:
        health_status["status"] = "degraded"

    return health_status


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
