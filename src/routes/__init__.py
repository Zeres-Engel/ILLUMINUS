"""
ILLUMINUS Wav2Lip - API Routes Module (WebSocket-First Architecture)

This module contains WebSocket-focused API route definitions for the assignment:
- Primary: WebSocket endpoints for real-time lip-syncing
- Utilities: Health check, status monitoring
- Legacy: Minimal REST support (deprecated for assignment)

Assignment Requirements: WebSocket API Only
Author: Andrew (ngpthanh15@gmail.com)
Version: 2.0.0 - WebSocket First
"""

from .websocket_api import router as websocket_router
from .utility_api import router as utility_router

# Note: rest_router is intentionally excluded for assignment compliance
# Assignment requires WebSocket-only implementation

__all__ = ["websocket_router", "utility_router"] 