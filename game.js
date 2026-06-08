const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statsBar = document.getElementById("statsBar");

// Spēles globālie stāvokļi: "MENU", "LEVEL_SELECT", "PLAYING", "PAUSED"
let gameState = "MENU"; 
let previousState = "PLAYING"; // pauzes atmiņai
const groundY = 370;
let gameSpeed = 7.5;
let currentLevel = null;
let currentLevelIndex = 0;
let distanceTraveled = 0;
let isGameOver = false;
let isVictory = false;
let gameMode = "CUBE"; 
let inputPressed = false;

let obstacles = [];
let particles = [];
let frameCount = 0;

// 6 PAPLAŠINĀTI UN GARI LĪMEŅI (length: 5000 - 8000 pikseļi)
const levels = [
    {
        name: "1. STEREO MADNESS", difficulty: "Easy", bgColor: "#0f051d", floorColor: "#00ffff", length: 5000, mode: "CUBE",
        obstacles: [
            { x: 600, type: "spike" }, { x: 1000, type: "spike" }, { x: 1400, type: "double-spike" },
            { x: 1800, type: "block", y: groundY - 40, w: 40, h: 40 }, { x: 2200, type: "spike" },
            { x: 2600, type: "triple-spike" }, { x: 3100, type: "block", y: groundY - 40, w: 80, h: 40 },
            { x: 3600, type: "spike" }, { x: 4100, type: "double-spike" }, { x: 4500, type: "spike" }
        ]
    },
    {
        name: "2. BACK ON TRACK", difficulty: "Normal", bgColor: "#0c182b", floorColor: "#e600ff", length: 5500, mode: "CUBE",
        obstacles: [
            { x: 500, type: "spike" }, { x: 900, type: "double-spike" }, 
            { x: 1300, type: "block", y: groundY - 40, w: 40, h: 40 }, { x: 1340, type: "spike" },
            { x: 1800, type: "triple-spike" }, { x: 2300, type: "block", y: groundY - 80, w: 40, h: 80 },
            { x: 2800, type: "spike" }, { x: 3300, type: "double-spike" }, 
            { x: 3800, type: "block", y: groundY - 40, w: 120, h: 40 }, { x: 4300, type: "triple-spike" },
            { x: 4800, type: "spike" }
        ]
    },
    {
        name: "3. POLARGEIST", difficulty: "Normal", bgColor: "#122b15", floorColor: "#33ff33", length: 6000, mode: "CUBE",
        obstacles: [
            { x: 600, type: "spike" }, { x: 900, type: "block", y: groundY - 40, w: 40, h: 40 },
            { x: 1300, type: "triple-spike" }, { x: 1700, type: "air-spike", y: groundY - 60 }, // gaisa dzelonis
            { x: 2100, type: "double-spike" }, { x: 2500, type: "block", y: groundY - 40, w: 160, h: 40 },
            { x: 3000, type: "spike" }, { x: 3500, type: "air-spike", y: groundY - 50 },
            { x: 4000, type: "triple-spike" }, { x: 4600, type: "block", y: groundY - 80, w: 40, h: 80 },
            { x: 5200, type: "double-spike" }
        ]
    },
    {
        name: "4. DRY OUT", difficulty: "Hard", bgColor: "#2b1b0c", floorColor: "#ff9900", length: 6500, mode: "CUBE",
        obstacles: [
            { x: 500, type: "triple-spike" }, { x: 900, type: "air-spike", y: groundY - 70 },
            { x: 1300, type: "block", y: groundY - 40, w: 40, h: 40 }, { x: 1600, type: "triple-spike" },
            { x: 2000, type: "block", y: groundY - 80, w: 80, h: 80 }, { x: 2500, type: "air-spike", y: groundY - 40 },
            { x: 3000, type: "triple-spike" }, { x: 3500, type: "block", y: groundY - 40, w: 40, h: 40 },
            { x: 4000, type: "double-spike" }, { x: 4500, type: "triple-spike" }, { x: 5200, type: "spike" },
            { x: 5800, type: "triple-spike" }
        ]
    },
    {
        name: "5. SHIP MAYHEM", difficulty: "Hard", bgColor: "#2a0511", floorColor: "#ff3300", length: 7000, mode: "SHIP",
        obstacles: [
            { x: 500, type: "block", y: 40, w: 50, h: 120 }, { x: 800, type: "block", y: groundY - 120, w: 50, h: 120 },
            { x: 1200, type: "block", y: 150, w: 50, h: 100 }, { x: 1600, type: "block", y: 40, w: 60, h: 150 },
            { x: 2000, type: "block", y: groundY - 150, w: 60, h: 150 }, { x: 2500, type: "block", y: 120, w: 50, h: 160 },
            { x: 3000, type: "block", y: 40, w: 40, h: 100 }, { x: 3400, type: "block", y: groundY - 100, w: 40, h: 100 },
            { x: 3900, type: "block", y: 160, w: 60, h: 80 }, { x: 4400, type: "block", y: 40, w: 80, h: 140 },
            { x: 4900, type: "block", y: groundY - 140, w: 80, h: 140 }, { x: 5500, type: "block", y: 130, w: 40, h: 140 },
            { x: 6200, type: "spike", y: groundY }
        ]
    },
    {
        name: "6. PEPE CLUBSTEP", difficulty: "Demon", bgColor: "#14031a", floorColor: "#ff0055", length: 8000, mode: "SHIP",
        obstacles: [
            { x: 400, type: "block", y: 40, w: 50, h: 160 }, { x: 700, type: "block", y: groundY - 160, w: 50, h: 160 },
            { x: 1000, type: "block", y: 130, w: 60, h: 140 }, { x: 1400, type: "block", y: 40, w: 40, h: 180 },
            { x: 1700, type: "block", y: groundY - 180, w: 40, h: 180 }, { x: 2100, type: "block", y: 110, w: 70, h: 180 },
            { x: 2600, type: "block", y: 40, w: 50, h: 120 }, { x: 2900, type: "block", y: groundY - 120, w: 50, h: 120 },
            { x: 3400, type: "block", y: 150, w: 50, h: 100 }, { x: 3900, type: "block", y: 40, w: 90, h: 150 },
            { x: 4400, type: "block", y: groundY - 150, w: 90, h: 150 }, { x: 5000, type: "block", y: 100, w: 50, h: 200 },
            { x: 5600, type: "block", y: 40, w: 40, h: 160 }, { x: 6000, type: "block", y: groundY - 160, w: 40, h: 160 },
            { x: 6600, type: "block", y: 140, w: 60, h: 120 }, { x: 7300, type: "block", y: 40, w: 100, h: 140 }
        ]
    }
];

