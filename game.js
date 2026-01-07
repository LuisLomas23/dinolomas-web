// ================================
// CANVAS
// ================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================================
// ESTADO DEL JUEGO
// ================================
let gameStarted = false;

// ================================
// VARIABLES DEL JUEGO
// ================================
let jumpCount = 0;
let speed = 6;
const speedIncrement = 1;
const maxSpeed = 16;

// ================================
// DINOSAURIO
// ================================
const dinoImg = new Image();
dinoImg.src = "dino.png";

const dino = {
    x: 80,
    y: 200,
    width: 60,
    height: 60,
    velocityY: 0,
    onGround: true
};

const gravity = 0.9;
const jumpForce = 16;

// ================================
// PISO
// ================================
const groundY = 260;

// ================================
// TRONCOS
// ================================
let logs = [];
let logTimer = 0;

function createLog() {
    return {
        x: canvas.width,
        y: groundY - 40,
        width: 30,
        height: 40
    };
}

// ================================
// MICRÓFONO
// ================================
let audioContext = null;
let analyser = null;
let microphone = null;
let micEnabled = false;
let volume = 0;

const micButton = document.getElementById("micButton");
const micStatus = document.getElementById("micStatus");
const startButton = document.getElementById("startButton");

micButton.addEventListener("click", async () => {
    if (micEnabled) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        micEnabled = true;
        micStatus.textContent = "Micrófono: activo ✅";
    } catch (err) {
        micStatus.textContent = "Micrófono: error ❌";
        console.error(err);
    }
});

// ================================
// BOTÓN INICIAR
// ================================
startButton.addEventListener("click", () => {
    if (!micEnabled) {
        alert("Primero activa el micrófono 🎤");
        return;
    }

    resetGame();
    gameStarted = true;
});

// ================================
// MICRÓFONO VOLUMEN
// ================================
function getMicVolume() {
    if (!micEnabled || !analyser) return 0;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i] - 128);
    }

    return sum / dataArray.length;
}

// ================================
// SALTO
// ================================
function jump() {
    if (!dino.onGround) return;

    dino.velocityY = -jumpForce;
    dino.onGround = false;
    jumpCount++;

    if (jumpCount % 3 === 0 && speed < maxSpeed) {
        speed += speedIncrement;
    }
}

// ================================
// RESET JUEGO
// ================================
function resetGame() {
    logs = [];
    logTimer = 0;
    jumpCount = 0;
    speed = 6;

    dino.y = groundY - dino.height;
    dino.velocityY = 0;
    dino.onGround = true;
}

// ================================
// LOOP PRINCIPAL
// ================================
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar piso siempre
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, groundY, canvas.width, 40);

    // Dibujar dino siempre
    ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);

    if (!gameStarted) {
        // Pantalla de espera
        ctx.fillStyle = "#000";
        ctx.font = "24px Arial";
        ctx.fillText("Activa el micrófono y presiona INICIAR", 120, 150);
        requestAnimationFrame(update);
        return;
    }

    // ================================
    // JUEGO ACTIVO
    // ================================
    volume = getMicVolume();

    // 🔴 AÚN NO usamos volumen para saltar (siguiente paso)

    // Gravedad
    dino.velocityY += gravity;
    dino.y += dino.velocityY;

    if (dino.y + dino.height >= groundY) {
        dino.y = groundY - dino.height;
        dino.velocityY = 0;
        dino.onGround = true;
    }

    // Troncos
    logTimer++;
    if (logTimer > 90) {
        logs.push(createLog());
        logTimer = 0;
    }

    logs.forEach(log => log.x -= speed);
    logs = logs.filter(log => log.x + log.width > 0);

    // Colisiones
    logs.forEach(log => {
        if (
            dino.x < log.x + log.width &&
            dino.x + dino.width > log.x &&
            dino.y < log.y + log.height &&
            dino.y + dino.height > log.y
        ) {
            alert("Game Over");
            gameStarted = false;
        }
    });

    // Troncos
    logs.forEach(log => {
        ctx.fillRect(log.x, log.y, log.width, log.height);
    });

    // Texto
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText("DinoLomas", 10, 25);
    ctx.fillText(`Saltos: ${jumpCount}`, canvas.width - 120, 25);
    ctx.fillText(`Volumen: ${volume.toFixed(1)}`, 10, 50);

    requestAnimationFrame(update);
}

// ================================
// ARRANQUE
// ================================
update();
