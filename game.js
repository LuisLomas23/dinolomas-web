const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --------------------
// Variables generales
// --------------------
let jumpCount = 0;
let speed = 6;
const speedIncrement = 1;
const maxSpeed = 16;

// --------------------
// Dinosaurio
// --------------------
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

// --------------------
// Piso
// --------------------
const groundY = 260;

// --------------------
// Troncos
// --------------------
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

// --------------------
// Controles
// --------------------
document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "b" && dino.onGround) {
        dino.velocityY = -jumpForce;
        dino.onGround = false;
        jumpCount++;

        if (jumpCount % 3 === 0 && speed < maxSpeed) {
            speed += speedIncrement;
        }
    }
});

// --------------------
// Loop principal
// --------------------
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
            location.reload();
        }
    });

    // Dibujar piso
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, groundY, canvas.width, 40);

    // Dibujar dino
    ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);

    // Dibujar troncos
    ctx.fillStyle = "#8B4513";
    logs.forEach(log => ctx.fillRect(log.x, log.y, log.width, log.height));

    // Texto
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText("DinoLomas", 10, 25);
    ctx.fillText(`Saltos: ${jumpCount}`, canvas.width - 120, 25);

    requestAnimationFrame(update);
}

update();
