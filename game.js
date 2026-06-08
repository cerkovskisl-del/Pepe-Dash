const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Globālie spēles iestatījumi
const groundY = 370;
let gameSpeed = 7.5;
let score = 0;
let highScore = localStorage.getItem("pepeDashHighScore") || 0;
let isGameOver = false;
let gameMode = "CUBE"; // "CUBE" vai "SHIP"
let inputPressed = false;

// Masīvi objektiem
let obstacles = [];
let portals = [];
let particles = []; // Trail efekts
let frameCount = 0;

// Spēlētāja (Pepe) fizika un vizuālais tēls
const player = {
    x: 150,
    y: groundY - 40,
    width: 40,
    height: 40,
    velocity: 0,
    gravity: 0.7,      // Cube gravitācija
    shipGravity: 0.35,  // Ship gravitācija
    jumpForce: -12,
    shipFlyForce: -0.8,
    grounded: false,
    rotation: 0,

    update() {
        if (gameMode === "CUBE") {
            // Cube fizika
            this.velocity += this.gravity;
            this.y += this.velocity;

            if (this.y + this.height >= groundY) {
                this.y = groundY - this.height;
                this.velocity = 0;
                this.grounded = true;
                
                // Nobloķē rotāciju precīzi uz tuvāko 90 grādu leņķi pie zemes
                this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
            } else {
                this.rotation += 0.09; // Rotē, kamēr gaisā
                this.grounded = false;
            }
        } else if (gameMode === "SHIP") {
            // Ship vadība (turot pogu, lido uz augšu, atlaižot krīt)
            if (inputPressed) {
                this.velocity += this.shipFlyForce;
            } else {
                this.velocity += this.shipGravity;
            }

            // Ātruma ierobežotājs lidaparātam
            this.velocity = Math.max(-6, Math.min(6, this.velocity));
            this.y += this.velocity;

            // Griestu un grīdas barjeras kuģītim
            if (this.y + this.height >= groundY) {
                this.y = groundY - this.height;
                this.velocity = 0;
            }
            if (this.y <= 40) {
                this.y = 40;
                this.velocity = 0;
            }

            // Kuģītis nedaudz sasveras atkarībā no ātruma
            this.rotation = this.velocity * 0.05;
        }

        // Pievieno astes (trail) daļiņas
        if (frameCount % 2 === 0) {
            particles.push({
                x: this.x,
                y: this.y + this.height / 2 + (Math.random() * 10 - 5),
                size: Math.random() * 6 + 4,
                alpha: 1
            });
        }
    },

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        if (gameMode === "CUBE") {
            // Zaļš Pepe kubiņš
            ctx.fillStyle = "#4CAF50";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            // Acis un mutīte
            ctx.fillStyle = "#fff";
            ctx.fillRect(-12, -12, 10, 10); ctx.fillRect(2, -12, 10, 10);
            ctx.fillStyle = "#000";
            ctx.fillRect(-8, -9, 4, 4); ctx.fillRect(6, -9, 4, 4);
            ctx.fillStyle = "#ff3333";
            ctx.fillRect(-10, 4, 20, 4);
        } else {
            // Pepe kuģīša režīms (GD stila kuģis ar Pepe galvu virsū)
            // Kuģa korpuss
            ctx.fillStyle = "#00ffff";
            ctx.beginPath();
            ctx.moveTo(-20, 10);
            ctx.lineTo(20, 15);
            ctx.lineTo(10, -5);
            ctx.lineTo(-15, -5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Pepe galva kuģīša iekšpusē
            ctx.fillStyle = "#4CAF50";
            ctx.fillRect(-10, -15, 20, 15);
            ctx.fillStyle = "#fff";
            ctx.fillRect(-6, -13, 6, 6); ctx.fillRect(1, -13, 6, 6);
            ctx.fillStyle = "#000";
            ctx.fillRect(-4, -11, 2, 2); ctx.fillRect(3, -11, 2, 2);
        }

        ctx.restore();
    }
};

// Ievades kontroles (Peles un tastatūras apvienošana)
function handleStart() {
    inputPressed = true;
    if (isGameOver) {
        resetGame();
    } else if (gameMode === "CUBE" && player.grounded) {
        player.velocity = player.jumpForce;
        player.grounded = false;
    }
}
function handleEnd() {
    inputPressed = false;
}

window.addEventListener("keydown", (e) => { if (e.code === "Space" || e.code === "ArrowUp") handleStart(); });
window.addEventListener("keyup", (e) => { if (e.code === "Space" || e.code === "ArrowUp") handleEnd(); });
canvas.addEventListener("mousedown", handleStart);
canvas.addEventListener("mouseup", handleEnd);

// Līmeņa ģenerēšanas ritms (kartes loģika)
function buildLevel() {
    frameCount++;
    
    // Ģenerē šķēršļus balstoties uz laiku
    if (frameCount % 90 === 0 && Math.random() > 0.3) {
        let r = Math.random();
        if (r < 0.5) {
            // Viens dzelonis
            obstacles.push({ x: canvas.width, y: groundY, width: 30, height: 35, type: "spike" });
        } else if (r < 0.8 && gameMode === "CUBE") {
            // Dubults dzelonis
            obstacles.push({ x: canvas.width, y: groundY, width: 60, height: 35, type: "double-spike" });
        } else if (gameMode === "SHIP") {
            // Sienas bloks augšā vai apakšā kuģītim
            let blockY = Math.random() > 0.5 ? groundY - 50 : 40;
            obstacles.push({ x: canvas.width, y: blockY, width: 40, height: 50, type: "block" });
        }
    }

    // Portālu loģika (Maina režīmus ik pēc noteikta laika)
    if (frameCount === 400) {
        portals.push({ x: canvas.width, y: groundY - 100, width: 30, height: 120, toMode: "SHIP", color: "#ff00ff" });
    }
    if (frameCount === 900) {
        portals.push({ x: canvas.width, y: groundY - 100, width: 30, height: 120, toMode: "CUBE", color: "#00ff00" });
    }
    
    // Bezgalīgā cikla restarts līmeņa ritmam
    if (frameCount > 1300) frameCount = 0;
}

