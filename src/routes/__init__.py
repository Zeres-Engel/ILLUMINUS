"""
ILLUMINUS Wav2Lip - API Routes Module

This module contains all API route definitions including:
- WebSocket endpoints for real-time lip-syncing
- REST API endpoints for file uploads
- Health check and status endpoints
"""

from .websocket_api import router as websocket_router
from .rest_api import router as rest_router

__all__ = ["websocket_router", "rest_router"] 