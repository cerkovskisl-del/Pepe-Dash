const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statsBar = document.getElementById("statsBar");
const rotateWarning = document.getElementById("rotateWarning");

let gameState = "MENU"; 
const groundY = 370;
let currentLevel = null;
let currentLevelIndex = 0; // 0-5 for Levels, 6 for Infinity Mode
let distanceTraveled = 0;
let isGameOver = false;
let isVictory = false;
let gameMode = "CUBE"; 
let inputPressed = false;

let lastTime = 0;
let currentSpeed = 400; 
let levelCoinsCollected = 0; 

// Infinity Mode specific tracking variables
let infinityHighScore = parseInt(localStorage.getItem("pepeInfinityBest")) || 0;
let nextInfinityObstacleX = 600; 

// Coin economy
let totalCoins = parseInt(localStorage.getItem("pepeTotalCoins")) || 0;

// Skin system
let currentSkin = localStorage.getItem("pepeSelectedSkin") || "DEFAULT";
let unlockedSkins = JSON.parse(localStorage.getItem("pepeUnlockedSkins")) || ["DEFAULT"];

const skins = {
    DEFAULT: { color: "#4CAF50", eyeColor: "#000", name: "Classic", price: 0 },
    RED_DEMON: { color: "#ff2a6d", eyeColor: "#fff", name: "Red Demon", price: 3 },
    GOLD_KING: { color: "#ffd700", eyeColor: "#ff00ff", name: "Gold King", price: 7 },
    CYBER_BLUE: { color: "#00f0ff", eyeColor: "#fff", name: "Cyber Blue", price: 12 }
};

let obstacles = [];
let pads = [];
let coins = [];
let particles = [];
let frameCount = 0;
let particleTimer = 0;

// Orientation check
function checkOrientation() {
    if (window.innerHeight > window.innerWidth) {
        rotateWarning.style.display = "flex"; 
    } else {
        rotateWarning.style.display = "none"; 
    }
}

function tryLockOrientation() {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch((err) => {});
    }
}

window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);
checkOrientation();

