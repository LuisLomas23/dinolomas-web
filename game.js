// ================================
// CANVAS
// ================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================================
// ESTADO
// ================================
let gameStarted = false;

// ================================
// VELOCIDAD
// ================================
let speed = 6;
let jumpCount = 0;
const speedIncrement = 1;
const maxSpeed = 16;

// ================================
// DINOSAURIO
// ================================
const dinoImg = new Image();
dinoImg.src = "dino.png";

const dino = {
    x: 80,
    y: 0,
    width: 60,
    height: 60,
    velocityY: 0,
    onGround: false
};

const gravity = 0.9;

// ================================
// SALTO POR VOZ
// ================================
const SOUND_THRESHOLD = 5;
const MIN_JUMP = 8;
const MAX_JUMP = 22;
let canJumpBySound = true;

// ================================
// PISO Y ABISMOS
// ================================
const groundY = 260;
const groundHeight = 40;

let groundSegments = [];
let groundTimer = 0;

function createGroundSegment() {
    const isGap = Math.random() < 0.25; // 25% abismos
    const width = isGap ? 80 + Math.random() * 80 : 120 + Math.random() * 80;

    return {
        x: canvas.width,
        width,
        isGap
    };
}

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
let micEnabled = false;
let volume = 0;

const micButton = document.getElementById("micButton");
const micStatus = document.getElementById("micStatus");
const startButton = document.getElementById("startButton");

micButton.onclick = async () => {
    if (micEnabled) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const mic = audioContext.createMediaStreamSource(stream);
    mic.connect(analyser);

    micEnabled = true;
    micStatus.textContent = "Micrófono: activo ✅";
};

startButton.onclick = () => {
    if (!micEnabled) {
        alert("Activa el micrófono primero");
        return;
    }
    resetGame();
    gameStarted = true;
};

// ================================
// MIC VOLUMEN
// ================================
function getMicVolume() {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += Math.abs(data[i] - 128);
    }
    return sum / data.length;
}

// ================================
// SALTO PROPORCIONAL
// ================================
function jumpWithVoice(volume) {
    let force = volume * 1.2;
    force = Math.max(MIN_JUMP, Math.min(MAX_JUMP, force));

    dino.velocityY = -force;
    dino.onGround = false;
    jumpCount++;

    if (jumpCount % 3 === 0 && speed < maxSpeed) {
        speed += speedIncrement;
    }
}

// ================================
// RESET
// ================================
function resetGame() {
    logs = [];
    groundSegments = [];
    groundTimer = 0;
    logTimer = 0;

    speed = 6;
    jumpCount = 0;

    dino.y = 0;
    dino.velocityY = 0;
    dino.onGround = false;
    canJumpBySound = true;
}

// ================================
// LOOP PRINCIPAL
// ================================
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        ctx.font = "24px Arial";
        ctx.fillText("Activa el micrófono y presiona INICIAR", 120, 150);
        requestAnimationFrame(update);
        return;
    }

    // ================================
    // MICRÓFONO
    // ================================
    volume = getMicVolume();

    if (volume > SOUND_THRESHOLD && dino.onGround && canJumpBySound) {
        jumpWithVoice(volume);
        canJumpBySound = false;
    }
    if (volume < SOUND_THRESHOLD) {
        canJumpBySound = true;
    }

    // ================================
    // GRAVEDAD
    // ================================
    dino.velocityY += gravity;
    dino.y += dino.velocityY;

    dino.onGround = false;

    // ================================
    // PISO / ABISMOS
    // ================================
    groundTimer++;
    if (groundTimer > 80) {
        groundSegments.push(createGroundSegment());
        groundTimer = 0;
    }

    groundSegments.forEach(seg => seg.x -= speed);
    groundSegments = groundSegments.filter(seg => seg.x + seg.width > 0);

    groundSegments.forEach(seg => {
        if (!seg.isGap) {
            ctx.fillStyle = "#8B4513";
            ctx.fillRect(seg.x, groundY, seg.width, groundHeight);

            if (
                dino.x + dino.width > seg.x &&
                dino.x < seg.x + seg.width &&
                dino.y + dino.height >= groundY &&
                dino.y + dino.height <= groundY + 20 &&
                dino.velocityY >= 0
            ) {
                dino.y = groundY - dino.height;
                dino.velocityY = 0;
                dino.onGround = true;
            }
        }
    });

    // ================================
    // TRONCOS
    // ================================
    logTimer++;
    if (logTimer > 120) {
        logs.push(createLog());
        logTimer = 0;
    }

    logs.forEach(log => log.x -= speed);
    logs = logs.filter(log => log.x + log.width > 0);

    logs.forEach(log => {
        ctx.fillRect(log.x, log.y, log.width, log.height);
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

    // ================================
    // CAÍDA AL VACÍO
    // ================================
    if (dino.y > canvas.height) {
        alert("Caíste al abismo 😵");
        gameStarted = false;
    }

    // ================================
    // DIBUJAR DINO
    // ================================
    ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);

    // ================================
    // UI
    // ================================
    ctx.font = "20px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText("DinoLomas", 10, 25);
    ctx.fillText(`Saltos: ${jumpCount}`, canvas.width - 120, 25);
    ctx.fillText(`Volumen: ${volume.toFixed(1)}`, 10, 50);

    requestAnimationFrame(update);
}

update();
