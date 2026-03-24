#!/bin/bash

deactivate
# Activate virtualenv
source .venv/bin/activate

# Start Flask backend
echo "Starting Flask backend..."
nohup python backend/app.py > logs/flask.log 2>&1 & echo $! > logs/backend.pid

echo "Server started. Use './status.sh' to check their status."