// Pogas izvēlnēm un pauzei
const buttons = {
    play: { x: 350, y: 220, w: 200, h: 60, text: "START" },
    prev: { x: 100, y: 220, w: 80, h: 60, text: "<" },
    next: { x: 720, y: 220, w: 80, h: 60, text: ">" },
    select: { x: 325, y: 320, w: 250, h: 50, text: "SPĒLĒT" },
    back: { x: 30, y: 30, w: 100, h: 40, text: "ATPAKAĻ" },
    pauseBtn: { x: 840, y: 10, w: 40, h: 40, text: "II" }, // Pauzes poga spēles laikā
    resume: { x: 350, y: 160, w: 200, h: 50, text: "TURPINĀT" },
    restart: { x: 350, y: 230, w: 200, h: 50, text: "RESTARTĒT" },
    exit: { x: 350, y: 300, w: 200, h: 50, text: "UZ MENU" }
};

// Spēlētājs (Pepe)
const player = {
    x: 150, y: groundY - 40, width: 40, height: 40, velocity: 0,
    gravity: 0.7, shipGravity: 0.35, jumpForce: -12, shipFlyForce: -0.8, grounded: false, rotation: 0,

    update() {
        if (gameMode === "CUBE") {
            this.velocity += this.gravity; this.y += this.velocity;
            if (this.y + this.height >= groundY) {
                this.y = groundY - this.height; this.velocity = 0; this.grounded = true;
                this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
            } else { this.rotation += 0.09; this.grounded = false; }
        } else if (gameMode === "SHIP") {
            if (inputPressed) this.velocity += this.shipFlyForce; else this.velocity += this.shipGravity;
            this.velocity = Math.max(-6, Math.min(6, this.velocity)); this.y += this.velocity;
            if (this.y + this.height >= groundY) { this.y = groundY - this.height; this.velocity = 0; }
            if (this.y <= 40) { this.y = 40; this.velocity = 0; }
            this.rotation = this.velocity * 0.05;
        }
        if (frameCount % 2 === 0) {
            particles.push({ x: this.x, y: this.y + this.height / 2, size: Math.random() * 6 + 4, alpha: 1 });
        }
    },
    draw() {
        ctx.save(); ctx.translate(this.x + this.width / 2, this.y + this.height / 2); ctx.rotate(this.rotation);
        ctx.fillStyle = "#4CAF50"; ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = "#fff"; ctx.fillRect(-12, -12, 10, 10); ctx.fillRect(2, -12, 10, 10);
        ctx.fillStyle = "#000"; ctx.fillRect(-8, -9, 4, 4); ctx.fillRect(6, -9, 4, 4);
        ctx.fillStyle = "#ff3333"; ctx.fillRect(-10, 4, 20, 4); ctx.restore();
    }
};