function resetGame() {
    obstacles = [];
    portals = [];
    particles = [];
    score = 0;
    frameCount = 0;
    gameMode = "CUBE";
    player.y = groundY - player.height;
    player.velocity = 0;
    player.rotation = 0;
    isGameOver = false;
}

// Spēles matemātiskais stāvoklis (Update)
function update() {
    if (isGameOver) return;

    buildLevel();
    player.update();

    // Atjaunina UI datus
    score += 0.1;
    document.getElementById("scoreText").innerText = `ATTĀLUMS: ${Math.floor(score)}%`;
    document.getElementById("modeText").innerText = `MODE: ${gameMode}`;
    document.getElementById("highScoreText").innerText = `BEST: ${Math.floor(highScore)}%`;

    // 1. Astes daļiņu efekts (Trail)
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x -= gameSpeed - 2;
        particles[i].alpha -= 0.04;
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // 2. Portālu kustība un sadursme
    for (let i = portals.length - 1; i >= 0; i--) {
        let p = portals[i];
        p.x -= gameSpeed;

        // Pārbauda vai spēlētājs izskrien cauri portālam
        if (player.x + player.width > p.x && player.x < p.x + p.width && player.y + player.height > p.y && player.y < p.y + p.height) {
            gameMode = p.toMode;
            portals.splice(i, 1); // Dzēš pēc ieiešanas
            continue;
        }
        if (p.x + p.width < 0) portals.splice(i, 1);
    }

    // 3. Šķēršļu kustība un sadursmes pārbaude
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let o = obstacles[i];
        o.x -= gameSpeed;

        // Hitbox sadursme (AABB ar nedaudz drošības buferi)
        let hitX = player.x + 5 < o.x + o.width && player.x + player.width - 5 > o.x;
        let hitY = false;

        if (o.type === "spike" || o.type === "double-spike") {
            hitY = player.y + player.height > o.y - o.height && player.y + 5 < o.y;
        } else if (o.type === "block") {
            hitY = player.y < o.y + o.height && player.y + player.height > o.y;
        }

        if (hitX && hitY) {
            isGameOver = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("pepeDashHighScore", highScore);
            }
        }

        if (o.x + o.width < 0) obstacles.splice(i, 1);
    }
}

// Zīmēšana uz ekrāna (Render)
function draw() {
    // Fona krāsa (Geometry dash stila zilgans/tumšs fons)
    ctx.fillStyle = gameMode === "CUBE" ? "#0f051d" : "#1a0511";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid (Rūtiņu fons kā oriģinālā)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    let gridSize = 40;
    let offset = (frameCount * gameSpeed) % gridSize;
    for (let x = -offset; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke();
    }

    // Zīmē astes efektu
    for (let p of particles) {
        ctx.fillStyle = `rgba(78, 240, 93, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    // Zīmē portālus
    for (let p of portals) {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.shadowBlur = 0;
    }

    // Zīmē šķēršļus
    for (let o of obstacles) {
        if (o.type === "spike") {
            ctx.fillStyle = "#ff0055";
            ctx.beginPath();
            ctx.moveTo(o.x, o.y);
            ctx.lineTo(o.x + o.width / 2, o.y - o.height);
            ctx.lineTo(o.x + o.width, o.y);
            ctx.closePath();
            ctx.fill();
        } else if (o.type === "double-spike") {
            ctx.fillStyle = "#ff0055";
            ctx.beginPath();
            ctx.moveTo(o.x, o.y);
            ctx.lineTo(o.x + 15, o.y - o.height);
            ctx.lineTo(o.x + 30, o.y);
            ctx.lineTo(o.x + 45, o.y - o.height);
            ctx.lineTo(o.x + 60, o.y);
            ctx.closePath();
            ctx.fill();
        } else if (o.type === "block") {
            ctx.fillStyle = "#333";
            ctx.fillRect(o.x, o.y, o.width, o.height);
            ctx.strokeStyle = "#555";
            ctx.strokeRect(o.x, o.y, o.width, o.height);
        }
    }

    // Zīmē spēlētāju
    player.draw();

    // Zīmē zemi un griestus
    ctx.fillStyle = "#000";
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillRect(0, 0, canvas.width, 40);

    // Neon līnijas zemei un griestiem
    ctx.strokeStyle = gameMode === "CUBE" ? "#00ffff" : "#ff00ff";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(canvas.width, 40); ctx.stroke();

    // Game Over ekrāns
    if (isGameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff2a6d";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.fillText("SPĒLE BEIGUSIES", canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = "#fff";
        ctx.font = "18px Arial";
        ctx.fillText("Klikšķini, lai mēģinātu vēlreiz", canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = "start";
    }
}

// Galvenais cikls
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
