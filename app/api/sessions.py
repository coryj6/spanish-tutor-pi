from fastapi import APIRouter
import os, json
from app.config import SESSIONS_DIR

router = APIRouter()

@router.get("")
def list_sessions():
    if not os.path.exists(SESSIONS_DIR):
        return []
    files = [f for f in os.listdir(SESSIONS_DIR) if f.endswith('.json')]
    return sorted(files, reverse=True)

@router.get("/{filename}")
def get_session(filename: str):
    path = os.path.join(SESSIONS_DIR, filename)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {"error": "File not found"}