// 6 Structured Levels + Metadata for Infinity Mode
const levels = [
    {
        name: "1. STEREO MADNESS", difficulty: "Easy", bgColor: "#0f051d", floorColor: "#00ffff", length: 3500, mode: "CUBE", baseSpeed: 350,
        setup: function() {
            obstacles.push({ x: 600, type: "spike", width: 30, height: 40 });
            obstacles.push({ x: 1000, type: "block", y: groundY - 40, width: 80, height: 40 });
            obstacles.push({ x: 1400, type: "spike", width: 30, height: 40 });
            coins.push({ x: 1040, y: groundY - 90 }); 
            pads.push({ x: 1800, y: groundY, radius: 15 });
            obstacles.push({ x: 2000, type: "double-spike", width: 60, height: 40 });
            obstacles.push({ x: 2400, type: "block", y: groundY - 40, width: 40, height: 40 });
            obstacles.push({ x: 2440, type: "block", y: groundY - 80, width: 40, height: 40 });
            coins.push({ x: 2440, y: groundY - 140 });
            obstacles.push({ x: 2900, type: "spike", width: 30, height: 40 });
            obstacles.push({ x: 3100, type: "block", y: groundY - 40, width: 120, height: 40 });
        }
    },
    {
        name: "2. TRAMPOLINE VALLEY", difficulty: "Normal", bgColor: "#05262b", floorColor: "#00ffcc", length: 3800, mode: "CUBE", baseSpeed: 380,
        setup: function() {
            pads.push({ x: 600, y: groundY, radius: 15 });
            obstacles.push({ x: 800, type: "spike", width: 30, height: 40 });
            obstacles.push({ x: 1300, type: "block", y: groundY - 40, width: 120, height: 40 });
            pads.push({ x: 1360, y: groundY - 40, radius: 15 });
            coins.push({ x: 1360, y: groundY - 120 });
            obstacles.push({ x: 1900, type: "double-spike", width: 60, height: 40 });
            pads.push({ x: 2300, y: groundY, radius: 15 });
            obstacles.push({ x: 2700, type: "block", y: groundY - 60, width: 80, height: 60 });
            coins.push({ x: 2720, y: groundY - 120 });
            obstacles.push({ x: 3100, type: "spike", width: 30, height: 40 });
            pads.push({ x: 3300, y: groundY, radius: 15 });
            obstacles.push({ x: 3450, type: "double-spike", width: 60, height: 40 });
        }
    },
    {
        name: "3. SHIP FLIGHT", difficulty: "Hard", bgColor: "#26052b", floorColor: "#ff00ff", length: 4200, mode: "SHIP", baseSpeed: 380,
        setup: function() {
            obstacles.push({ x: 700, type: "block", y: 40, width: 60, height: 140 });
            obstacles.push({ x: 1100, type: "block", y: groundY - 140, width: 60, height: 140 });
            coins.push({ x: 900, y: 200 });
            obstacles.push({ x: 1600, type: "block", y: 40, width: 80, height: 180 });
            obstacles.push({ x: 2100, type: "block", y: groundY - 180, width: 80, height: 180 });
            coins.push({ x: 1850, y: 250 });
            obstacles.push({ x: 2600, type: "block", y: 120, width: 50, height: 120 });
            obstacles.push({ x: 3100, type: "block", y: 40, width: 60, height: 140 });
            obstacles.push({ x: 3500, type: "block", y: groundY - 140, width: 60, height: 140 });
            obstacles.push({ x: 3800, type: "block", y: 40, width: 40, height: 120 });
            obstacles.push({ x: 3800, type: "block", y: groundY - 120, width: 40, height: 120 });
            coins.push({ x: 3810, y: 200 });
        }
    },
    {
        name: "4. JUMP MACHINE", difficulty: "Hard", bgColor: "#3d1111", floorColor: "#ff3333", length: 4000, mode: "CUBE", baseSpeed: 410,
        setup: function() {
            obstacles.push({ x: 500, type: "spike", width: 30, height: 40 });
            obstacles.push({ x: 800, type: "double-spike", width: 60, height: 40 });
            obstacles.push({ x: 1200, type: "block", y: groundY - 40, width: 40, height: 40 });
            obstacles.push({ x: 1240, type: "spike", width: 30, height: 40 });
            pads.push({ x: 1600, y: groundY, radius: 15 });
            obstacles.push({ x: 1900, type: "block", y: groundY - 80, width: 120, height: 20 });
            coins.push({ x: 1950, y: groundY - 130 });
            obstacles.push({ x: 2300, type: "spike", width: 30, height: 40 });
            pads.push({ x: 2600, y: groundY, radius: 15 });
            obstacles.push({ x: 2900, type: "double-spike", width: 60, height: 40 });
            obstacles.push({ x: 3300, type: "block", y: groundY - 40, width: 80, height: 40 });
            obstacles.push({ x: 3340, type: "spike", width: 30, height: 40 });
            coins.push({ x: 3350, y: groundY - 90 });
        }
    },
    {
        name: "5. COSMIC TUNNEL", difficulty: "Insane", bgColor: "#02162e", floorColor: "#0088ff", length: 4600, mode: "SHIP", baseSpeed: 430,
        setup: function() {
            // Tight alternating spaces for ship mode
            obstacles.push({ x: 600, type: "block", y: 40, width: 100, height: 200 });
            obstacles.push({ x: 1000, type: "block", y: groundY - 200, width: 100, height: 200 });
            coins.push({ x: 1300, y: 100 });
            obstacles.push({ x: 1500, type: "block", y: 40, width: 50, height: 120 });
            obstacles.push({ x: 1700, type: "block", y: groundY - 120, width: 50, height: 120 });
            obstacles.push({ x: 2000, type: "block", y: 130, width: 200, height: 80 });
            coins.push({ x: 2100, y: 80 });
            coins.push({ x: 2100, y: 300 });
            obstacles.push({ x: 2500, type: "block", y: 40, width: 80, height: 220 });
            obstacles.push({ x: 2900, type: "block", y: groundY - 220, width: 80, height: 220 });
            obstacles.push({ x: 3400, type: "block", y: 100, width: 40, height: 140 });
            obstacles.push({ x: 3800, type: "block", y: 40, width: 120, height: 160 });
            obstacles.push({ x: 4100, type: "block", y: groundY - 160, width: 120, height: 160 });
        }
    },
    {
        name: "6. DEMONIC CLIMAX", difficulty: "Demon", bgColor: "#1a0202", floorColor: "#ff0000", length: 5000, mode: "CUBE", baseSpeed: 460,
        setup: function() {
            obstacles.push({ x: 500, type: "spike", width: 30, height: 40 });
            obstacles.push({ x: 800, type: "double-spike", width: 60, height: 40 });
            obstacles.push({ x: 1100, type: "block", y: groundY - 40, width: 40, height: 40 });
            obstacles.push({ x: 1300, type: "spike", width: 30, height: 40 });
            pads.push({ x: 1600, y: groundY, radius: 15 });
            obstacles.push({ x: 1800, type: "block", y: groundY - 80, width: 40, height: 80 });
            obstacles.push({ x: 2100, type: "double-spike", width: 60, height: 40 });
            coins.push({ x: 2130, y: groundY - 90 });
            obstacles.push({ x: 2500, type: "block", y: groundY - 40, width: 120, height: 40 });
            obstacles.push({ x: 2540, type: "spike", width: 30, height: 40 });
            pads.push({ x: 2900, y: groundY, radius: 15 });
            obstacles.push({ x: 3200, type: "block", y: groundY - 120, width: 40, height: 120 });
            obstacles.push({ x: 3600, type: "double-spike", width: 60, height: 40 });
            obstacles.push({ x: 4000, type: "block", y: groundY - 40, width: 80, height: 40 });
            obstacles.push({ x: 4040, type: "block", y: groundY - 80, width: 40, height: 40 });
            obstacles.push({ x: 4400, type: "spike", width: 30, height: 40 });
            coins.push({ x: 4400, y: groundY - 100 });
        }
    },
    {
        // Special placeholder entry inside the levels array to register Infinity Mode option inside Level Select loop
        name: "INFINITY ENDLESS", difficulty: "Variable", bgColor: "#1f1f1f", floorColor: "#ffffff", length: Infinity, mode: "DYNAMIC", baseSpeed: 360,
        setup: function() {
            nextInfinityObstacleX = 600;
            generateNextInfinityObstacle();
            generateNextInfinityObstacle();
            generateNextInfinityObstacle();
        }
    }
];

