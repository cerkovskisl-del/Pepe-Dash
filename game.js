const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Spēles konfigurācija un stāvoklis
let gravity = 0.65;
let score = 0;
let highScore = localStorage.getItem("pepeHighScore") || 0;
let isGameOver = false;
let gameSpeed = 6.5;
let obstacles = [];
let spawnTimer = 0;
const groundY = 330;

// Fona dekoratīvie elementi (kubiņi, kas slīd fonā kā Geometry Dash)
let bgParticles = [];

// Pepe (Spēlētājs)
const pepe = {
    x: 120,
    y: groundY - 40,
    width: 42,
    height: 42,
    velocity: 0,
    jumpForce: -12.5,
    grounded: false,
    rotation: 0,
    
    update() {
        // Gravitācijas pielietošana
        this.velocity += gravity;
        this.y += this.velocity;

        // Sadursme ar zemi
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.velocity = 0;
            this.grounded = true;
            
            // Gluda rotācijas noapaļošana līdz tuvākajam kvadrātam (90 grādi), kad uz zemes
            const targetRotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
            this.rotation += (targetRotation - this.rotation) * 0.3;
        } else {
            // Rotē gaisā
            this.rotation += 0.08;
            this.grounded = false;
        }
    },

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // 1. Pepe zaļais ķermenis
        ctx.fillStyle = "#2d7a31";
        ctx.strokeStyle = "#4ef05d";
        ctx.lineWidth = 3;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 2. Slavenās sarkanās Pepe lūpas
        ctx.fillStyle = "#ff3b3b";
        ctx.fillRect(-this.width / 2 + 6, this.height / 2 - 14, this.width - 12, 6);
        ctx.fillStyle = "#9e1b1b";
        ctx.fillRect(-this.width / 2 + 10, this.height / 2 - 11, this.width - 20, 2);

        // 3. Skumjās/Lielās acis (Baltumi)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 6, 13, 13);
        ctx.fillRect(this.width / 2 - 18, -this.height / 2 + 6, 13, 13);

        // 4. Zīlītes
        ctx.fillStyle = "#000000";
        ctx.fillRect(-this.width / 2 + 9, -this.height / 2 + 10, 5, 5);
        ctx.fillRect(this.width / 2 - 14, -this.height / 2 + 10, 5, 5);

        ctx.restore();
    }
};

// Ievades klausītāji (Tastatūra un pele/skāriens)
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
        triggerJump();
    }
});

canvas.addEventListener("mousedown", () => {
    triggerJump();
});

function triggerJump() {
    if (isGameOver) {
        resetGame();
    } else if (pepe.grounded) {
        pepe.velocity = pepe.jumpForce;
        pepe.grounded = false;
    }
}

// Funkcija šķēršļu (Dzeloņu) izveidei
function spawnObstacle() {
    // Nejauši izvēlas starp parastu dzeloni vai dubultu dzeloni
    let type = Math.random() > 0.6 ? "double" : "single";
    let width = type === "double" ? 60 : 35;
    let height = 38 + Math.random() * 7; // nedaudz mainīgs augstums interesantākai spēlei

    obstacles.push({
        x: canvas.width,
        y: groundY,
        width: width,
        height: height,
        type: type
    });
}

// Spēles restartēšana
function resetGame() {
    obstacles = [];
    bgParticles = [];
    score = 0;
    gameSpeed = 6.5;
    pepe.y = groundY - pepe.height;
    pepe.velocity = 0;
    pepe.rotation = 0;
    isGameOver = false;
}

