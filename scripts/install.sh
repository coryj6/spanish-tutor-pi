#!/usr/bin/env bash
set -e
APP_DIR="/home/tutor/spanish-tutor-pi"
python3 -m venv "$APP_DIR/.venv"
"$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/requirements.txt"
sudo cp "$APP_DIR/scripts/spanish-tutor.service" /etc/systemd/system/spanish-tutor.service
sudo systemctl daemon-reload
echo "Install complete. Run 'sudo systemctl enable --now spanish-tutor' to start."
