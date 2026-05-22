/* ==========================================================================
   STM32 Nucleo LED Controller - JavaScript (app.js)
   Controls serial communication and handles reactive UI updates
   ========================================================================== */

// Global state variables
let port = null;
let reader = null;
let keepReading = false;
let inputBuffer = "";

// DOM Elements
const browserWarning = document.getElementById('browser-warning');
const btnConnect = document.getElementById('btn-connect');
const btnSync = document.getElementById('btn-sync');
const btnDisconnect = document.getElementById('btn-disconnect');
const baudrateSelect = document.getElementById('baudrate-select');
const connectionStatus = document.getElementById('connection-status');
const statusText = document.getElementById('status-text');
const ledToggle = document.getElementById('led-toggle');
const virtualLed = document.getElementById('virtual-led');
const ledStateText = document.getElementById('led-state-text');
const serialTerminal = document.getElementById('serial-terminal');
const btnClearConsole = document.getElementById('btn-clear-console');

// 1. Check Browser Compatibility with Web Serial API
window.addEventListener('DOMContentLoaded', () => {
    if (!('serial' in navigator)) {
        // Show browser warning banner
        browserWarning.classList.remove('hidden');
        
        // Disable connection controls
        btnConnect.disabled = true;
        btnConnect.style.opacity = '0.5';
        btnConnect.style.cursor = 'not-allowed';
        baudrateSelect.disabled = true;
        
        logToTerminal('[Sistema] Tu navegador no soporta la Web Serial API. Usa Google Chrome o Microsoft Edge.', 'error');
    } else {
        logToTerminal('[Sistema] Web Serial API compatible. Conecta tu placa STM32 Nucleo y haz clic en "Conectar Placa".', 'system');
    }
});