const buttons = {
    play: { x: 350, y: 180, w: 200, h: 50, text: "START" },
    shopBtn: { x: 350, y: 250, w: 200, h: 50, text: "SHOP" },
    
    prev: { x: 100, y: 220, w: 80, h: 60, text: "<" },
    next: { x: 720, y: 220, w: 80, h: 60, text: ">" },
    select: { x: 325, y: 320, w: 250, h: 50, text: "PLAY" },
    back: { x: 30, y: 30, w: 100, h: 40, text: "BACK" },
    
    pauseBtn: { x: 840, y: 10, w: 40, h: 40, text: "II" },
    resume: { x: 350, y: 160, w: 200, h: 50, text: "RESUME" },
    restart: { x: 350, y: 230, w: 200, h: 50, text: "RESTART" },
    exit: { x: 350, y: 300, w: 200, h: 50, text: "MENU" },

    shopItem1: { x: 150, y: 180, w: 140, h: 140, skinKey: "DEFAULT" },
    shopItem2: { x: 320, y: 180, w: 140, h: 140, skinKey: "RED_DEMON" },
    shopItem3: { x: 490, y: 180, w: 140, h: 140, skinKey: "GOLD_KING" },
    shopItem4: { x: 660, y: 180, w: 140, h: 140, skinKey: "CYBER_BLUE" }
};

const player = {
    x: 150, y: groundY - 40, width: 40, height: 40, velocity: 0,
    gravity: 42, shipGravity: 21, jumpForce: -730, shipFlyForce: -50, grounded: false, rotation: 0,

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
        
        let skin = skins[currentSkin];
        ctx.fillStyle = skin.color; ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.fillStyle = "#fff"; ctx.fillRect(-12, -12, 10, 10); ctx.fillRect(2, -12, 10, 10);
        ctx.fillStyle = skin.eyeColor; ctx.fillRect(-8, -9, 4, 4); ctx.fillRect(6, -9, 4, 4);
        
        ctx.fillStyle = "#000"; ctx.fillRect(-10, 6, 20, 3); ctx.restore();
    }
};

