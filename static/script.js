/**
 * MCP AI Remote Terminal - Frontend
 * Copyright (c) 2025 Pugazhenthi
 * LinkedIn: https://www.linkedin.com/in/pugazh28
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const terminalOutput = document.getElementById('terminal-output');
    const cmdInput = document.getElementById('cmd-input');
    const chatOutput = document.getElementById('chat-output');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');
    const clearTermBtn = document.getElementById('clear-term');
    const clearChatBtn = document.getElementById('clear-chat');
    const navBtns = document.querySelectorAll('.nav-btn');
    const panels = document.querySelectorAll('.panel');
    const toolsModal = document.getElementById('tools-modal');
    const toolsMenuBtn = document.getElementById('tools-menu-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const toolCards = document.querySelectorAll('.tool-card');

    // State
    let commandHistory = [];
    let historyIndex = -1;
    let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    let currentDir = '~';

    // --- Terminal Logic ---

    function updatePrompt() {
        const prompt = document.querySelector('.prompt');
        if (prompt) {
            prompt.textContent = `root@kali:${currentDir}#`;
        }
    }

    function appendToTerminal(text, type = 'system') {
        const div = document.createElement('div');
        div.className = `term-line ${type}`;
        div.textContent = text;
        terminalOutput.appendChild(div);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    async function executeCommand(command) {
        if (!command.trim()) return;

        appendToTerminal(`root@kali:${currentDir}# ${command}`, 'command');
        cmdInput.value = '';
        commandHistory.push(command);
        historyIndex = commandHistory.length;

        try {
            const response = await fetch('/api/shell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, session_id: sessionId })
            });

            const data = await response.json();

            if (data.error) {
                appendToTerminal(`Error: ${data.error}`, 'error');
            } else {
                if (data.stdout) appendToTerminal(data.stdout, 'output');
                if (data.stderr) appendToTerminal(data.stderr, 'error');

                // Update current directory if provided
                if (data.cwd) {
                    currentDir = data.cwd.replace(/^\/home\/[^/]+/, '~');
                    updatePrompt();
                }
            }
        } catch (err) {
            appendToTerminal(`Network Error: ${err.message}`, 'error');
        }
    }

    cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            executeCommand(cmdInput.value);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                cmdInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                cmdInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                cmdInput.value = '';
            }
        }
    });

    clearTermBtn.addEventListener('click', () => {
        terminalOutput.innerHTML = '';
        appendToTerminal('Terminal cleared.', 'system');
    });

    // --- Chat Logic ---

    function appendToChat(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = sender === 'ai' ? '<i class="fa-solid fa-robot"></i>' : '<i class="fa-solid fa-user"></i>';

        const content = document.createElement('div');
        content.className = 'content';
        content.textContent = text; // Text content for safety

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        chatOutput.appendChild(msgDiv);
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }

    async function sendChat() {
        const prompt = chatInput.value.trim();
        if (!prompt) return;

        appendToChat(prompt, 'user');
        chatInput.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();

            if (data.error) {
                appendToChat(`Error: ${data.error}`, 'ai');
            } else {
                appendToChat(data.reply, 'ai');
            }
        } catch (err) {
            appendToChat(`Network Error: ${err.message}`, 'ai');
        }
    }

    sendChatBtn.addEventListener('click', sendChat);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChat();
    });

    clearChatBtn.addEventListener('click', () => {
        chatOutput.innerHTML = '';
        appendToChat("Chat cleared. How can I help?", 'ai');
    });

    // --- Navigation & UI ---

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            if (!targetId) return; // For tools button

            // Update buttons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update panels
            panels.forEach(p => p.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Tools Modal
    toolsMenuBtn.addEventListener('click', () => {
        toolsModal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => {
        toolsModal.classList.remove('active');
    });

    toolsModal.addEventListener('click', (e) => {
        if (e.target === toolsModal) toolsModal.classList.remove('active');
    });

    // Tool Execution
    toolCards.forEach(card => {
        card.addEventListener('click', async () => {
            const tool = card.getAttribute('data-tool');
            toolsModal.classList.remove('active');

            // Switch to terminal to show output
            document.querySelector('[data-target="terminal-panel"]').click();

            // Prompt for args based on tool (simplified for demo)
            let params = {};
            let target = '';

            if (tool === 'nmap' || tool === 'nikto' || tool === 'hydra') {
                target = prompt(`Enter target for ${tool}:`, '127.0.0.1');
                if (!target) return;
                params.target = target;
            }

            if (tool === 'hydra') {
                params.user = prompt('Enter username:', 'admin');
                params.password = prompt('Enter password:', 'password');
                if (!params.user || !params.password) return;
            }

            appendToTerminal(`Running ${tool}...`, 'system');

            try {
                const response = await fetch('/api/tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tool, params })
                });

                const data = await response.json();
                if (data.error) {
                    appendToTerminal(`Error: ${data.error}`, 'error');
                } else {
                    if (data.stdout) appendToTerminal(data.stdout, 'output');
                    if (data.stderr) appendToTerminal(data.stderr, 'error');
                }
            } catch (err) {
                appendToTerminal(`Error: ${err.message}`, 'error');
            }
        });
    });
});
