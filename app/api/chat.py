from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import ollama, json, time, os, httpx
from app.tutor.engine import build_system_prompt
from app.config import PROFILES_FILE, SESSIONS_DIR

router = APIRouter()

# --- HYBRID CONFIG ---
LAPTOP_HOSTNAME = "DESKTOP-73EMHQA.local" 
LAPTOP_URL = f"http://{LAPTOP_HOSTNAME}:11434"
# ---------------------

class ChatRequest(BaseModel):
    profile_id: str
    message: str

@router.post("")
async def chat_endpoint(request: ChatRequest):
    with open(PROFILES_FILE, "r") as f:
        profiles = json.load(f)
    profile = next((p for p in profiles if p["id"] == request.profile_id), None)

    # Default to local Pi brain
    brain_type = "little"
    target_model = "llama3.2:1b"
    client = ollama.Client() 

    try:
        # Fast check: Is the Laptop 'Big Brain' online?
        async with httpx.AsyncClient() as hc:
            check = await hc.get(f"{LAPTOP_URL}/api/tags", timeout=1.0)
            if check.status_code == 200:
                brain_type = "big"
                target_model = "llama3.2:3b"
                client = ollama.Client(host=LAPTOP_URL)
    except:
        pass # Silently fallback to Pi

    system_prompt = build_system_prompt(profile, brain_type)
    session_path = os.path.join(SESSIONS_DIR, f"{profile['display_name']}_{time.strftime('%Y-%m-%d')}.json")

    def generate():
        full_response = ""
        start_time = time.time()
        try:
            stream = client.chat(
                model=target_model,
                messages=[{'role': 'system', 'content': system_prompt},
                          {'role': 'user', 'content': request.message}],
                options={'temperature': 0.1},
                stream=True,
            )

            for chunk in stream:
                token = chunk['message']['content']
                full_response += token
                yield f"data: {json.dumps({'token': token})}\n\n"

            duration = round(time.time() - start_time, 2)
            
            # Log session with brain type for tracking
            history = []
            if os.path.exists(session_path):
                with open(session_path, "r") as f:
                    history = json.load(f)
            
            history.append({
                "user": request.message,
                "tutor": full_response,
                "timestamp": time.strftime('%H:%M:%S'),
                "brain": brain_type,
                "model": target_model
            })
            
            with open(session_path, "w") as f:
                json.dump(history, f, indent=2)

            yield f"data: {json.dumps({'done': True, 'duration': duration, 'brain': brain_type})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