// PROCEDURAL RANDOM GENERATOR FOR ENDLESS MODE
function generateNextInfinityObstacle() {
    let roll = Math.random();
    let distanceGap = Math.random() * 250 + 300; // Keep elements cleanly separate

    if (gameMode === "CUBE") {
        if (roll < 0.35) {
            obstacles.push({ x: nextInfinityObstacleX, type: Math.random() > 0.4 ? "spike" : "double-spike", width: 30, height: 40 });
            if (Math.random() > 0.5) coins.push({ x: nextInfinityObstacleX, y: groundY - 100 });
        } else if (roll < 0.70) {
            let blockHeight = Math.random() > 0.5 ? 40 : 80;
            obstacles.push({ x: nextInfinityObstacleX, type: "block", y: groundY - blockHeight, width: 60, height: blockHeight });
            if (Math.random() > 0.5) coins.push({ x: nextInfinityObstacleX + 15, y: groundY - blockHeight - 50 });
        } else {
            pads.push({ x: nextInfinityObstacleX, y: groundY, radius: 15 });
            obstacles.push({ x: nextInfinityObstacleX + 180, type: "double-spike", width: 60, height: 40 });
        }
    } else {
        // SHIP MODE random walls
        let gapY = Math.random() * 120 + 100; // safe space corridor height
        let topWallHeight = Math.random() * 140 + 40;
        obstacles.push({ x: nextInfinityObstacleX, type: "block", y: 40, width: 60, height: topWallHeight });
        obstacles.push({ x: nextInfinityObstacleX, type: "block", y: 40 + topWallHeight + gapY, width: 60, height: groundY - (40 + topWallHeight + gapY) });
        if (Math.random() > 0.4) coins.push({ x: nextInfinityObstacleX + 15, y: 40 + topWallHeight + (gapY / 2) - 10 });
    }

    nextInfinityObstacleX += distanceGap;
}

function handleShopClick(key) {
    let skin = skins[key];
    if (unlockedSkins.includes(key)) {
        currentSkin = key;
        localStorage.setItem("pepeSelectedSkin", currentSkin);
    } else {
        if (totalCoins >= skin.price) {
            totalCoins -= skin.price;
            unlockedSkins.push(key);
            currentSkin = key;
            localStorage.setItem("pepeTotalCoins", totalCoins);
            localStorage.setItem("pepeUnlockedSkins", JSON.stringify(unlockedSkins));
            localStorage.setItem("pepeSelectedSkin", currentSkin);
        }
    }
}

