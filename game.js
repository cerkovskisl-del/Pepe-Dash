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

// Spēles mehānikas mainīgie
let currentSpeed = 7; // Mainās atkarībā no ātruma portāliem
let levelCoinsCollected = 0; // Monētas pašreizējā mēģinājumā

let obstacles = [];
let pads = [];
let coins = [];
let speedPortals = [];
let particles = [];
let frameCount = 0;

// 6 RADIKĀLI ATŠĶIRĪGI LĪMEŅI
const levels = [
    {
        name: "1. STEREO MADNESS (Classic)", difficulty: "Easy", bgColor: "#0f051d", floorColor: "#00ffff", length: 4500, mode: "CUBE", baseSpeed: 6.5,
        setup: function() {
            // Klasisks ritms, parādās pirmie Tramplīni (Pads)
            pads.push({ x: 1200, y: groundY, radius: 15 });
            pads.push({ x: 2200, y: groundY, radius: 15 });
            obstacles.push({ x: 600, type: "spike" }, { x: 900, type: "spike" }, { x: 1210, type: "spike" }); // spike uzreiz aiz pad
            obstacles.push({ x: 1600, type: "double-spike" }, { x: 2600, type: "triple-spike" });
            coins.push({ x: 1800, y: groundY - 80 }, { x: 3200, y: groundY - 80 });
        }
    },
    {
        name: "2. TIME WARP (Slow Mo)", difficulty: "Normal", bgColor: "#1a2405", floorColor: "#aaff00", length: 4000, mode: "CUBE", baseSpeed: 4.5,
        setup: function() {
            // ĻOTI LĒNS LĪMENIS, bet šķēršļi ir salikti ļoti tuvu un blīvi (nepieciešama micro-precizitāte)
            currentSpeed = 4.5;
            for (let x = 600; x < 3500; x += 400) {
                obstacles.push({ x: x, type: "spike" });
                obstacles.push({ x: x + 150, type: "block", y: groundY - 40, w: 40, h: 40 });
                if (x % 800 === 0) coins.push({ x: x + 170, y: groundY - 100 });
            }
        }
    },
    {
        name: "3. NITRO DASH (Super Fast)", difficulty: "Hard", bgColor: "#300505", floorColor: "#ff0000", length: 6500, mode: "CUBE", baseSpeed: 11,
        setup: function() {
            // EXTREME ĀTRUMS (2x ātrāks par 1. līmeni). Reakcijas pārbaude.
            currentSpeed = 11;
            obstacles.push({ x: 800, type: "spike" }, { x: 1400, type: "block", y: groundY - 40, w: 120, h: 40 });
            pads.push({ x: 2000, y: groundY, radius: 15 });
            obstacles.push({ x: 2600, type: "double-spike" }, { x: 3200, type: "triple-spike" });
            coins.push({ x: 2000, y: groundY - 140 }); // Monēta augstu gaisā virs tramplīna
            obstacles.push({ x: 4200, type: "spike" }, { x: 5000, type: "triple-spike" });
        }
    },
    {
        name: "4. TRAMPOLINE VALLEY", difficulty: "Hard", bgColor: "#05262b", floorColor: "#00ffcc", length: 5000, mode: "CUBE", baseSpeed: 7.5,
        setup: function() {
            // LĪMENIS BALSTĪTS UZ TRAMPLĪNIEM (Auto-jump ķēdes)
            // Jālēc pa blokiem un tramplīniem, kas izmētāti gaisā
            pads.push({ x: 600, y: groundY, radius: 15 });
            obstacles.push({ x: 750, type: "spike" });
            
            // Ķēde gaisā
            obstacles.push({ x: 1200, type: "block", y: groundY - 60, w: 60, h: 60 });
            pads.push({ x: 1230, y: groundY - 60, radius: 12 }); // pads uz bloka
            
            obstacles.push({ x: 1800, type: "block", y: groundY - 120, w: 60, h: 120 });
            coins.push({ x: 1830, y: groundY - 160 });

            obstacles.push({ x: 2400, type: "triple-spike" });
            pads.push({ x: 3000, y: groundY, radius: 15 });
            pads.push({ x: 3400, y: groundY, radius: 15 });
        }
    },
    {
        name: "5. SHIP FLIGHT (Flappy Pepe)", difficulty: "Hard", bgColor: "#26052b", floorColor: "#ff00ff", length: 6000, mode: "SHIP", baseSpeed: 7,
        setup: function() {
            // LABIRINTS KUĢĪTIM (Tikai lidošana, šauri gaiteņi)
            for (let x = 600; x < 5500; x += 600) {
                // Alternējošas sienas augšā un apakšā
                obstacles.push({ x: x, type: "block", y: 40, w: 60, h: 140 });
                obstacles.push({ x: x + 300, type: "block", y: groundY - 140, w: 60, h: 140 });
                // Monētas bīstamās vietās tuvu sienām
                if (x % 1200 === 0) coins.push({ x: x + 130, y: 100 });
            }
        }
    },
    {
        name: "6. DEMONIC SPEEDWAY", difficulty: "Demon", bgColor: "#000000", floorColor: "#ff3300", length: 8000, mode: "CUBE", baseSpeed: 8,
        setup: function() {
            // DINAMISKAIS LĪMENIS: Sākas kā Cube, vidū transformējas par super-ātru kuģi!
            obstacles.push({ x: 500, type: "triple-spike" });
            pads.push({ x: 1000, y: groundY, radius: 15 });
            obstacles.push({ x: 1500, type: "air-spike", y: groundY - 60 });
            
            // SPEED PORTAL UN SHIP PORTAL REIZĒ pie 2200px attāluma
            speedPortals.push({ x: 2200, y: groundY - 100, w: 30, h: 100, targetSpeed: 11, toMode: "SHIP" });
            
            // Kuģīša fāze ekstrēmā ātrumā
            obstacles.push({ x: 2800, type: "block", y: 40, w: 50, h: 160 });
            obstacles.push({ x: 3300, type: "block", y: groundY - 160, w: 50, h: 160 });
            coins.push({ x: 3800, y: 200 });
            obstacles.push({ x: 4400, type: "block", y: 130, w: 80, h: 120 });
            
            // Atpakaļ uz parastu ātrumu un kubu pie 5500px
            speedPortals.push({ x: 5500, y: groundY - 100, w: 30, h: 100, targetSpeed: 7.5, toMode: "CUBE" });
            obstacles.push({ x: 6200, type: "triple-spike" });
            obstacles.push({ x: 7000, type: "spike" });
        }
    }
];

