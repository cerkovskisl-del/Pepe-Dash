const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statsBar = document.getElementById("statsBar");

let gameState = "MENU"; 
const groundY = 370;
let currentLevel = null;
let currentLevelIndex = 0;
let distanceTraveled = 0;
let isGameOver = false;
let isVictory = false;
let gameMode = "CUBE"; 
let inputPressed = false;

// Delta Time mainīgie priekš plūdenas kustības
let lastTime = 0;

// Spēles bāzes ātrumi
let currentSpeed = 400; 
let levelCoinsCollected = 0; 

let obstacles = [];
let pads = [];
let coins = [];
let speedPortals = [];
let particles = [];
let frameCount = 0;
let particleTimer = 0;

// 6 LĪMEŅI
const levels = [
    {
        name: "1. STEREO MADNESS (Classic)", difficulty: "Easy", bgColor: "#0f051d", floorColor: "#00ffff", length: 4500, mode: "CUBE", baseSpeed: 380,
        setup: function() {
            obstacles.push({ x: 600, type: "spike", width: 30, height: 40 });
            obstacles.push({ x: 1000, type: "block", y: groundY - 40, width: 80, height: 40 });
            obstacles.push({ x: 1080, type: "block", y: groundY - 80, width: 80, height: 80 });
            obstacles.push({ x: 1400, type: "spike", width: 30, height: 40 });
            
            pads.push({ x: 1800, y: groundY, radius: 15 });
            obstacles.push({ x: 1840, type: "spike", width: 30, height: 40 });
            obstacles.push({ x: 2400, type: "double-spike", width: 60, height: 40 });
            
            coins.push({ x: 1080, y: groundY - 140 });
            coins.push({ x: 3200, y: groundY - 80 });
        }
    },
    {
        name: "2. TIME WARP (Slow Mo)", difficulty: "Normal", bgColor: "#1a2405", floorColor: "#aaff00", length: 4000, mode: "CUBE", baseSpeed: 250,
        setup: function() {
            for (let x = 600; x < 3500; x += 600) {
                obstacles.push({ x: x, type: "block", y: groundY - 40, width: 60, height: 40 });
                obstacles.push({ x: x + 15, type: "spike", y: groundY - 40, width: 30, height: 40 }); 
                if (x % 1200 === 0) coins.push({ x: x + 20, y: groundY - 100 });
            }
        }
    },
    {
        name: "3. NITRO DASH (Super Fast)", difficulty: "Hard", bgColor: "#300505", floorColor: "#ff0000", length: 6500, mode: "CUBE", baseSpeed: 600,
        setup: function() {
            obstacles.push({ x: 800, type: "spike", width: 30, height: 40 });
            obstacles.push({ x: 1200, type: "block", y: groundY - 60, width: 300, height: 60 });
            obstacles.push({ x: 1800, type: "triple-spike", width: 90, height: 40 });
            pads.push({ x: 2400, y: groundY, radius: 15 });
            coins.push({ x: 1350, y: groundY - 120 }); 
            obstacles.push({ x: 3500, type: "block", y: groundY - 40, width: 200, height: 40 });
            obstacles.push({ x: 4500, type: "triple-spike", width: 90, height: 40 });
        }
    },
    {
        name: "4. TRAMPOLINE VALLEY", difficulty: "Hard", bgColor: "#05262b", floorColor: "#00ffcc", length: 5000, mode: "CUBE", baseSpeed: 420,
        setup: function() {
            pads.push({ x: 600, y: groundY, radius: 15 });
            obstacles.push({ x: 750, type: "spike", width: 30, height: 40 });
            obstacles.push({ x: 1200, type: "block", y: groundY - 80, width: 80, height: 80 });
            pads.push({ x: 1240, y: groundY - 80, radius: 15 }); 
            obstacles.push({ x: 1800, type: "block", y: groundY - 140, width: 80, height: 140 });
            coins.push({ x: 1240, y: groundY - 150 });
            obstacles.push({ x: 2400, type: "triple-spike", width: 90, height: 40 });
            pads.push({ x: 3000, y: groundY, radius: 15 });
        }
    },
    {
        name: "5. SHIP FLIGHT (Flappy Pepe)", difficulty: "Hard", bgColor: "#26052b", floorColor: "#ff00ff", length: 6000, mode: "SHIP", baseSpeed: 420,
        setup: function() {
            for (let x = 600; x < 5500; x += 600) {
                obstacles.push({ x: x, type: "block", y: 40, width: 60, height: 140 });
                obstacles.push({ x: x + 300, type: "block", y: groundY - 140, width: 60, height: 140 });
                if (x % 1200 === 0) coins.push({ x: x + 130, y: 140 });
            }
        }
    },
    {
        name: "6. DEMONIC SPEEDWAY", difficulty: "Demon", bgColor: "#000000", floorColor: "#ff3300", length: 8000, mode: "CUBE", baseSpeed: 460,
        setup: function() {
            obstacles.push({ x: 500, type: "triple-spike", width: 90, height: 40 });
            obstacles.push({ x: 1000, type: "block", y: groundY - 40, width: 120, height: 40 });
            obstacles.push({ x: 1600, type: "air-spike", y: groundY - 60, width: 30, height: 40 });
            
            speedPortals.push({ x: 2200, y: groundY - 140, w: 40, h: 140, targetSpeed: 600, toMode: "SHIP" });
            
            obstacles.push({ x: 2800, type: "block", y: 40, width: 60, height: 160 });
            obstacles.push({ x: 3300, type: "block", y: groundY - 160, width: 60, height: 160 });
            coins.push({ x: 3800, y: 200 });
            
            speedPortals.push({ x: 5500, y: groundY - 140, w: 40, h: 140, targetSpeed: 420, toMode: "CUBE" });
            obstacles.push({ x: 6200, type: "triple-spike", width: 90, height: 40 });
        }
    }
];

