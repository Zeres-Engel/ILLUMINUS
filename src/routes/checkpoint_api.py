"""
Checkpoint Auto-Management Functions
Auto-download checkpoints when missing (no API endpoints)
"""

from loguru import logger
from src.services.checkpoint_manager import checkpoint_manager


def auto_ensure_checkpoints():
    """
    Automatically ensure all required checkpoints are available
    Called automatically when services are initialized
    No API endpoint needed - pure background function
    """
    try:
        logger.info("🔍 Checking checkpoint availability...")
        
        # Get current status
        status = checkpoint_manager.get_checkpoint_status()
        
        # Check if all checkpoints are valid
        total_checkpoints = 0
        valid_checkpoints = 0
        
        for category in status.values():
            for checkpoint in category.values():
                total_checkpoints += 1
                if checkpoint['valid']:
                    valid_checkpoints += 1
        
        # If all checkpoints are ready, do nothing
        if valid_checkpoints == total_checkpoints:
            logger.info(f"✅ All checkpoints ready ({valid_checkpoints}/{total_checkpoints})")
            return True
        
        # Auto-download missing checkpoints
        logger.info(f"🔽 Auto-downloading missing checkpoints ({valid_checkpoints}/{total_checkpoints})...")
        
        # Cleanup invalid checkpoints first
        cleanup_count = checkpoint_manager.cleanup_invalid_checkpoints()
        if cleanup_count > 0:
            logger.info(f"🧹 Cleaned up {cleanup_count} invalid checkpoints")
        
        # Download all missing checkpoints
        results = checkpoint_manager.download_all_checkpoints(force=False)
        
        # Check final status
        final_status = checkpoint_manager.get_checkpoint_status()
        final_valid = sum(1 for cat in final_status.values() 
                         for chk in cat.values() if chk['valid'])
        
        success = final_valid == total_checkpoints
        
        if success:
            logger.info(f"✅ Auto-download completed successfully: {final_valid}/{total_checkpoints} ready")
        else:
            logger.warning(f"⚠️ Auto-download partially completed: {final_valid}/{total_checkpoints} ready")
        
        return success
        
    except Exception as e:
        logger.error(f"❌ Auto-checkpoint setup failed: {e}")
        return False


def get_checkpoint_status_summary():
    """
    Get simple checkpoint status summary for internal use
    Returns: (all_ready: bool, summary: dict)
    """
    try:
        status = checkpoint_manager.get_checkpoint_status()
        
        total_checkpoints = 0
        valid_checkpoints = 0
        total_size_mb = 0
        
        for category in status.values():
            for checkpoint in category.values():
                total_checkpoints += 1
                if checkpoint['valid']:
                    valid_checkpoints += 1
                    total_size_mb += checkpoint['size_mb']
        
        summary = {
            "total_checkpoints": total_checkpoints,
            "valid_checkpoints": valid_checkpoints,
            "total_size_mb": round(total_size_mb, 1),
            "all_ready": valid_checkpoints == total_checkpoints
        }
        
        return summary["all_ready"], summary
        
    except Exception as e:
        logger.error(f"Error getting checkpoint status: {e}")
        return False, {"error": str(e)} 