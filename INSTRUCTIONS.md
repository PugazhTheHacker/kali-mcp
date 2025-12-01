# MCP AI Remote Terminal

## Overview
A mobile-controlled secure remote terminal for Kali Linux with built-in Gemini AI assistant.

## Features
- **Dual-panel Interface**: Terminal + AI Chatbot.
- **AI Assistant**: Google Gemini integration for command suggestions and help.
- **Cyberpunk UI**: Responsive, neon-glow design.
- **Tool Automation**: Easy access to Nmap, Hydra, Wireshark, etc.

## Installation

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
    (Use a virtual environment if on a managed system)

2.  **Configure AI**:
    Export your Google Gemini API key:
    ```bash
    export GEMINI_API_KEY='your_api_key_here'
    ```

3.  **Run Server**:
    ```bash
    python3 server.py
    ```

4.  **Access**:
    Open your browser and navigate to:
    `http://<your-kali-ip>:5000`

## Usage
- **Terminal**: Type standard Linux commands.
- **AI Chat**: Ask questions like "How do I scan for open ports?" or "Explain this nmap output".
- **Tools**: Click the "Tools" button (wrench icon) to quickly launch security tools.

## Security Note
This tool allows remote command execution. Ensure it is only accessible on a trusted local network.