const buttons = {
    play: { x: 350, y: 220, w: 200, h: 60, text: "START" },
    prev: { x: 100, y: 220, w: 80, h: 60, text: "<" },
    next: { x: 720, y: 220, w: 80, h: 60, text: ">" },
    select: { x: 325, y: 320, w: 250, h: 50, text: "PLAY" },
    back: { x: 30, y: 30, w: 100, h: 40, text: "BACK" },
    pauseBtn: { x: 840, y: 10, w: 40, h: 40, text: "II" },
    resume: { x: 350, y: 160, w: 200, h: 50, text: "RESUME" },
    restart: { x: 350, y: 230, w: 200, h: 50, text: "RESTART" },
    exit: { x: 350, y: 300, w: 200, h: 50, text: "MENU" }
};

// Spēlētājs
const player = {
    x: 150, y: groundY - 40, width: 40, height: 40, velocity: 0,
    gravity: 42, shipGravity: 21, jumpForce: -750, shipFlyForce: -52, grounded: false, rotation: 0,

    update(dt) {
        if (gameMode === "CUBE") {
            this.velocity += this.gravity * dt * 60; 
            this.y += this.velocity * dt;

            if (this.y + this.height >= groundY) {
                this.y = groundY - this.height; 
                this.velocity = 0; 
                this.grounded = true;
                this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
            } else { 
                if (!this.grounded) {
                    this.rotation += 0.6 * dt * (currentSpeed / 100); 
                }
            }
        } else if (gameMode === "SHIP") {
            if (inputPressed) this.velocity += this.shipFlyForce * dt * 60; else this.velocity += this.shipGravity * dt * 60;
            this.velocity = Math.max(-360, Math.min(360, this.velocity)); 
            this.y += this.velocity * dt;
            if (this.y + this.height >= groundY) { this.y = groundY - this.height; this.velocity = 0; }
            if (this.y <= 40) { this.y = 40; this.velocity = 0; }
            this.rotation = this.velocity * 0.003;
        }

        particleTimer += dt;
        if (particleTimer > 0.03) {
            particles.push({ x: this.x, y: this.y + this.height / 2, size: Math.random() * 6 + 4, alpha: 1 });
            particleTimer = 0;
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

// Apstrādā klikšķa/skāriena loģiku (Kopīga funkcija datoram un telefonam)
function handlePress(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

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
        if (checkClick(mouseX, mouseY, buttons.pauseBtn)) { gameState = "PAUSED"; return; }
        inputPressed = true;
        if (isGameOver || isVictory) resetLevel();
        else if (gameMode === "CUBE" && player.grounded) { player.velocity = player.jumpForce; player.grounded = false; }
    }
    else if (gameState === "PAUSED") {
        if (checkClick(mouseX, mouseY, buttons.resume)) gameState = "PLAYING";
        else if (checkClick(mouseX, mouseY, buttons.restart)) { gameState = "PLAYING"; resetLevel(); }
        else if (checkClick(mouseX, mouseY, buttons.exit)) gameState = "LEVEL_SELECT";
    }
}

// DATORA PELE
canvas.addEventListener("mousedown", (e) => { handlePress(e.clientX, e.clientY); });
canvas.addEventListener("mouseup", () => { inputPressed = false; });

// TELEFONA TOUCH NOTIKUMI (Pievienots priekš telefoniem)
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Neļauj telefonam pietuvināt/zoomot ekrānu strauju pieskārienu laikā
    if (e.touches.length > 0) {
        handlePress(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    inputPressed = false;
}, { passive: false });

// KLAVIATŪRA (Datoram)
window.addEventListener("keydown", (e) => {
    if (e.code === "KeyP") { gameState = (gameState === "PLAYING") ? "PAUSED" : (gameState === "PAUSED" ? "PLAYING" : gameState); }
    if (e.code === "Space" || e.code === "ArrowUp") {
        inputPressed = true;
        if (gameState === "PLAYING") {
            if (isGameOver || isVictory) resetLevel();
            else if (gameMode === "CUBE" && player.grounded) { player.velocity = player.jumpForce; player.grounded = false; }
        }
    }
});
window.addEventListener("keyup", (e) => { if (e.code === "Space" || e.code === "ArrowUp") inputPressed = false; });

function checkClick(mx, my, btn) { return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h; }

function startLevel(index) {
    gameState = "PLAYING";
    statsBar.style.display = "flex";
    currentLevel = levels[index];
    document.getElementById("levelNameText").innerText = currentLevel.name;
    resetLevel();
}

function resetLevel() {
    distanceTraveled = 0; frameCount = 0; isGameOver = false; isVictory = false; levelCoinsCollected = 0;
    gameMode = currentLevel.mode; currentSpeed = currentLevel.baseSpeed;
    player.y = groundY - player.height; player.velocity = 0; player.rotation = 0; player.grounded = true; particles = [];
    
    obstacles = []; pads = []; coins = []; speedPortals = [];
    currentLevel.setup(); 
    lastTime = performance.now();
}

function update(dt) {
    if (gameState !== "PLAYING" || isGameOver || isVictory) return;

    frameCount++;
    let moveAmount = currentSpeed * dt;
    distanceTraveled += moveAmount;

    let stoodOnSomething = false;

    for (let o of obstacles) {
        o.x -= moveAmount;

        if (o.type === "block") {
            let hitX = player.x + 2 < o.x + o.width && player.x + player.width - 2 > o.x;
            let hitY = player.y < o.y + o.height && player.y + player.height > o.y;

            if (hitX && hitY) {
                let overlapY = (player.y + player.height) - o.y;
                if (overlapY <= (player.velocity * dt) + 4 && player.velocity >= 0 && gameMode === "CUBE") {
                    player.y = o.y - player.height;
                    player.velocity = 0;
                    player.grounded = true;
                    stoodOnSomething = true;
                } else {
                    isGameOver = true;
                }
            }
        } else {
            let hitX = player.x + 6 < o.x + o.width && player.x + player.width - 6 > o.x;
            let hitY = false;
            if (o.type === "air-spike") {
                hitY = player.y + player.height > o.y - o.height && player.y < o.y;
            } else {
                hitY = player.y + player.height > groundY - o.height && player.y < groundY;
            }
            if (hitX && hitY) {
                isGameOver = true;
            }
        }
    }

    if (player.y + player.height >= groundY) {
        stoodOnSomething = true;
        player.grounded = true;
    }

    if (!stoodOnSomething && gameMode === "CUBE") {
        player.grounded = false;
    }

    player.update(dt);

    let progress = Math.min(100, Math.floor((distanceTraveled / currentLevel.length) * 100));
    document.getElementById("scoreText").innerText = `PROGRESS: ${progress}% | 🟡:${levelCoinsCollected}/2`;
    let savedHighScore = localStorage.getItem(`pepeLevel_${currentLevelIndex}`) || 0;
    document.getElementById("highScoreText").innerText = `BEST: ${savedHighScore}%`;

    if (isGameOver && progress > savedHighScore) {
        localStorage.setItem(`pepeLevel_${currentLevelIndex}`, progress);
    }

    if (distanceTraveled >= currentLevel.length) {
        isVictory = true;
        localStorage.setItem(`pepeLevel_${currentLevelIndex}`, 100);
        return;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x -= (currentSpeed - 100) * dt; particles[i].alpha -= 2.0 * dt;
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // Tramplīni
    for (let p of pads) {
        p.x -= moveAmount;
        if (player.x + player.width > p.x - p.radius && player.x < p.x + p.radius && player.y + player.height >= p.y - 12 && player.y < p.y) {
            player.velocity = player.jumpForce * 1.15; 
            player.grounded = false;
            player.rotation = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
        }
    }

    // Monētas
    for (let i = coins.length - 1; i >= 0; i--) {
        let c = coins[i];
        c.x -= moveAmount;
        if (player.x < c.x + 20 && player.x + player.width > c.x && player.y < c.y + 20 && player.y + player.height > c.y) {
            levelCoinsCollected++;
            coins.splice(i, 1);
        }
    }

    // Portāli
    for (let i = speedPortals.length - 1; i >= 0; i--) {
        let sp = speedPortals[i];
        sp.x -= moveAmount;
        if (player.x + player.width > sp.x && player.x < sp.x + sp.w && player.y + player.height > sp.y && player.y < sp.y + sp.h) {
            currentSpeed = sp.targetSpeed;
            gameMode = sp.toMode;
            speedPortals.splice(i, 1);
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
        statsBar.style.display = "none";
        ctx.fillStyle = "#070c1f"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff"; ctx.font = "bold 28px Arial"; ctx.fillText("SELECT LEVEL", 330, 100);

        let lvl = levels[currentLevelIndex];
        ctx.fillStyle = "#111a3a"; ctx.fillRect(250, 140, 400, 150);
        ctx.strokeStyle = "#00ffff"; ctx.strokeRect(250, 140, 400, 150);

        ctx.fillStyle = "#fff"; ctx.font = "18px Arial"; ctx.fillText(lvl.name, 270, 180);
        ctx.fillStyle = lvl.difficulty === "Demon" ? "#ff00ff" : (lvl.difficulty === "Hard" ? "#ff3333" : "#33ff33");
        ctx.fillText(`Difficulty: ${lvl.difficulty}`, 270, 215);
        let savedScore = localStorage.getItem(`pepeLevel_${currentLevelIndex}`) || 0;
        ctx.fillStyle = "#00ffff"; ctx.fillText(`Best: ${savedScore}%`, 270, 250);

        drawButton(buttons.prev); drawButton(buttons.next); drawButton(buttons.select, "#4CAF50"); drawButton(buttons.back, "#ff3333");
    } 
    else if (gameState === "PLAYING" || gameState === "PAUSED") {
        ctx.fillStyle = currentLevel.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        let offset = (distanceTraveled) % 40;
        for (let x = -offset; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke(); }

        for (let p of particles) { ctx.fillStyle = `rgba(78, 240, 93, ${p.alpha})`; ctx.fillRect(p.x, p.y, p.size, p.size); }

        for (let p of pads) {
            ctx.fillStyle = "#ffcc00"; ctx.beginPath(); ctx.arc(p.x, p.y - 2, p.radius, 0, Math.PI, true); ctx.fill();
        }

        for (let c of coins) {
            ctx.fillStyle = "#ffd700"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(c.x + 10, c.y + 10, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        for (let sp of speedPortals) {
            ctx.fillStyle = "#ff00ff"; ctx.shadowBlur = 15; ctx.shadowColor = "#ff00ff";
            ctx.fillRect(sp.x, sp.y, sp.w, sp.h); ctx.shadowBlur = 0;
        }

        for (let o of obstacles) {
            if (o.type === "spike") {
                ctx.fillStyle = "#ff0055"; ctx.beginPath(); ctx.moveTo(o.x, groundY); ctx.lineTo(o.x + o.width / 2, groundY - o.height); ctx.lineTo(o.x + o.width, groundY); ctx.closePath(); ctx.fill();
            } else if (o.type === "double-spike" || o.type === "triple-spike") {
                ctx.fillStyle = "#ff0055"; let count = o.type === "double-spike" ? 2 : 3; let w = o.width / count;
                for(let j=0; j<count; j++) {
                    let sx = o.x + (j*w);
                    ctx.beginPath(); ctx.moveTo(sx, groundY); ctx.lineTo(sx + w / 2, groundY - o.height); ctx.lineTo(sx + w, groundY); ctx.closePath(); ctx.fill();
                }
            } else if (o.type === "air-spike") {
                ctx.fillStyle = "#ffcc00"; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.width / 2, o.y - o.height); ctx.lineTo(o.x + o.width, o.y); ctx.closePath(); ctx.fill();
            } else if (o.type === "block") {
                ctx.fillStyle = "#2d2d2d"; ctx.fillRect(o.x, o.y, o.width, o.height); 
                ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 1.5; ctx.strokeRect(o.x, o.y, o.width, o.height);
            }
        }

        player.draw();

        ctx.fillStyle = "#000"; ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY); ctx.fillRect(0, 0, canvas.width, 40);
        ctx.strokeStyle = currentLevel.floorColor; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(canvas.width, 40); ctx.stroke();

        drawButton(buttons.pauseBtn, "#555");

        if (isGameOver) {
            ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ff2a6d"; ctx.font = "bold 36px Arial"; ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = "#fff"; ctx.font = "18px Arial"; ctx.fillText("Tap to restart", canvas.width / 2, canvas.height / 2 + 40);
            ctx.textAlign = "start";
        }
        if (isVictory) {
            ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#33ff33"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center";
            ctx.fillText("LEVEL COMPLETED!", canvas.width / 2, canvas.height / 2);
            ctx.textAlign = "start";
        }
        if (gameState === "PAUSED") {
            ctx.fillStyle = "rgba(10, 5, 25, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#00ffff"; ctx.font = "bold 36px Arial"; ctx.textAlign = "center"; ctx.fillText("PAUSED", canvas.width / 2, 100); ctx.textAlign = "start";
            drawButton(buttons.resume, "#33ff33"); drawButton(buttons.restart, "#ffcc00"); drawButton(buttons.exit, "#ff3333");
        }
    }
}

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1; 
    lastTime = timestamp;

    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(gameLoop);
});