function handlePress(clientX, clientY) {
    tryLockOrientation(); 
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    if (gameState === "MENU") {
        if (checkClick(mouseX, mouseY, buttons.play)) gameState = "LEVEL_SELECT";
        else if (checkClick(mouseX, mouseY, buttons.shopBtn)) gameState = "SHOP";
    } 
    else if (gameState === "SHOP") {
        if (checkClick(mouseX, mouseY, buttons.back)) gameState = "MENU";
        else if (checkClick(mouseX, mouseY, buttons.shopItem1)) handleShopClick("DEFAULT");
        else if (checkClick(mouseX, mouseY, buttons.shopItem2)) handleShopClick("RED_DEMON");
        else if (checkClick(mouseX, mouseY, buttons.shopItem3)) handleShopClick("GOLD_KING");
        else if (checkClick(mouseX, mouseY, buttons.shopItem4)) handleShopClick("CYBER_BLUE");
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

canvas.addEventListener("mousedown", (e) => { handlePress(e.clientX, e.clientY); });
canvas.addEventListener("mouseup", () => { inputPressed = false; });

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); 
    if (e.touches.length > 0) handlePress(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
canvas.addEventListener("touchend", (e) => { e.preventDefault(); inputPressed = false; }, { passive: false });

window.addEventListener("keydown", (e) => {
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
    
    if (currentLevel.length === Infinity) {
        gameMode = "CUBE"; // Start endless mode on foot
        currentSpeed = currentLevel.baseSpeed;
    } else {
        gameMode = currentLevel.mode; 
        currentSpeed = currentLevel.baseSpeed;
    }

    player.y = groundY - player.height; player.velocity = 0; player.rotation = 0; player.grounded = true; particles = [];
    obstacles = []; pads = []; coins = []; 
    currentLevel.setup(); 
    lastTime = performance.now();
}

function update(dt) {
    if (gameState !== "PLAYING" || isGameOver || isVictory) return;

    frameCount++;
    let moveAmount = currentSpeed * dt;
    distanceTraveled += moveAmount;
    let stoodOnSomething = false;

    // INFINITY ENDLESS PROCEDURAL DISPATCH SYSTEM
    if (currentLevel.length === Infinity) {
        // Slowly increment speed to elevate pressure over runtime distance
        currentSpeed = 360 + Math.floor(distanceTraveled / 150);
        
        // Alternate between plane navigation and standard physics modes dynamically every 2000 meters
        let desiredMode = Math.floor(distanceTraveled / 2000) % 2 === 0 ? "CUBE" : "SHIP";
        if (gameMode !== desiredMode) {
            gameMode = desiredMode;
            player.velocity = 0;
        }

        // Garbage collect off-screen array indices and regenerate oncoming objects
        if (obstacles.length > 0 && obstacles[0].x < -200) obstacles.shift();
        if (pads.length > 0 && pads[0].x < -200) pads.shift();
        if (coins.length > 0 && coins[0].x < -200) coins.shift();

        if (nextInfinityObstacleX - distanceTraveled < canvas.width + 300) {
            generateNextInfinityObstacle();
        }
    }

    // Collision checks loop
    for (let o of obstacles) {
        if (currentLevel.length === Infinity) {
            // Absolute screen offset mapping for endless mode components
            o.x = (o.x === undefined) ? nextInfinityObstacleX : o.x - moveAmount;
        } else {
            o.x -= moveAmount;
        }

        if (o.type === "block") {
            let hitX = player.x + 2 < o.x + o.width && player.x + player.width - 2 > o.x;
            let hitY = player.y < o.y + o.height && player.y + player.height > o.y;
            if (hitX && hitY) {
                let overlapY = (player.y + player.height) - o.y;
                if (overlapY <= (player.velocity * dt) + 4 && player.velocity >= 0 && gameMode === "CUBE") {
                    player.y = o.y - player.height; player.velocity = 0; player.grounded = true; stoodOnSomething = true;
                } else { isGameOver = true; }
            }
        } else {
            let hitX = player.x + 6 < o.x + o.width && player.x + player.width - 6 > o.x;
            let hitY = player.y + player.height > groundY - o.height && player.y < groundY;
            if (hitX && hitY) isGameOver = true;
        }
    }

    if (player.y + player.height >= groundY) { stoodOnSomething = true; player.grounded = true; }
    if (!stoodOnSomething && gameMode === "CUBE") player.grounded = false;

    player.update(dt);

    // Scoreboard metrics UI update statements
    if (currentLevel.length === Infinity) {
        let displayDist = Math.floor(distanceTraveled);
        document.getElementById("scoreText").innerText = `SCORE: ${displayDist}m | 🟡 COINS: ${levelCoinsCollected}`;
        document.getElementById("highScoreText").innerText = `BEST: ${infinityHighScore}m`;
        
        if (isGameOver && displayDist > infinityHighScore) {
            infinityHighScore = displayDist;
            localStorage.setItem("pepeInfinityBest", infinityHighScore);
        }
    } else {
        let progress = Math.min(100, Math.floor((distanceTraveled / currentLevel.length) * 100));
        document.getElementById("scoreText").innerText = `PROGRESS: ${progress}% | 🟡 IN LEVEL: ${levelCoinsCollected}`;
        let savedHighScore = localStorage.getItem(`pepeLevel_${currentLevelIndex}`) || 0;
        document.getElementById("highScoreText").innerText = `BEST: ${savedHighScore}%`;

        if (isGameOver && progress > savedHighScore) localStorage.setItem(`pepeLevel_${currentLevelIndex}`, progress);

        if (distanceTraveled >= currentLevel.length) {
            isVictory = true;
            totalCoins += levelCoinsCollected; 
            localStorage.setItem("pepeTotalCoins", totalCoins);
            localStorage.setItem(`pepeLevel_${currentLevelIndex}`, 100);
            return;
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x -= (currentSpeed - 100) * dt; particles[i].alpha -= 2.0 * dt;
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    for (let p of pads) {
        p.x -= moveAmount;
        if (player.x + player.width > p.x - p.radius && player.x < p.x + p.radius && player.y + player.height >= p.y - 12 && player.y < p.y) {
            player.velocity = player.jumpForce * 1.15; player.grounded = false;
        }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
        let c = coins[i]; c.x -= moveAmount;
        if (player.x < c.x + 20 && player.x + player.width > c.x && player.y < c.y + 20 && player.y + player.height > c.y) {
            levelCoinsCollected++; 
            if(currentLevel.length === Infinity) {
                totalCoins++; // Endless gives bankable coins on the fly
                localStorage.setItem("pepeTotalCoins", totalCoins);
            }
            coins.splice(i, 1);
        }
    }
}

function drawButton(btn, color = "#00ffff") {
    ctx.fillStyle = "#111"; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h); ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial"; ctx.textAlign = "center";
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6); ctx.textAlign = "start";
}

function drawShopItem(btn, skinKey) {
    let skin = skins[skinKey];
    let isUnlocked = unlockedSkins.includes(skinKey);
    let isSelected = currentSkin === skinKey;

    ctx.fillStyle = "#151525"; ctx.strokeStyle = isSelected ? "#33ff33" : (isUnlocked ? "#00ffff" : "#555");
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h); ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.fillStyle = skin.color; ctx.fillRect(btn.x + 50, btn.y + 30, 40, 40);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(btn.x + 50, btn.y + 30, 40, 40);

    ctx.fillStyle = "#fff"; ctx.font = "14px Arial"; ctx.textAlign = "center";
    ctx.fillText(skin.name, btn.x + btn.w / 2, btn.y + 95);

    if (isSelected) {
        ctx.fillStyle = "#33ff33"; ctx.fillText("EQUIPPED", btn.x + btn.w / 2, btn.y + 120);
    } else if (isUnlocked) {
        ctx.fillStyle = "#00ffff"; ctx.fillText("SELECT", btn.x + btn.w / 2, btn.y + 120);
    } else {
        ctx.fillStyle = "#ffd700"; ctx.fillText(`🟡 ${skin.price}`, btn.x + btn.w / 2, btn.y + 120);
    }
    ctx.textAlign = "start";
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "MENU") {
        statsBar.style.display = "none";
        ctx.fillStyle = "#090414"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#4CAF50"; ctx.font = "bold 50px Arial"; ctx.fillText("PEPE DASH", 310, 110);
        
        ctx.fillStyle = "#ffd700"; ctx.font = "18px Arial"; ctx.fillText(`TOTAL COINS: 🟡 ${totalCoins}`, 350, 150);

        drawButton(buttons.play, "#4CAF50");
        drawButton(buttons.shopBtn, "#ffd700");
    } 
    else if (gameState === "SHOP") {
        ctx.fillStyle = "#090414"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff"; ctx.font = "bold 30px Arial"; ctx.fillText("SKIN SHOP", 380, 70);
        ctx.fillStyle = "#ffd700"; ctx.font = "20px Arial"; ctx.fillText(`Your balance: 🟡 ${totalCoins}`, 360, 110);
        ctx.fillStyle = "#888"; ctx.font = "14px Arial"; ctx.fillText("(Coins are saved when you successfully finish a level!)", 280, 140);

        drawShopItem(buttons.shopItem1, "DEFAULT");
        drawShopItem(buttons.shopItem2, "RED_DEMON");
        drawShopItem(buttons.shopItem3, "GOLD_KING");
        drawShopItem(buttons.shopItem4, "CYBER_BLUE");

        drawButton(buttons.back, "#ff3333");
    }
    else if (gameState === "LEVEL_SELECT") {
        statsBar.style.display = "none";
        ctx.fillStyle = "#070c1f"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff"; ctx.font = "bold 28px Arial"; ctx.fillText("SELECT LEVEL / MODE", 310, 100);

        let lvl = levels[currentLevelIndex];
        ctx.fillStyle = "#111a3a"; ctx.fillRect(250, 140, 400, 150);
        ctx.strokeStyle = "#00ffff"; ctx.strokeRect(250, 140, 400, 150);

        ctx.fillStyle = "#fff"; ctx.font = "18px Arial"; ctx.fillText(lvl.name, 270, 180);
        ctx.fillStyle = lvl.difficulty === "Demon" || lvl.difficulty === "Insane" ? "#ff3333" : (lvl.difficulty === "Normal" || lvl.difficulty === "Hard" ? "#ffcc00" : "#33ff33");
        ctx.fillText(`Difficulty: ${lvl.difficulty}`, 270, 215);
        
        if (lvl.length === Infinity) {
            ctx.fillStyle = "#ffd700"; ctx.fillText(`Best Score: ${infinityHighScore}m`, 270, 250);
        } else {
            let savedScore = localStorage.getItem(`pepeLevel_${currentLevelIndex}`) || 0;
            ctx.fillStyle = "#00ffff"; ctx.fillText(`Best attempt: ${savedScore}%`, 270, 250);
        }

        drawButton(buttons.prev); drawButton(buttons.next); drawButton(buttons.select, "#4CAF50"); drawButton(buttons.back, "#ff3333");
    } 
    else if (gameState === "PLAYING" || gameState === "PAUSED") {
        ctx.fillStyle = currentLevel.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        let offset = (distanceTraveled) % 40;
        for (let x = -offset; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke(); }

        for (let p of particles) { ctx.fillStyle = `rgba(78, 240, 93, ${p.alpha})`; ctx.fillRect(p.x, p.y, p.size, p.size); }

        // --- DRAW FINISH LINE STRUCTURE (ONLY RENDER IF NOT IN ENDLESS MODE) ---
        if (currentLevel.length !== Infinity) {
            let finishLineX = (currentLevel.length - distanceTraveled) + player.x;
            if (finishLineX < canvas.width + 100) {
                ctx.fillStyle = "#fff"; ctx.fillRect(finishLineX, 40, 30, groundY - 40); 
                ctx.fillStyle = "#000";
                for (let yOffset = 40; yOffset < groundY; yOffset += 20) {
                    ctx.fillRect(finishLineX, yOffset, 15, 10);
                    ctx.fillRect(finishLineX + 15, yOffset + 10, 15, 10);
                }
                ctx.strokeStyle = "#33ff33"; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(finishLineX, 40); ctx.lineTo(finishLineX, groundY); ctx.stroke();
            }
        }

        for (let p of pads) {
            ctx.fillStyle = "#ffcc00"; ctx.beginPath(); ctx.arc(p.x, p.y - 2, p.radius, 0, Math.PI, true); ctx.fill();
        }

        for (let c of coins) {
            ctx.fillStyle = "#ffd700"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(c.x + 10, c.y + 10, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        for (let o of obstacles) {
            if (o.type === "spike") {
                ctx.fillStyle = "#ff0055"; ctx.beginPath(); ctx.moveTo(o.x, groundY); ctx.lineTo(o.x + o.width / 2, groundY - o.height); ctx.lineTo(o.x + o.width, groundY); ctx.closePath(); ctx.fill();
            } else if (o.type === "double-spike") {
                ctx.fillStyle = "#ff0055"; let w = o.width / 2;
                for(let j=0; j<2; j++) {
                    let sx = o.x + (j*w);
                    ctx.beginPath(); ctx.moveTo(sx, groundY); ctx.lineTo(sx + w / 2, groundY - o.height); ctx.lineTo(sx + w, groundY); ctx.closePath(); ctx.fill();
                }
            } else if (o.type === "block") {
                ctx.fillStyle = "#2d2d2d"; ctx.fillRect(o.x, o.y, o.width, o.height); 
                ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 1.5; ctx.strokeRect(o.x, o.y, o.width, o.height);
            }
        }

        player.draw();

        // Mode notice banner during Endless mode phase shifts
        if (currentLevel.length === Infinity) {
            ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "bold 14px Arial";
            ctx.fillText(`MODE: ${gameMode}`, 50, 70);
        }

        ctx.fillStyle = "#000"; ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY); ctx.fillRect(0, 0, canvas.width, 40);
        ctx.strokeStyle = currentLevel.floorColor; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(canvas.width, 40); ctx.stroke();

        drawButton(buttons.pauseBtn, "#555");

        if (isGameOver) {
            ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ff2a6d"; ctx.font = "bold 36px Arial"; ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = "#fff"; ctx.font = "18px Arial"; ctx.fillText("Tap / Press space to try again", canvas.width / 2, canvas.height / 2 + 40);
            ctx.textAlign = "start";
        }
        if (isVictory) {
            ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#33ff33"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center";
            ctx.fillText("LEVEL COMPLETED! 🎉", canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = "#fff"; ctx.font = "20px Arial"; ctx.fillText(`Coins earned: 🟡 ${levelCoinsCollected}`, canvas.width / 2, canvas.height / 2 + 50);
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