// Pogas izvēlnēm
const buttons = {
    play: { x: 350, y: 220, w: 200, h: 60, text: "START" },
    prev: { x: 100, y: 220, w: 80, h: 60, text: "<" },
    next: { x: 720, y: 220, w: 80, h: 60, text: ">" },
    select: { x: 325, y: 320, w: 250, h: 50, text: "SPĒLĒT" },
    back: { x: 30, y: 30, w: 100, h: 40, text: "ATPAKAĻ" },
    pauseBtn: { x: 840, y: 10, w: 40, h: 40, text: "II" },
    resume: { x: 350, y: 160, w: 200, h: 50, text: "TURPINĀT" },
    restart: { x: 350, y: 230, w: 200, h: 50, text: "RESTARTĒT" },
    exit: { x: 350, y: 300, w: 200, h: 50, text: "UZ MENU" }
};

// Spēlētājs (Pepe)
const player = {
    x: 150, y: groundY - 40, width: 40, height: 40, velocity: 0,
    gravity: 0.7, shipGravity: 0.35, jumpForce: -12.5, shipFlyForce: -0.85, grounded: false, rotation: 0,

    update() {
        if (gameMode === "CUBE") {
            this.velocity += this.gravity; this.y += this.velocity;
            if (this.y + this.height >= groundY) {
                this.y = groundY - this.height; this.velocity = 0; this.grounded = true;
                this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
            } else { this.rotation += 0.01 * currentSpeed; this.grounded = false; } // rotācijas ātrums atkarīgs no kustības
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

// Ievades kontrole
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;

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
});
canvas.addEventListener("mouseup", () => { inputPressed = false; });

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
    player.y = groundY - player.height; player.velocity = 0; player.rotation = 0; particles = [];
    
    obstacles = []; pads = []; coins = []; speedPortals = [];
    currentLevel.setup(); // Ielādē līmeņa unikālos objektus
}

