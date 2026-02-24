from fastapi import APIRouter
import json, uuid
from pydantic import BaseModel
from app.config import PROFILES_FILE

router = APIRouter()

class ProfileUpdate(BaseModel):
    id: str
    display_name: str
    level: str
    correction_style: str
    english_help: str
    allowed_tenses: list

@router.get("")
def list_profiles():
    with open(PROFILES_FILE) as f:
        return json.load(f)

@router.post("")
def create_profile(profile: ProfileUpdate):
    with open(PROFILES_FILE, "r") as f:
        profiles = json.load(f)
    
    # Generate a unique ID if it's a new user
    new_profile = profile.dict()
    if not new_profile['id'] or new_profile['id'] == "new":
        new_profile['id'] = str(uuid.uuid4())[:8]
        
    profiles.append(new_profile)
    with open(PROFILES_FILE, "w") as f:
        json.dump(profiles, f, indent=2)
    return {"ok": True, "id": new_profile['id']}

@router.put("/{profile_id}")
def update_profile(profile_id: str, updated_data: ProfileUpdate):
    with open(PROFILES_FILE, "r") as f:
        profiles = json.load(f)
    for i, p in enumerate(profiles):
        if p['id'] == profile_id:
            profiles[i] = updated_data.dict()
            break
    with open(PROFILES_FILE, "w") as f:
        json.dump(profiles, f, indent=2)
    return {"ok": True}
