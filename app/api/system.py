from fastapi import APIRouter
import os
router = APIRouter()
@router.get("/status")
def status():
    return {"uptime": os.popen("uptime").read()}
