"""
ILLUMINUS Wav2Lip - API Routes Module (WebSocket-First Architecture)

This module contains WebSocket-focused API route definitions for the assignment:
- Primary: WebSocket endpoints for real-time lip-syncing
- Utilities: Health check, status monitoring
- Checkpoint: Automatic checkpoint management
- Legacy: Minimal REST support (deprecated for assignment)

Assignment Requirements: WebSocket API Only
Author: Andrew (ngpthanh15@gmail.com)
Version: 2.0.0 - WebSocket First with Auto-Checkpoint Management
"""

from .websocket_api import router as websocket_router
from .utility_api import router as utility_router
from .checkpoint_api import auto_ensure_checkpoints, get_checkpoint_status_summary

# Note: checkpoint_router removed - now using auto functions
# Assignment requires WebSocket-only implementation

__all__ = ["websocket_router", "utility_router", "auto_ensure_checkpoints", "get_checkpoint_status_summary"] 