// Klikšķu/Pauzes noteikšana
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (gameState === "MENU") {
        if (checkClick(mouseX, mouseY, buttons.play)) gameState = "LEVEL_SELECT";
    } 
    else if (gameState === "LEVEL_SELECT") {
        if (checkClick(mouseX, mouseY, buttons.prev)) currentLevelIndex = (currentLevelIndex - 1 + levels.length) % levels.length;
        else if (checkClick(mouseX, mouseY, buttons.next)) currentLevelIndex = (currentLevelIndex + 1) % levels.length;
        else if (checkClick(mouseX, mouseY, buttons.select)) startLevel(currentLevelIndex);
        else if (checkClick(mouseX, mouseY, buttons.back)) gameState = "MENU";
    } 
    else if (gameState === "PLAYING") {
        // Pārbauda vai uzspiesta maza pauzes poga augšā stūrī
        if (checkClick(mouseX, mouseY, buttons.pauseBtn)) {
            gameState = "PAUSED";
            return;
        }
        inputPressed = true;
        if (isGameOver || isVictory) resetLevel();
        else if (gameMode === "CUBE" && player.grounded) { player.velocity = player.jumpForce; player.grounded = false; }
    }
    else if (gameState === "PAUSED") {
        if (checkClick(mouseX, mouseY, buttons.resume)) gameState = "PLAYING";
        else if (checkClick(mouseX, mouseY, buttons.restart)) { gameState = "PLAYING"; resetLevel(); }
        else if (checkClick(mouseX, mouseY, buttons.exit)) gameState = "LEVEL_SELECT";
    }
});

canvas.addEventListener("mouseup", () => { inputPressed = false; });

// Klavatūras P poga pauzei
window.addEventListener("keydown", (e) => {
    if (e.code === "KeyP") {
        if (gameState === "PLAYING") gameState = "PAUSED";
        else if (gameState === "PAUSED") gameState = "PLAYING";
    }
    if (e.code === "Space" || e.code === "ArrowUp") {
        inputPressed = true;
        if (gameState === "PLAYING") {
            if (isGameOver || isVictory) resetLevel();
            else if (gameMode === "CUBE" && player.grounded) { player.velocity = player.jumpForce; player.grounded = false; }
        }
    }
});
window.addEventListener("keyup", (e) => { if (e.code === "Space" || e.code === "ArrowUp") inputPressed = false; });

function checkClick(mx, my, btn) {
    return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
}

function startLevel(index) {
    gameState = "PLAYING";
    statsBar.style.display = "flex";
    currentLevel = JSON.parse(JSON.stringify(levels[index]));
    document.getElementById("levelNameText").innerText = currentLevel.name;
    resetLevel();
}

function resetLevel() {
    distanceTraveled = 0; frameCount = 0; isGameOver = false; isVictory = false;
    gameMode = currentLevel.mode; player.y = groundY - player.height; player.velocity = 0; player.rotation = 0; particles = [];
    obstacles = currentLevel.obstacles.map(o => ({ x: o.x, y: o.y || groundY, width: o.w || 30, height: o.h || 35, type: o.type }));
}

