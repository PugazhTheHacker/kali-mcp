#!/bin/bash

echo "Starting Kali MCP AI Remote Terminal..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start kali-server in the background
echo "Starting Kali Tools API Server on port 5090..."
$DIR/myenv/bin/python $DIR/kali-server.py &
KALI_PID=$!

# Give it a moment to start
sleep 2

# Start the main server
echo "Starting MCP AI Server on port 5070..."
echo "Access at: http://127.0.0.1:5070"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Trap Ctrl+C to kill both processes
trap "echo 'Stopping servers...'; kill $KALI_PID 2>/dev/null; exit" INT TERM

$DIR/myenv/bin/python $DIR/server.py

# If server.py exits, kill kali-server too
kill $KALI_PID 2>/dev/null
