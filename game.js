const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statsBar = document.getElementById("statsBar");

// Spēles stāvokļi: "MENU", "LEVEL_SELECT", "PLAYING"
let gameState = "MENU"; 
const groundY = 370;
let gameSpeed = 7;
let currentLevel = null;
let currentLevelIndex = 0;
let distanceTraveled = 0;
let isGameOver = false;
let isVictory = false;
let gameMode = "CUBE"; // "CUBE" vai "SHIP"
let inputPressed = false;

let obstacles = [];
let portals = [];
let particles = [];
let frameCount = 0;

// LĪMEŅU DATI (Precīzi definēti dzeloņi un portāli pēc X koordinātām)
const levels = [
    {
        name: "1. STEREO MADNESS",
        difficulty: "Easy",
        bgColor: "#0f051d",
        floorColor: "#00ffff",
        length: 2000, // Līmeņa garums pikseļos
        mode: "CUBE",
        // Šķēršļu izvietojums (x: kur tas parādās kartē)
        obstacles: [
            { x: 600, type: "spike" },
            { x: 900, type: "spike" },
            { x: 1200, type: "double-spike" },
            { x: 1500, type: "spike" },
            { x: 1700, type: "spike" }
        ],
        portals: []
    },
    {
        name: "2. BACK ON TRACK",
        difficulty: "Normal",
        bgColor: "#111a2e",
        floorColor: "#e600ff",
        length: 2500,
        mode: "CUBE",
        obstacles: [
            { x: 500, type: "spike" },
            { x: 800, type: "double-spike" },
            { x: 1100, type: "spike" },
            { x: 1350, type: "block", y: groundY - 40, w: 40, h: 40 }, // jālēc uz bloka
            { x: 1390, type: "spike", y: groundY }, // dzelonis uzreiz aiz bloka
            { x: 1700, type: "double-spike" },
            { x: 2000, type: "spike" }
        ],
        portals: []
    },
    {
        name: "3. SHIP MAYHEM",
        difficulty: "Hard",
        bgColor: "#2a0511",
        floorColor: "#ff3300",
        length: 2800,
        mode: "SHIP", // Šis līmenis sākas uzreiz kuģīša režīmā
        obstacles: [
            { x: 500, type: "block", y: 40, w: 50, h: 100 },      // Griestu šķērslis
            { x: 800, type: "block", y: groundY - 100, w: 50, h: 100 }, // Grīdas šķērslis
            { x: 1100, type: "block", y: 150, w: 40, h: 100 },    // Vidus šķērslis
            { x: 1400, type: "block", y: 40, w: 60, h: 120 },
            { x: 1700, type: "block", y: groundY - 120, w: 60, h: 120 },
            { x: 2100, type: "block", y: 130, w: 50, h: 140 },
            { x: 2400, type: "spike", y: groundY }
        ],
        portals: []
    }
];

// Pogas izvēlnēm (X, Y, Platums, Augstums)
const buttons = {
    play: { x: 350, y: 220, w: 200, h: 60, text: "START" },
    prev: { x: 100, y: 220, w: 80, h: 60, text: "<" },
    next: { x: 720, y: 220, w: 80, h: 60, text: ">" },
    select: { x: 325, y: 320, w: 250, h: 50, text: "SPĒLĒT LĪMENI" },
    back: { x: 30, y: 30, w: 100, h: 40, text: "ATPAKAĻ" }
};

// Spēlētājs (Pepe)
const player = {
    x: 150,
    y: groundY - 40,
    width: 40,
    height: 40,
    velocity: 0,
    gravity: 0.7,
    shipGravity: 0.35,
    jumpForce: -12,
    shipFlyForce: -0.8,
    grounded: false,
    rotation: 0,

    update() {
        if (gameMode === "CUBE") {
            this.velocity += this.gravity;
            this.y += this.velocity;
            if (this.y + this.height >= groundY) {
                this.y = groundY - this.height;
                this.velocity = 0;
                this.grounded = true;
                this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
            } else {
                this.rotation += 0.09;
                this.grounded = false;
            }
        } else if (gameMode === "SHIP") {
            if (inputPressed) this.velocity += this.shipFlyForce;
            else this.velocity += this.shipGravity;
            
            this.velocity = Math.max(-6, Math.min(6, this.velocity));
            this.y += this.velocity;

            if (this.y + this.height >= groundY) { this.y = groundY - this.height; this.velocity = 0; }
            if (this.y <= 40) { this.y = 40; this.velocity = 0; }
            this.rotation = this.velocity * 0.05;
        }

        if (frameCount % 2 === 0) {
            particles.push({ x: this.x, y: this.y + this.height / 2, size: Math.random() * 6 + 4, alpha: 1 });
        }
    },

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.fillStyle = "#fff";
        ctx.fillRect(-12, -12, 10, 10); ctx.fillRect(2, -12, 10, 10);
        ctx.fillStyle = "#000";
        ctx.fillRect(-8, -9, 4, 4); ctx.fillRect(6, -9, 4, 4);
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(-10, 4, 20, 4);

        ctx.restore();
    }
};

