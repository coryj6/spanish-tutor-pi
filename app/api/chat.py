from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import ollama, json, time, os, httpx
from app.config import PROFILES_FILE, SESSIONS_DIR

router = APIRouter()
LAPTOP_URL = "http://DESKTOP-73EMHQA.local:11434"

class ChatRequest(BaseModel):
    profile_id: str
    message: str

@router.post("")
async def chat_endpoint(request: ChatRequest):
    with open(PROFILES_FILE, "r") as f:
        profiles = json.load(f)
    profile = next((p for p in profiles if p["id"] == request.profile_id), None)
    
    # Retrieve skill level from the profile
    student_level = profile.get('level', 'A1')

    brain_type = "Little Brain"
    target_model = "llama3.2:1b"
    client = ollama.Client() 

    try:
        async with httpx.AsyncClient() as hc:
            check = await hc.get(f"{LAPTOP_URL}/api/tags", timeout=0.8)
            if check.status_code == 200:
                brain_type = "Big Brain"
                target_model = "llama3.2:3b"
                client = ollama.Client(host=LAPTOP_URL)
    except:
        pass

    # NEW DYNAMIC PROMPT: Uses LLM's inherent knowledge & respects student level
    system_prompt = (
        f"You are a native Spanish Mentor. The student is at a '{student_level}' proficiency level. "
        "Your goal is to provide high-quality linguistic feedback based on standard RAE (Real Academia Española) rules.\n\n"
        "INSTRUCTIONS:\n"
        f"1. Tailor your Spanish vocabulary and grammar complexity to a {student_level} learner.\n"
        "2. If the student makes a mistake, provide the MOST natural correction in 'IDEAL'.\n"
        "3. In 'C:', provide a brief, professional pedagogical explanation of WHY that change was made.\n"
        "4. DO NOT hallucinate rules. If you are unsure, provide the correction without a detailed explanation.\n\n"
        "OUTPUT STRUCTURE:\n"
        "T_SPANISH: [Translate user message to English]\n"
        "IDEAL: [Corrected Spanish version]\n"
        "S: [Natural conversational Spanish reply]\n"
        "C: [Pedagogical explanation in English]\n"
        "E: [English translation of your Spanish reply S]\n"
        "PRACTICE: [Follow-up question in Spanish]"
    )

    def generate():
        full_response = ""
        try:
            stream = client.chat(
                model=target_model,
                messages=[{'role': 'system', 'content': system_prompt},
                          {'role': 'user', 'content': request.message}],
                # Temperature 0.3 allows for natural flow while staying grounded in facts
                options={'temperature': 0.3}, 
                stream=True,
            )
            for chunk in stream:
                token = chunk['message']['content']
                full_response += token
                yield f"data: {json.dumps({'token': token})}\n\n"

            yield f"data: {json.dumps({'done': True, 'brain': brain_type})}\n\n"
            
            session_path = os.path.join(SESSIONS_DIR, f"{profile['display_name']}_{time.strftime('%Y-%m-%d')}.json")
            history = []
            if os.path.exists(session_path):
                with open(session_path, "r") as f: history = json.load(f)
            history.append({"user": request.message, "tutor": full_response})
            with open(session_path, "w") as f: json.dump(history, f, indent=2)
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