function update() {
    if (gameState !== "PLAYING" || isGameOver || isVictory) return;

    frameCount++;
    distanceTraveled += currentSpeed;
    player.update();

    let progress = Math.min(100, Math.floor((distanceTraveled / currentLevel.length) * 100));
    document.getElementById("scoreText").innerText = `PROGRESS: ${progress}% | 🟡:${levelCoinsCollected}/2`;
    let savedHighScore = localStorage.getItem(`pepeLevel_${currentLevelIndex}`) || 0;
    document.getElementById("highScoreText").innerText = `BEST: ${savedHighScore}%`;

    if (distanceTraveled >= currentLevel.length) {
        isVictory = true;
        localStorage.setItem(`pepeLevel_${currentLevelIndex}`, 100);
        return;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x -= currentSpeed - 2; particles[i].alpha -= 0.04;
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // 1. Tramplīnu (Jump Pads) loģika
    for (let p of pads) {
        p.x -= currentSpeed;
        // Sadursme ar apli (Pepe uzkāpj uz tā)
        if (player.x + player.width > p.x - p.radius && player.x < p.x + p.radius && player.y + player.height >= p.y - 10 && player.y < p.y) {
            player.velocity = player.jumpForce * 1.3; // Uzmet augstāk par parastu lēcienu!
            player.grounded = false;
        }
    }

    // 2. Monētu (Coins) vākšana
    for (let i = coins.length - 1; i >= 0; i--) {
        let c = coins[i];
        c.x -= currentSpeed;
        if (player.x < c.x + 20 && player.x + player.width > c.x && player.y < c.y + 20 && player.y + player.height > c.y) {
            levelCoinsCollected++;
            coins.splice(i, 1);
        }
    }

    // 3. Ātruma / Režīmu portālu loģika
    for (let i = speedPortals.length - 1; i >= 0; i--) {
        let sp = speedPortals[i];
        sp.x -= currentSpeed;
        if (player.x + player.width > sp.x && player.x < sp.x + sp.w && player.y + player.height > sp.y && player.y < sp.y + sp.h) {
            currentSpeed = sp.targetSpeed;
            gameMode = sp.toMode;
            speedPortals.splice(i, 1);
        }
    }

    // 4. Šķēršļu un sadursmju apstrāde
    for (let o of obstacles) {
        o.x -= currentSpeed;
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

        // Grid līnijas slīd atkarībā no mainīgā ātruma
        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        let offset = (distanceTraveled) % 40;
        for (let x = -offset; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke(); }

        for (let p of particles) { ctx.fillStyle = `rgba(78, 240, 93, ${p.alpha})`; ctx.fillRect(p.x, p.y, p.size, p.size); }

        // Zīmē Tramplīnus (Jump Pads) - dzelteni apļi
        for (let p of pads) {
            ctx.fillStyle = "#ffcc00"; ctx.beginPath(); ctx.arc(p.x, p.y - 4, p.radius, 0, Math.PI, true); ctx.fill();
        }

        // Zīmē Monētas - zelta apļi
        for (let c of coins) {
            ctx.fillStyle = "#ffd700"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(c.x + 10, c.y + 10, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        // Zīmē Ātruma/Režīma mainīgos portālus
        for (let sp of speedPortals) {
            ctx.fillStyle = "#ff00ff"; ctx.shadowBlur = 15; ctx.shadowColor = "#ff00ff";
            ctx.fillRect(sp.x, sp.y, sp.w, sp.h); ctx.shadowBlur = 0;
        }

        // Šķēršļu zīmēšana
        ctx.fillStyle = "#ff0055";
        for (let o of obstacles) {
            if (o.type === "spike") {
                ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.width / 2, o.y - o.height); ctx.lineTo(o.x + o.width, o.y); ctx.closePath(); ctx.fill();
            } else if (o.type === "double-spike" || o.type === "triple-spike") {
                let count = o.type === "double-spike" ? 2 : 3; let w = o.width / count;
                for(let j=0; j<count; j++) {
                    let sx = o.x + (j*w);
                    ctx.beginPath(); ctx.moveTo(sx, o.y); ctx.lineTo(sx + w / 2, o.y - o.height); ctx.lineTo(sx + w, o.y); ctx.closePath(); ctx.fill();
                }
            } else if (o.type === "air-spike") {
                ctx.fillStyle = "#ffcc00"; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.width / 2, o.y - o.height); ctx.lineTo(o.x + o.width, o.y); ctx.closePath(); ctx.fill();
            } else if (o.type === "block") {
                ctx.fillStyle = "#3a3a3a"; ctx.fillRect(o.x, o.y, o.width, o.height); ctx.strokeStyle = "#5a5a5a"; ctx.strokeRect(o.x, o.y, o.width, o.height);
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
            ctx.fillText("SPĒLE BEIGUSIES", canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = "#fff"; ctx.font = "18px Arial"; ctx.fillText("Klikšķini lai restartētu", canvas.width / 2, canvas.height / 2 + 40);
            ctx.textAlign = "start";
        }
        if (isVictory) {
            ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#33ff33"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center";
            ctx.fillText("LĪMENIS PABEIGTS!", canvas.width / 2, canvas.height / 2);
            ctx.textAlign = "start";
        }
        if (gameState === "PAUSED") {
            ctx.fillStyle = "rgba(10, 5, 25, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#00ffff"; ctx.font = "bold 36px Arial"; ctx.textAlign = "center"; ctx.fillText("PAUZE", canvas.width / 2, 100); ctx.textAlign = "start";
            drawButton(buttons.resume, "#33ff33"); drawButton(buttons.restart, "#ffcc00"); drawButton(buttons.exit, "#ff3333");
        }
    }
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
gameLoop();