// Klikšķu apstrāde izvēlnēs un spēlē
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (gameState === "MENU") {
        if (checkClick(mouseX, mouseY, buttons.play)) {
            gameState = "LEVEL_SELECT";
        }
    } 
    else if (gameState === "LEVEL_SELECT") {
        if (checkClick(mouseX, mouseY, buttons.prev)) {
            currentLevelIndex = (currentLevelIndex - 1 + levels.length) % levels.length;
        }
        else if (checkClick(mouseX, mouseY, buttons.next)) {
            currentLevelIndex = (currentLevelIndex + 1) % levels.length;
        }
        else if (checkClick(mouseX, mouseY, buttons.select)) {
            startLevel(currentLevelIndex);
        }
        else if (checkClick(mouseX, mouseY, buttons.back)) {
            gameState = "MENU";
        }
    } 
    else if (gameState === "PLAYING") {
        inputPressed = true;
        if (isGameOver || isVictory) {
            resetLevel();
        } else if (gameMode === "CUBE" && player.grounded) {
            player.velocity = player.jumpForce;
            player.grounded = false;
        }
    }
});

canvas.addEventListener("mouseup", () => { inputPressed = false; });

// Klavatūras atbalsts spēlei
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
        inputPressed = true;
        if (gameState === "PLAYING") {
            if (isGameOver || isVictory) resetLevel();
            else if (gameMode === "CUBE" && player.grounded) {
                player.velocity = player.jumpForce;
                player.grounded = false;
            }
        }
    }
});
window.addEventListener("keyup", (e) => { if (e.code === "Space" || e.code === "ArrowUp") inputPressed = false; });

function checkClick(mx, my, btn) {
    return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
}

// Līmeņa palaišana
function startLevel(index) {
    gameState = "PLAYING";
    statsBar.style.display = "flex";
    currentLevel = JSON.parse(JSON.stringify(levels[index])); // dziļā kopija līmeņa datiem
    document.getElementById("levelNameText").innerText = currentLevel.name;
    resetLevel();
}

function resetLevel() {
    distanceTraveled = 0;
    frameCount = 0;
    isGameOver = false;
    isVictory = false;
    gameMode = currentLevel.mode;
    player.y = groundY - player.height;
    player.velocity = 0;
    player.rotation = 0;
    particles = [];
    
    // Sagatavo šķēršļus no līmeņa datiem
    obstacles = currentLevel.obstacles.map(o => ({
        x: o.x,
        y: o.y || groundY,
        width: o.w || 30,
        height: o.h || 35,
        type: o.type
    }));
}

// Spēles matemātika (Update)
function update() {
    if (gameState !== "PLAYING" || isGameOver || isVictory) return;

    frameCount++;
    distanceTraveled += gameSpeed;
    
    player.update();

    // Progresa aprēķins procentos
    let progress = Math.min(100, Math.floor((distanceTraveled / currentLevel.length) * 100));
    document.getElementById("scoreText").innerText = `PROGRESS: ${progress}%`;
    
    let savedHighScore = localStorage.getItem(`pepeLevel_${currentLevelIndex}`) || 0;
    document.getElementById("highScoreText").innerText = `BEST: ${savedHighScore}%`;

    // Uzvaras pārbaude (ja sasniegts līmeņa gals)
    if (distanceTraveled >= currentLevel.length) {
        isVictory = true;
        localStorage.setItem(`pepeLevel_${currentLevelIndex}`, 100);
        return;
    }

    // Astes daļiņas
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x -= gameSpeed - 2;
        particles[i].alpha -= 0.04;
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // Šķēršļu pārbaude un virzība
    for (let o of obstacles) {
        o.x -= gameSpeed;

        // Sadursmes modelis (Hitbox)
        let hitX = player.x + 4 < o.x + o.width && player.x + player.width - 4 > o.x;
        let hitY = false;

        if (o.type === "spike" || o.type === "double-spike") {
            hitY = player.y + player.height > o.y - o.height && player.y + 4 < o.y;
        } else if (o.type === "block") {
            hitY = player.y < o.y + o.height && player.y + player.height > o.y;
        }

        if (hitX && hitY) {
            isGameOver = true;
            if (progress > savedHighScore) {
                localStorage.setItem(`pepeLevel_${currentLevelIndex}`, progress);
            }
        }
    }
}