// 2. Terminal Logging System
function logToTerminal(message, type = 'system') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}-msg`;
    
    // Add timestamp for premium styling
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    line.textContent = `[${timestamp}] ${message}`;
    
    serialTerminal.appendChild(line);
    
    // Auto-scroll to bottom
    serialTerminal.scrollTop = serialTerminal.scrollHeight;
}

btnClearConsole.addEventListener('click', () => {
    serialTerminal.innerHTML = '';
    logToTerminal('[Sistema] Consola de comandos limpiada.', 'system');
});

// 3. LED State Controller helper
function setLedState(isOn) {
    if (isOn) {
        virtualLed.classList.add('active');
        ledStateText.textContent = 'LED ENCENDIDO';
        ledToggle.checked = true;
    } else {
        virtualLed.classList.remove('active');
        ledStateText.textContent = 'LED APAGADO';
        ledToggle.checked = false;
    }
}

// 4. Serial Port Write Action
async function sendSerialCommand(cmd) {
    if (!port || !port.writable) {
        logToTerminal('No se pudo enviar comando: El puerto serie no está disponible.', 'error');
        return;
    }
    
    try {
        let writer = port.writable.getWriter();
        let encoder = new TextEncoder();
        let data = encoder.encode(cmd);
        
        await writer.write(data);
        writer.releaseLock();
        
        logToTerminal(`Enviado: '${cmd}'`, 'tx');
    } catch (err) {
        logToTerminal(`Error al enviar datos: ${err.message}`, 'error');
    }
}

// 5. Serial Port Reader Loop
async function startReading() {
    keepReading = true;
    let decoder = new TextDecoder();
    
    while (port && port.readable && keepReading) {
        try {
            reader = port.readable.getReader();
            logToTerminal('[Sistema] Lector serie iniciado correctamente.', 'system');
            
            while (keepReading) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                if (value) {
                    // Acumular caracteres en el buffer
                    inputBuffer += decoder.decode(value, { stream: true });
                    
                    // Sincronizar UI de forma proactiva buscando en todo el buffer acumulado
                    // Esto evita depender de un salto de línea estricto (\n) si el firmware no lo envía
                    let lowerBuffer = inputBuffer.toLowerCase();
                    if (lowerBuffer.includes('encendido')) {
                        setLedState(true);
                    } else if (lowerBuffer.includes('apagado')) {
                        setLedState(false);
                    }
                    
                    // Procesar líneas completas para mostrar ordenadamente en la terminal de logs
                    let lineIndex;
                    while ((lineIndex = inputBuffer.indexOf('\n')) !== -1) {
                        const rawLine = inputBuffer.slice(0, lineIndex);
                        inputBuffer = inputBuffer.slice(lineIndex + 1);
                        
                        const trimmed = rawLine.trim();
                        if (trimmed.length > 0) {
                            logToTerminal(`Recibido: "${trimmed}"`, 'rx');
                        }
                    }
                    
                    // Limitar tamaño de inputBuffer para evitar fugas de memoria si no hay saltos de línea
                    if (inputBuffer.length > 1024) {
                        inputBuffer = inputBuffer.slice(-512);
                    }
                }
            }
        } catch (err) {
            logToTerminal(`Error de lectura: ${err.message}`, 'error');
            break;
        } finally {
            if (reader) {
                reader.releaseLock();
                reader = null;
            }
        }
    }
}

// 6. Connection Actions
btnConnect.addEventListener('click', async () => {
    try {
        logToTerminal('[Sistema] Abriendo selector de puerto COM en el navegador...', 'system');
        
        // Request serial port from user selection
        port = await navigator.serial.requestPort();
        
        const baudRate = parseInt(baudrateSelect.value, 10);
        logToTerminal(`[Sistema] Conectando a velocidad: ${baudRate} bps...`, 'system');
        
        // Open port configuration
        await port.open({ baudRate });
        
        // Update UI State for successful connection
        connectionStatus.classList.remove('disconnected');
        connectionStatus.classList.add('connected');
        statusText.textContent = 'Conectado';
        
        btnConnect.classList.add('hidden');
        btnSync.classList.remove('hidden');
        btnDisconnect.classList.remove('hidden');
        
        ledToggle.disabled = false;
        baudrateSelect.disabled = true;
        
        logToTerminal('[Sistema] Tarjeta STM32 Nucleo conectada con éxito.', 'system');
        
        // Start non-blocking serial reading
        startReading();
        
        // Consultar el estado del LED en la placa tras conectar (delay de 1200ms para estabilizar hardware)
        setTimeout(async () => {
            logToTerminal('[Sistema] Consultando estado inicial del LED...', 'system');
            await sendSerialCommand('?');
        }, 500);
    } catch (err) {
        logToTerminal(`Error de conexión: ${err.message}`, 'error');
        port = null;
    }
});

btnDisconnect.addEventListener('click', async () => {
    await disconnectSerial();
});

btnSync.addEventListener('click', async () => {
    logToTerminal('[Sistema] Solicitando actualización de estado del LED...', 'system');
    await sendSerialCommand('?');
});

async function disconnectSerial() {
    logToTerminal('[Sistema] Cerrando puerto serie...', 'system');
    
    // Stop reading loop
    keepReading = false;
    
    // Cancel active reader
    if (reader) {
        try {
            await reader.cancel();
        } catch (e) {
            // Ignore error during cancellation
        }
    }
    
    // Close port
    if (port) {
        try {
            await port.close();
        } catch (err) {
            logToTerminal(`Error al cerrar puerto: ${err.message}`, 'error');
        }
        port = null;
    }
    
    // Reset UI states
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('disconnected');
    statusText.textContent = 'Desconectado';
    
    btnConnect.classList.remove('hidden');
    btnSync.classList.add('hidden');
    btnDisconnect.classList.add('hidden');
    
    ledToggle.disabled = true;
    baudrateSelect.disabled = false;
    
    inputBuffer = "";
    setLedState(false);
    
    logToTerminal('[Sistema] Puerto serie desconectado.', 'system');
}

// 7. LED Interactive Control (Toggle handler)
ledToggle.addEventListener('change', async (event) => {
    const isChecked = event.target.checked;
    
    // Send command to STM32 (1: ON, 0: OFF)
    const cmd = isChecked ? '1' : '0';
    
    // We update UI immediately for snappy interaction feel,
    // though the STM32 RX read loop can verify and override it.
    if (isChecked) {
        virtualLed.classList.add('active');
        ledStateText.textContent = 'LED ENCENDIDO';
    } else {
        virtualLed.classList.remove('active');
        ledStateText.textContent = 'LED APAGADO';
    }
    
    await sendSerialCommand(cmd);
});

// Clean up if window closes
window.addEventListener('beforeunload', async () => {
    if (port) {
        await disconnectSerial();
    }
});
