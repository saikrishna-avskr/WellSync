#!/bin/bash

if [ -f logs/backend.pid ]; then
  kill $(cat logs/backend.pid) && echo "Stopped Flask backend"
  rm logs/backend.pid
else
  echo "Flask backend not running"
fi

deactivate
