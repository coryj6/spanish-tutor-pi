from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.api import profiles, chat, system

app = FastAPI()
app.include_router(profiles.router, prefix="/api/profiles")
app.include_router(chat.router, prefix="/api/chat")
app.include_router(system.router, prefix="/api/system")
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
