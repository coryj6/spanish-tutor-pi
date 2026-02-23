#!/usr/bin/env bash
cd "/home/tutor/spanish-tutor-pi"
source .venv/bin/activate
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
