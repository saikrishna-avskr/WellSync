#!/bin/bash

check_pid() {
  if [ -f "logs/$1.pid" ]; then
    PID=$(cat logs/$1.pid)
    if ps -p $PID > /dev/null; then
      echo "$2 is running (PID $PID)"
    else
      echo "$2 is not running"
    fi
  else
    echo "$2 is not running"
  fi
}

check_pid backend "Flask backend"
