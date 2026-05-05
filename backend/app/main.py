"""
AI Chat Platform — FastAPI Backend
Main application entry point with CORS, lifespan, and routing.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.routers import chat, conversations

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — setup and teardown."""
    logger.info("🚀 AI Chat Platform backend starting up...")
    yield
    # Cleanup
    await engine.dispose()
    logger.info("👋 Backend shutting down.")


app = FastAPI(
    title="AI Chat Platform",
    description="AI-powered chat platform with MCP tools for web search, database analysis, and more.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(conversations.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ai-chat-platform-backend"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Chat Platform API",
        "docs": "/docs",
        "health": "/health",
    }