function update() {
    if (gameState !== "PLAYING" || isGameOver || isVictory) return;

    frameCount++;
    distanceTraveled += gameSpeed;
    player.update();

    let progress = Math.min(100, Math.floor((distanceTraveled / currentLevel.length) * 100));
    document.getElementById("scoreText").innerText = `PROGRESS: ${progress}%`;
    let savedHighScore = localStorage.getItem(`pepeLevel_${currentLevelIndex}`) || 0;
    document.getElementById("highScoreText").innerText = `BEST: ${savedHighScore}%`;

    if (distanceTraveled >= currentLevel.length) {
        isVictory = true;
        localStorage.setItem(`pepeLevel_${currentLevelIndex}`, 100);
        return;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x -= gameSpeed - 2; particles[i].alpha -= 0.04;
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    for (let o of obstacles) {
        o.x -= gameSpeed;
        let hitX = player.x + 4 < o.x + o.width && player.x + player.width - 4 > o.x;
        let hitY = false;

        if (o.type === "spike" || o.type === "double-spike" || o.type === "triple-spike" || o.type === "air-spike") {
            hitY = player.y + player.height > o.y - o.height && player.y + 4 < o.y;
        } else if (o.type === "block") {
            hitY = player.y < o.y + o.height && player.y + player.height > o.y;
        }

        if (hitX && hitY) {
            isGameOver = true;
            if (progress > savedHighScore) localStorage.setItem(`pepeLevel_${currentLevelIndex}`, progress);
        }
    }
}

function drawButton(btn, color = "#00ffff") {
    ctx.fillStyle = "#111"; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h); ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial"; ctx.textAlign = "center";
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6); ctx.textAlign = "start";
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "MENU") {
        statsBar.style.display = "none";
        ctx.fillStyle = "#090414"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#4CAF50"; ctx.font = "bold 50px Arial"; ctx.fillText("PEPE DASH", 310, 140);
        drawButton(buttons.play, "#4CAF50");
    } 
    else if (gameState === "LEVEL_SELECT") {
        ctx.fillStyle = "#070c1f"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff"; ctx.font = "bold 28px Arial"; ctx.fillText("IZVĒLIES LĪMENI", 330, 100);

        let lvl = levels[currentLevelIndex];
        ctx.fillStyle = "#111a3a"; ctx.fillRect(250, 140, 400, 150);
        ctx.strokeStyle = "#00ffff"; ctx.strokeRect(250, 140, 400, 150);

        ctx.fillStyle = "#fff"; ctx.font = "18px Arial"; ctx.fillText(lvl.name, 270, 180);
        ctx.fillStyle = lvl.difficulty === "Demon" ? "#ff00ff" : (lvl.difficulty === "Hard" ? "#ff3333" : "#33ff33");
        ctx.fillText(`Grūtība: ${lvl.difficulty}`, 270, 215);
        let savedScore = localStorage.getItem(`pepeLevel_${currentLevelIndex}`) || 0;
        ctx.fillStyle = "#00ffff"; ctx.fillText(`Labākais: ${savedScore}%`, 270, 250);

        drawButton(buttons.prev); drawButton(buttons.next); drawButton(buttons.select, "#4CAF50"); drawButton(buttons.back, "#ff3333");
    } 
    else if (gameState === "PLAYING" || gameState === "PAUSED") {
        ctx.fillStyle = currentLevel.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        let offset = (distanceTraveled) % 40;
        for (let x = -offset; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke(); }

        for (let p of particles) { ctx.fillStyle = `rgba(78, 240, 93, ${p.alpha})`; ctx.fillRect(p.x, p.y, p.size, p.size); }

        // Šķēršļu zīmēšana
        ctx.fillStyle = "#ff0055";
        for (let o of obstacles) {
            if (o.type === "spike") {
                ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.width / 2, o.y - o.height); ctx.lineTo(o.x + o.width, o.y); ctx.closePath(); ctx.fill();
            } else if (o.type === "double-spike" || o.type === "triple-spike") {
                let count = o.type === "double-spike" ? 2 : 3;
                let w = o.width / count;
                for(let j=0; j<count; j++) {
                    let sx = o.x + (j*w);
                    ctx.beginPath(); ctx.moveTo(sx, o.y); ctx.lineTo(sx + w / 2, o.y - o.height); ctx.lineTo(sx + w, o.y); ctx.closePath(); ctx.fill();
                }
            } else if (o.type === "air-spike") {
                ctx.fillStyle = "#ffcc00";
                ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.width / 2, o.y - o.height); ctx.lineTo(o.x + o.width, o.y); ctx.closePath(); ctx.fill();
            } else if (o.type === "block") {
                ctx.fillStyle = "#3a3a3a"; ctx.fillRect(o.x, o.y, o.width, o.height);
                ctx.strokeStyle = "#5a5a5a"; ctx.strokeRect(o.x, o.y, o.width, o.height);
            }
        }

        player.draw();

        // Robežas
        ctx.fillStyle = "#000"; ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY); ctx.fillRect(0, 0, canvas.width, 40);
        ctx.strokeStyle = currentLevel.floorColor; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(canvas.width, 40); ctx.stroke();

        // Maza pauzes poga stūrī
        drawButton(buttons.pauseBtn, "#555");

        if (isGameOver) {
            ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ff2a6d"; ctx.font = "bold 36px Arial"; ctx.textAlign = "center";
            ctx.fillText("SPĒLE BEIGUSIES", canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = "#fff"; ctx.font = "18px Arial"; ctx.fillText("Klikšķini, lai restartētu", canvas.width / 2, canvas.height / 2 + 40);
            ctx.textAlign = "start";
        }
        if (isVictory) {
            ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#33ff33"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center";
            ctx.fillText("LĪMENIS PABEIGTS!", canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = "#fff"; ctx.font = "18px Arial"; ctx.fillText("Klikšķini, lai dotos uz izvēlni", canvas.width / 2, canvas.height / 2 + 50);
            ctx.textAlign = "start";
        }

        // PAUZES LOGS (Ja spēle ir pauzēta)
        if (gameState === "PAUSED") {
            ctx.fillStyle = "rgba(10, 5, 25, 0.85)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#00ffff";
            ctx.font = "bold 36px Arial";
            ctx.textAlign = "center";
            ctx.fillText("PAUZE", canvas.width / 2, 100);
            ctx.textAlign = "start";

            drawButton(buttons.resume, "#33ff33");
            drawButton(buttons.restart, "#ffcc00");
            drawButton(buttons.exit, "#ff3333");
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