// Loģikas matemātika
function update() {
    if (isGameOver) return;

    pepe.update();

    // Fona daļiņu (zvaigžņu/kvadrātu) loģika
    if (Math.random() > 0.95) {
        bgParticles.push({
            x: canvas.width,
            y: Math.random() * (groundY - 60),
            size: Math.random() * 15 + 5,
            speed: gameSpeed * 0.3
        });
    }
    for (let i = bgParticles.length - 1; i >= 0; i--) {
        bgParticles[i].x -= bgParticles[i].speed;
        if (bgParticles[i].x + bgParticles[i].size < 0) bgParticles.splice(i, 1);
    }

    // Šķēršļu parādīšanās laika kontrole (intervāli kļūst īsāki, kad spēle paātrinās)
    spawnTimer++;
    let currentSpawnInterval = Math.max(45, 85 - Math.floor(score * 0.8));
    if (spawnTimer > currentSpawnInterval) {
        spawnObstacle();
        spawnTimer = 0;
    }

    // Pakāpenisks ātruma pieaugums
    gameSpeed = 6.5 + (score * 0.25);

    // Šķēršļu apstrāde un sadursmju noteikšana
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        // Taisnstūra sadursmes kaste (AABB precīzai sadursmei)
        // Mazliet samazinām buferi (par 4 pikseļiem), lai spēle būtu godīgāka pret spēlētāju dzeloņu formā
        if (
            pepe.x + 4 < obs.x + obs.width &&
            pepe.x + pepe.width - 4 > obs.x &&
            pepe.y + 4 < obs.y && 
            pepe.y + pepe.height > obs.y - obs.height
        ) {
            isGameOver = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("pepeHighScore", highScore);
            }
        }

        // Dzēst šķēršļus un pieskaitīt punktus
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score++;
        }
    }
}

// Grafiskais zīmējums (Renderēšana)
function draw() {
    // 1. Notīrīt canvas fona gradientu
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#160b29");
    gradient.addColorStop(1, "#36123a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Zīmēt fona daļiņas
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    for (let p of bgParticles) {
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    // 3. Zīmēt zemi un tās līniju (neon stils)
    ctx.fillStyle = "#0d061a";
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#4ef05d";
    ctx.fillStyle = "#4ef05d";
    ctx.fillRect(0, groundY, canvas.width, 4);
    ctx.shadowBlur = 0; // Noņemam spīdumu pārējiem elementiem performancei

    // 4. Zīmēt Pepe varoni
    pepe.draw();

    // 5. Zīmēt šķēršļus (Dzeloņus)
    for (let obs of obstacles) {
        ctx.fillStyle = "#ff2a6d";
        ctx.strokeStyle = "#ffb0cd";
        ctx.lineWidth = 2;

        if (obs.type === "single") {
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y);
            ctx.lineTo(obs.x + obs.width / 2, obs.y - obs.height);
            ctx.lineTo(obs.x + obs.width, obs.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Dubultais dzelonis (divi trijstūri blakus)
            let halfW = obs.width / 2;
            for (let j = 0; j < 2; j++) {
                let startX = obs.x + (j * halfW);
                ctx.beginPath();
                ctx.moveTo(startX, obs.y);
                ctx.lineTo(startX + halfW / 2, obs.y - obs.height);
                ctx.lineTo(startX + halfW, obs.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    // 6. Lietotāja interfeiss (Rezultāti)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("PUNKTI: " + score, 25, 40);
    
    ctx.fillStyle = "#8b7ca3";
    ctx.font = "14px Arial";
    ctx.fillText("REKORDS: " + highScore, 25, 65);

    // 7. Zīmēt GAME OVER logu
    if (isGameOver) {
        ctx.fillStyle = "rgba(10, 5, 20, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff2a6d";
        ctx.fillStyle = "#ff2a6d";
        ctx.font = "bold 42px Arial";
        ctx.textAlign = "center";
        ctx.fillText("MĒĢINI VĒLREIZ!", canvas.width / 2, canvas.height / 2 - 15);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "18px Arial";
        ctx.fillText("Tavs rezultāts: " + score, canvas.width / 2, canvas.height / 2 + 25);
        ctx.fillStyle = "#4ef05d";
        ctx.fillText("Nospied jebkuru pogu, lai restartētu", canvas.width / 2, canvas.height / 2 + 60);
        
        ctx.textAlign = "start"; // Atiestata teksta izlīdzināšanu
    }
}

// Galvenais spēles dzinēja cikls (FPS)
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Palaižam spēli pirmo reizi
gameLoop();
