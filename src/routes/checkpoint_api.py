"""
Checkpoint Management API Routes
API endpoints để quản lý tự động checkpoint downloads
"""

import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Optional
from loguru import logger

from src.services.checkpoint_manager import checkpoint_manager

router = APIRouter()


@router.get("/checkpoints/status")
async def get_checkpoint_status():
    """Get detailed status of all checkpoints"""
    try:
        status = checkpoint_manager.get_checkpoint_status()
        
        # Calculate summary statistics
        total_checkpoints = 0
        valid_checkpoints = 0
        existing_checkpoints = 0
        total_size_mb = 0
        
        for category in status.values():
            for checkpoint in category.values():
                total_checkpoints += 1
                if checkpoint['exists']:
                    existing_checkpoints += 1
                    total_size_mb += checkpoint['size_mb']
                if checkpoint['valid']:
                    valid_checkpoints += 1
        
        return {
            "status": "success",
            "summary": {
                "total_checkpoints": total_checkpoints,
                "existing_checkpoints": existing_checkpoints,
                "valid_checkpoints": valid_checkpoints,
                "total_size_mb": round(total_size_mb, 1),
                "all_ready": valid_checkpoints == total_checkpoints
            },
            "checkpoints": status,
            "optimization": "✅ Automatic checkpoint management active"
        }
        
    except Exception as e:
        logger.error(f"Error getting checkpoint status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/checkpoints/download")
async def download_checkpoints(
    background_tasks: BackgroundTasks,
    category: Optional[str] = None,
    name: Optional[str] = None,
    force: bool = False
):
    """
    Download checkpoints
    
    Args:
        category: Specific category to download (optional)
        name: Specific checkpoint name (optional)
        force: Force re-download even if exists
    """
    try:
        if category and name:
            # Download specific checkpoint
            logger.info(f"🔽 Downloading specific checkpoint: {category}/{name}")
            success = checkpoint_manager.download_checkpoint(category, name, force=force)
            
            if success:
                return {
                    "status": "success",
                    "message": f"Successfully downloaded {category}/{name}",
                    "checkpoint": f"{category}/{name}"
                }
            else:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to download {category}/{name}"
                )
        
        elif category:
            # Download all checkpoints in category
            logger.info(f"🔽 Downloading category: {category}")
            
            if category not in checkpoint_manager.CHECKPOINT_REGISTRY:
                raise HTTPException(status_code=400, detail=f"Unknown category: {category}")
            
            results = {}
            for checkpoint_name in checkpoint_manager.CHECKPOINT_REGISTRY[category].keys():
                success = checkpoint_manager.download_checkpoint(category, checkpoint_name, force=force)
                results[checkpoint_name] = success
            
            successful = sum(1 for status in results.values() if status)
            total = len(results)
            
            return {
                "status": "success" if successful == total else "partial",
                "message": f"Downloaded {successful}/{total} checkpoints in {category}",
                "results": results
            }
        
        else:
            # Download all checkpoints in background
            logger.info("🔽 Starting download of all checkpoints in background...")
            
            background_tasks.add_task(download_all_checkpoints_background, force)
            
            return {
                "status": "started",
                "message": "Downloading all checkpoints in background",
                "tip": "Check /checkpoints/status for progress"
            }
            
    except Exception as e:
        logger.error(f"Error in checkpoint download: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/checkpoints/verify")
async def verify_checkpoints(category: Optional[str] = None, name: Optional[str] = None):
    """Verify checkpoint integrity"""
    try:
        if category and name:
            # Verify specific checkpoint
            is_valid = checkpoint_manager.verify_checkpoint(category, name)
            return {
                "status": "success",
                "checkpoint": f"{category}/{name}",
                "valid": is_valid,
                "message": "Valid checkpoint" if is_valid else "Invalid or missing checkpoint"
            }
        else:
            # Verify all checkpoints
            status = checkpoint_manager.get_checkpoint_status()
            verification_results = {}
            
            for cat, checkpoints in status.items():
                verification_results[cat] = {}
                for chk_name, chk_info in checkpoints.items():
                    verification_results[cat][chk_name] = chk_info['valid']
            
            total_checkpoints = sum(len(c) for c in verification_results.values())
            valid_checkpoints = sum(1 for cat in verification_results.values() 
                                   for valid in cat.values() if valid)
            
            return {
                "status": "success",
                "summary": {
                    "total_checkpoints": total_checkpoints,
                    "valid_checkpoints": valid_checkpoints,
                    "all_valid": valid_checkpoints == total_checkpoints
                },
                "results": verification_results
            }
            
    except Exception as e:
        logger.error(f"Error in checkpoint verification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/checkpoints/cleanup")
async def cleanup_invalid_checkpoints():
    """Remove corrupted or invalid checkpoints"""
    try:
        removed_count = checkpoint_manager.cleanup_invalid_checkpoints()
        
        return {
            "status": "success",
            "message": f"Cleaned up {removed_count} invalid checkpoints",
            "removed_count": removed_count
        }
        
    except Exception as e:
        logger.error(f"Error in checkpoint cleanup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/checkpoints/registry")
async def get_checkpoint_registry():
    """Get the complete checkpoint registry"""
    return {
        "status": "success",
        "registry": checkpoint_manager.CHECKPOINT_REGISTRY,
        "base_dir": str(checkpoint_manager.base_dir)
    }


async def download_all_checkpoints_background(force: bool = False):
    """Background task to download all checkpoints"""
    try:
        logger.info("🚀 Starting background download of all checkpoints...")
        results = checkpoint_manager.download_all_checkpoints(force=force)
        
        total = sum(len(c) for c in checkpoint_manager.CHECKPOINT_REGISTRY.values())
        successful = sum(1 for cat in results.values() for status in cat.values() if status)
        
        logger.info(f"✅ Background download completed: {successful}/{total} successful")
        
    except Exception as e:
        logger.error(f"❌ Background download failed: {e}")


@router.post("/checkpoints/auto-setup")
async def auto_setup_checkpoints():
    """Automatically setup all missing checkpoints"""
    try:
        logger.info("🔧 Starting automatic checkpoint setup...")
        
        # First, cleanup any invalid checkpoints
        cleanup_count = checkpoint_manager.cleanup_invalid_checkpoints()
        
        # Then download missing checkpoints
        results = checkpoint_manager.download_all_checkpoints(force=False)
        
        # Get final status
        final_status = checkpoint_manager.get_checkpoint_status()
        
        total_checkpoints = sum(len(c) for c in final_status.values())
        valid_checkpoints = sum(1 for cat in final_status.values() 
                               for chk in cat.values() if chk['valid'])
        
        return {
            "status": "success" if valid_checkpoints == total_checkpoints else "partial",
            "message": "Automatic checkpoint setup completed",
            "summary": {
                "cleaned_up": cleanup_count,
                "total_checkpoints": total_checkpoints,
                "valid_checkpoints": valid_checkpoints,
                "setup_complete": valid_checkpoints == total_checkpoints
            },
            "results": results,
            "final_status": final_status
        }
        
    except Exception as e:
        logger.error(f"Error in auto-setup: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 