// Pogas vizuālais zīmējums
function drawButton(btn, color = "#00ffff") {
    ctx.fillStyle = "#111";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
    ctx.textAlign = "start";
}

// Vizuālā renderēšana (Draw)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "MENU") {
        statsBar.style.display = "none";
        // Izvēlnes fons
        ctx.fillStyle = "#090414";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#4CAF50";
        ctx.font = "bold 50px Arial";
        ctx.fillText("PEPE DASH", 310, 140);

        drawButton(buttons.play, "#4CAF50");
    } 
    
    else if (gameState === "LEVEL_SELECT") {
        ctx.fillStyle = "#070c1f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 28px Arial";
        ctx.fillText("IZVĒLIES LĪMENI", 330, 100);

        // Pašreizējā līmeņa info logs
        let lvl = levels[currentLevelIndex];
        ctx.fillStyle = "#111a3a";
        ctx.fillRect(250, 150, 400, 140);
        ctx.strokeStyle = "#00ffff";
        ctx.strokeRect(250, 150, 400, 140);

        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.fillText(lvl.name, 280, 190);
        
        ctx.fillStyle = lvl.difficulty === "Hard" ? "#ff3333" : (lvl.difficulty === "Normal" ? "#ffcc00" : "#33ff33");
        ctx.font = "16px Arial";
        ctx.fillText(`Grūtība: ${lvl.difficulty}`, 280, 225);

        let savedScore = localStorage.getItem(`pepeLevel_${currentLevelIndex}`) || 0;
        ctx.fillStyle = "#00ffff";
        ctx.fillText(`Labākais rezultāts: ${savedScore}%`, 280, 260);

        // Zīmē navigācijas pogas
        drawButton(buttons.prev);
        drawButton(buttons.next);
        drawButton(buttons.select, "#4CAF50");
        drawButton(buttons.back, "#ff3333");
    } 
    
    else if (gameState === "PLAYING") {
        // Fonā izmanto līmeņa unikālo krāsu
        ctx.fillStyle = currentLevel.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid (Koordinātu tīkls)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        let offset = (distanceTraveled) % 40;
        for (let x = -offset; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke();
        }

        // Astes daļiņas
        for (let p of particles) {
            ctx.fillStyle = `rgba(78, 240, 93, ${p.alpha})`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }

        // Šķēršļu zīmēšana
        ctx.fillStyle = "#ff0055";
        for (let o of obstacles) {
            if (o.type === "spike") {
                ctx.beginPath();
                ctx.moveTo(o.x, o.y);
                ctx.lineTo(o.x + o.width / 2, o.y - o.height);
                ctx.lineTo(o.x + o.width, o.y);
                ctx.closePath();
                ctx.fill();
            } else if (o.type === "double-spike") {
                let half = o.width / 2;
                for(let j=0; j<2; j++) {
                    let sx = o.x + (j*half);
                    ctx.beginPath();
                    ctx.moveTo(sx, o.y);
                    ctx.lineTo(sx + half / 2, o.y - o.height);
                    ctx.lineTo(sx + half, o.y);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (o.type === "block") {
                ctx.fillStyle = "#444";
                ctx.fillRect(o.x, o.y, o.width, o.height);
                ctx.strokeStyle = "#666";
                ctx.strokeRect(o.x, o.y, o.width, o.height);
                ctx.fillStyle = "#ff0055"; // atgriež krāsu dzeloņiem
            }
        }

        // Spēlētājs
        player.draw();

        // Zeme un griesti
        ctx.fillStyle = "#000";
        ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
        ctx.fillRect(0, 0, canvas.width, 40);

        ctx.strokeStyle = currentLevel.floorColor;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(canvas.width, 40); ctx.stroke();

        // Game Over ekrāns
        if (isGameOver) {
            ctx.fillStyle = "rgba(0,0,0,0.85)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ff2a6d";
            ctx.font = "bold 36px Arial";
            ctx.textAlign = "center";
            ctx.fillText("SPĒLE BEIGUSIES", canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = "#fff";
            ctx.font = "18px Arial";
            ctx.fillText("Klikšķini vai spied Space, lai mēģinātu vēlreiz", canvas.width / 2, canvas.height / 2 + 40);
            ctx.textAlign = "start";
        }

        // Uzvaras (Victory) ekrāns
        if (isVictory) {
            ctx.fillStyle = "rgba(0,0,0,0.85)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#33ff33";
            ctx.font = "bold 40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("LĪMENIS PABEIGTS! 100%", canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = "#fff";
            ctx.font = "18px Arial";
            ctx.fillText("Klikšķini, lai atgrieztos izvēlnē", canvas.width / 2, canvas.height / 2 + 50);
            ctx.textAlign = "start";
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
