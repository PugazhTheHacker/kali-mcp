"""
MCP AI Remote Terminal - Main Server
Copyright (c) 2025 Pugazhenthi
LinkedIn: https://www.linkedin.com/in/pugazh28
Licensed for educational and ethical hacking purposes.
"""

import os
import sys
import json
import logging
import subprocess
import threading
import traceback
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Configuration
API_PORT = int(os.environ.get("API_PORT", 5020))
KALI_SERVER_URL = os.environ.get("KALI_SERVER_URL", "http://127.0.0.1:5030")
GEMINI_API_KEY = "enter_your_gemini_api_key"
COMMAND_TIMEOUT = 180

# Initialize Flask
app = Flask(__name__, static_folder='static')

# Initialize Gemini
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        logger.info("Gemini AI initialized with model: gemini-2.0-flash-lite")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini: {e}")
        model = None
else:
    logger.warning("GEMINI_API_KEY not set. AI features will not work.")
    model = None

import requests

def forward_to_kali(endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Forward request to Kali Server"""
    url = f"{KALI_SERVER_URL}/{endpoint}"
    try:
        logger.info(f"Forwarding to Kali Server: {url}")
        response = requests.post(url, json=data, timeout=COMMAND_TIMEOUT)
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to connect to Kali Server: {e}")
        return {"error": f"Failed to connect to Kali Server at {KALI_SERVER_URL}: {str(e)}", "success": False}

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route("/api/shell", methods=["POST"])
def api_shell():
    try:
        data = request.json
        command = data.get("command", "")
        session_id = data.get("session_id", "default")
        
        if not command:
            return jsonify({"error": "Command required"}), 400
        
        # Forward to Kali Server generic command endpoint with session_id
        result = forward_to_kali("api/command", {"command": command, "session_id": session_id})
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def api_chat():
    if not model:
        return jsonify({"error": "Gemini API key not configured"}), 503
        
    try:
        data = request.json
        prompt = data.get("prompt", "")
        if not prompt:
            return jsonify({"error": "Prompt required"}), 400
            
        # Add system context
        system_context = (
            "You are a helpful cybersecurity assistant running on a Kali Linux terminal. "
            "You can suggest Linux commands and explain security concepts. "
            "Keep answers concise and suitable for a terminal interface. "
            "If the user asks to run a command, provide the exact command they should run."
        )
        
        full_prompt = f"{system_context}\n\nUser: {prompt}\nAssistant:"
        response = model.generate_content(full_prompt)
        
        return jsonify({"reply": response.text})
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/tool", methods=["POST"])
def api_tool():
    try:
        data = request.json
        tool = data.get("tool", "").lower()
        params = data.get("params", {})
        
        if tool == "nmap":
            # Map to Kali Server Nmap endpoint
            # Kali Server expects: target, scan_type, ports, additional_args
            payload = {
                "target": params.get("target"),
                "scan_type": params.get("scan_type", "-sV"),
                "ports": params.get("ports", ""),
                "additional_args": params.get("additional_args", "")
            }
            result = forward_to_kali("api/tools/nmap", payload)
            
        elif tool == "hydra":
            # Map to Kali Server Hydra endpoint
            payload = {
                "target": params.get("target"),
                "service": params.get("service", "ssh"),
                "username": params.get("user"),
                "password": params.get("password"),
                # Handle file based inputs if needed, simplified here
            }
            result = forward_to_kali("api/tools/hydra", payload)
            
        elif tool == "nikto":
            payload = {
                "target": params.get("target")
            }
            result = forward_to_kali("api/tools/nikto", payload)
            
        elif tool == "metasploit":
            payload = {
                "module": params.get("module", ""),
                "options": params.get("options", {})
            }
            # If just help, use generic command as before or specific logic
            if not payload["module"]:
                result = forward_to_kali("api/command", {"command": "msfconsole -q -x 'help'"})
            else:
                result = forward_to_kali("api/tools/metasploit", payload)

        elif tool == "tshark":
            # Kali server has no tshark endpoint, use generic command
            interface = params.get("interface", "wlan0")
            count = params.get("count", 50)
            command = f"tshark -i {interface} -c {count}"
            result = forward_to_kali("api/command", {"command": command})
            
        else:
            return jsonify({"error": f"Unknown tool: {tool}"}), 400
            
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    logger.info(f"Starting MCP AI Remote Terminal on port {API_PORT}")
    app.run(host="0.0.0.0", port=API_PORT, debug=True)
