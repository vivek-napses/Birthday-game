(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const goalEl = document.getElementById("goal");
  const progressFillEl = document.getElementById("progressFill");
  const statusTextEl = document.getElementById("statusText");
  const restartButton = document.getElementById("restartButton");

  const groundY = 430;
  const goalScore = 14;
  const baseScrollSpeed = 5.2;
  const gravity = 0.68;
  const jumpStrength = -14.5;
  const state = {
    running: true,
    ended: false,
    won: false,
    score: 0,
    distance: 0,
    lastTime: 0,
    obstacleTimer: 0,
    collectibleTimer: 0,
    confetti: []
  };

  const player = {
    x: 120,
    y: groundY - 86,
    width: 52,
    height: 86,
    velocityY: 0,
    grounded: true
  };

  const obstacles = [];
  const collectibles = [];
  const clouds = [
    { x: 120, y: 100, size: 28 },
    { x: 320, y: 80, size: 36 },
    { x: 660, y: 130, size: 24 }
  ];
  const balloons = [
    { x: 180, y: 150, sway: 0.2, color: "#f28c28" },
    { x: 240, y: 135, sway: 0.35, color: "#d8576b" },
    { x: 300, y: 150, sway: 0.5, color: "#2f8f46" }
  ];

  goalEl.textContent = String(goalScore);

  function resetGame() {
    state.running = true;
    state.ended = false;
    state.won = false;
    state.score = 0;
    state.distance = 0;
    state.lastTime = 0;
    state.obstacleTimer = 0;
    state.collectibleTimer = 0;
    state.confetti = [];
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.grounded = true;
    obstacles.length = 0;
    collectibles.length = 0;
    scoreEl.textContent = "0";
    progressFillEl.style.width = "0%";
    statusTextEl.textContent = "Jump over barricades and collect badges.";
  }

  function triggerJump() {
    if (!state.running || !player.grounded) {
      return;
    }
    player.velocityY = jumpStrength;
    player.grounded = false;
  }

  function getPlayerHitbox() {
    return {
      x: player.x + 8,
      y: player.y,
      width: 36,
      height: player.height
    };
  }

  function getDifficulty() {
    return Math.min(state.score / goalScore, 1);
  }

  function getScrollSpeed() {
    return baseScrollSpeed + getDifficulty() * 1.8;
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function spawnObstacle() {
    const height = 42 + Math.random() * 28;
    obstacles.push({
      x: canvas.width + 30,
      y: groundY - height,
      width: 28 + Math.random() * 18,
      height,
      kind: Math.random() > 0.5 ? "barricade" : "gift"
    });
  }

  function spawnCollectible() {
    const heightOffset = 118 + Math.random() * 32;
    collectibles.push({
      x: canvas.width + 30,
      y: groundY - heightOffset,
      width: 28,
      height: 28,
      bob: Math.random() * Math.PI * 2
    });
  }

  function endGame(won) {
    state.running = false;
    state.ended = true;
    state.won = won;
    if (won) {
      statusTextEl.textContent = "Happy Birthday Handu";
      for (let i = 0; i < 90; i += 1) {
        state.confetti.push({
          x: Math.random() * canvas.width,
          y: -Math.random() * 300,
          vy: 2 + Math.random() * 4,
          vx: -1 + Math.random() * 2,
          size: 4 + Math.random() * 6,
          color: ["#f28c28", "#2f8f46", "#d8576b", "#10223d"][i % 4]
        });
      }
    } else {
      statusTextEl.textContent = "Game over! Restart and try the rally again.";
    }
  }

  function update(deltaMs) {
    if (!state.running) {
      updateConfetti();
      return;
    }

    const step = deltaMs / 16.67;
    const scrollSpeed = getScrollSpeed();
    const difficulty = getDifficulty();
    state.distance += scrollSpeed * step;
    state.obstacleTimer += deltaMs;
    state.collectibleTimer += deltaMs;
    progressFillEl.style.width = `${(state.score / goalScore) * 100}%`;

    if (state.obstacleTimer > 1250 - difficulty * 250 + Math.random() * 180) {
      spawnObstacle();
      state.obstacleTimer = 0;
    }

    if (state.collectibleTimer > 980 - difficulty * 160 + Math.random() * 180) {
      const lastObstacle = obstacles[obstacles.length - 1];
      const shouldDelayCollectible =
        lastObstacle && lastObstacle.x > canvas.width - 150 && lastObstacle.y < groundY - 52;
      if (!shouldDelayCollectible) {
        spawnCollectible();
        state.collectibleTimer = 0;
      } else {
        state.collectibleTimer -= 120;
      }
    }

    player.velocityY += gravity * step;
    player.y += player.velocityY * step;

    if (player.y >= groundY - player.height) {
      player.y = groundY - player.height;
      player.velocityY = 0;
      player.grounded = true;
    }

    const playerHitbox = getPlayerHitbox();

    for (const obstacle of obstacles) {
      obstacle.x -= scrollSpeed * step;
      if (rectsOverlap(playerHitbox, obstacle)) {
        endGame(false);
        return;
      }
    }

    for (let index = collectibles.length - 1; index >= 0; index -= 1) {
      const item = collectibles[index];
      item.x -= scrollSpeed * step;
      item.bob += 0.08 * step;
      item.y += Math.sin(item.bob) * 0.35;
      if (!item.collected && rectsOverlap(playerHitbox, item)) {
        collectibles.splice(index, 1);
        state.score += 1;
        scoreEl.textContent = String(state.score);
        progressFillEl.style.width = `${(state.score / goalScore) * 100}%`;
        if (state.score >= goalScore) {
          endGame(true);
          return;
        }
        continue;
      }
    }

    while (obstacles.length && obstacles[0].x + obstacles[0].width < -10) {
      obstacles.shift();
    }
    for (let index = collectibles.length - 1; index >= 0; index -= 1) {
      if (collectibles[index].x + collectibles[index].width < -10) {
        collectibles.splice(index, 1);
      }
    }
  }

  function updateConfetti() {
    for (const piece of state.confetti) {
      piece.x += piece.vx;
      piece.y += piece.vy;
      if (piece.y > canvas.height + 20) {
        piece.y = -10;
      }
    }
  }

  function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#d4f0ff");
    gradient.addColorStop(0.65, "#fff1c7");
    gradient.addColorStop(1, "#ffd1b8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const cloud of clouds) {
      cloud.x -= 0.25;
      if (cloud.x < -100) {
        cloud.x = canvas.width + 100;
      }
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.8, cloud.y + 8, cloud.size * 0.75, 0, Math.PI * 2);
      ctx.arc(cloud.x - cloud.size * 0.8, cloud.y + 10, cloud.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < canvas.width; i += 70) {
      ctx.strokeStyle = "rgba(16, 34, 61, 0.24)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i, 42 + Math.sin((state.distance + i) * 0.01) * 3);
      ctx.lineTo(i + 70, 46 + Math.sin((state.distance + i + 35) * 0.01) * 3);
      ctx.stroke();
      ctx.fillStyle = i % 140 === 0 ? "#f28c28" : i % 210 === 0 ? "#2f8f46" : "#d8576b";
      ctx.beginPath();
      ctx.moveTo(i + 14, 44);
      ctx.lineTo(i + 28, 72);
      ctx.lineTo(i + 42, 44);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#9dc77c";
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillStyle = "#4a4f62";
    ctx.fillRect(0, groundY + 40, canvas.width, 70);

    for (let i = 0; i < canvas.width; i += 90) {
      const roadX = ((i - (state.distance % 90)) + canvas.width) % canvas.width;
      ctx.fillStyle = "#f7edd1";
      ctx.fillRect(roadX, groundY + 70, 42, 8);
    }

    const goalProgress = Math.min(state.score / goalScore, 1);
    const goalX = canvas.width + 140 - goalProgress * 280;
    ctx.fillStyle = "#f4d3a1";
    ctx.fillRect(goalX - 54, 360, 120, 18);
    ctx.fillStyle = "#f7b2c2";
    ctx.fillRect(goalX - 18, 330, 48, 30);
    ctx.fillStyle = "#fff3d6";
    ctx.fillRect(goalX - 12, 320, 36, 12);
    ctx.fillStyle = "#ffffff";
    for (let candle = 0; candle < 3; candle += 1) {
      const candleX = goalX - 6 + candle * 12;
      ctx.fillRect(candleX, 308, 4, 12);
      ctx.fillStyle = "#f28c28";
      ctx.beginPath();
      ctx.arc(candleX + 2, 304, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
    }
    ctx.fillStyle = "#d97828";
    ctx.fillRect(goalX, 180, 12, 250);
    ctx.fillStyle = "#2f8f46";
    ctx.beginPath();
    ctx.moveTo(goalX + 12, 185);
    ctx.lineTo(goalX + 112, 205);
    ctx.lineTo(goalX + 12, 225);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Goal Stage", goalX - 32, 165);

    balloons.forEach((balloon, index) => {
      const bob = Math.sin(state.distance * 0.02 + balloon.sway * 8) * 6;
      const balloonX = goalX - 120 + index * 34;
      const balloonY = balloon.y + bob;
      ctx.strokeStyle = "rgba(16, 34, 61, 0.35)";
      ctx.beginPath();
      ctx.moveTo(balloonX, balloonY + 14);
      ctx.lineTo(balloonX - 4, balloonY + 60);
      ctx.stroke();
      ctx.fillStyle = balloon.color;
      ctx.beginPath();
      ctx.ellipse(balloonX, balloonY, 13, 17, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPlayer() {
    const stride = player.grounded ? Math.sin(state.distance * 0.12) * 6 : -4;
    const armSwing = player.grounded ? Math.cos(state.distance * 0.12) * 5 : 2;
    ctx.fillStyle = "#1d3557";
    ctx.fillRect(player.x + 16, player.y + 20, 20, 46);
    ctx.fillStyle = "#ffd7b5";
    ctx.beginPath();
    ctx.arc(player.x + 26, player.y + 14, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f28c28";
    ctx.fillRect(player.x + 8, player.y + 26, 36, 20);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(player.x + 19, player.y + 33, 14, 6);
    ctx.fillStyle = "#2f8f46";
    ctx.fillRect(player.x + 18, player.y + 66, 8, 20 + stride);
    ctx.fillRect(player.x + 28, player.y + 66 - stride, 8, 20 + Math.abs(stride));
    ctx.fillStyle = "#f28c28";
    ctx.fillRect(player.x + 4, player.y + 32 + armSwing, 8, 24);
    ctx.fillRect(player.x + 40, player.y + 32 - armSwing, 8, 24);
  }

  function drawObstacle(obstacle) {
    if (obstacle.kind === "gift") {
      ctx.fillStyle = "#d8576b";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = "#ffe7b5";
      ctx.fillRect(obstacle.x + obstacle.width / 2 - 3, obstacle.y, 6, obstacle.height);
      ctx.fillRect(obstacle.x, obstacle.y + obstacle.height / 2 - 3, obstacle.width, 6);
      return;
    }

    ctx.fillStyle = "#c35144";
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = "#fff3e0";
    ctx.fillRect(obstacle.x + 4, obstacle.y + 8, obstacle.width - 8, 8);
    ctx.fillRect(obstacle.x + 4, obstacle.y + 24, obstacle.width - 8, 8);
  }

  function drawCollectible(item) {
    const centerX = item.x + item.width / 2;
    const centerY = item.y + item.height / 2;
    ctx.fillStyle = "#f1b82b";
    ctx.beginPath();
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = (Math.PI / 3) * petal;
      const px = centerX + Math.cos(angle) * 8;
      const py = centerY + Math.sin(angle) * 8;
      ctx.moveTo(centerX, centerY);
      ctx.ellipse(px, py, 6, 10, angle, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = "#2f8f46";
    ctx.beginPath();
    ctx.arc(centerX, centerY + 4, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOverlay() {
    if (!state.ended) {
      return;
    }

    ctx.fillStyle = "rgba(16, 34, 61, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 42px Arial";
    ctx.fillText(state.won ? "Happy Birthday Handu" : "Game Over", canvas.width / 2, 210);

    ctx.font = "24px Arial";
    ctx.fillText(
      state.won ? "You reached the birthday stage in style!" : "A barricade stopped the run.",
      canvas.width / 2,
      255
    );

    ctx.font = "20px Arial";
    ctx.fillText("Press Restart to play again.", canvas.width / 2, 300);
    ctx.textAlign = "start";

    if (state.won) {
      for (const piece of state.confetti) {
        ctx.fillStyle = piece.color;
        ctx.fillRect(piece.x, piece.y, piece.size, piece.size);
      }
    }
  }

  function draw() {
    drawBackground();
    for (const item of collectibles) {
      drawCollectible(item);
    }
    for (const obstacle of obstacles) {
      drawObstacle(obstacle);
    }
    drawPlayer();
    drawOverlay();
  }

  function loop(timestamp) {
    if (!state.lastTime) {
      state.lastTime = timestamp;
    }
    const deltaMs = Math.min(32, timestamp - state.lastTime);
    state.lastTime = timestamp;
    update(deltaMs);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (event) => {
    const isButtonFocused = event.target instanceof HTMLElement && event.target.tagName === "BUTTON";
    if (isButtonFocused) {
      return;
    }
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      triggerJump();
    }
  });

  canvas.addEventListener("pointerdown", triggerJump);
  restartButton.addEventListener("click", resetGame);

  resetGame();
  requestAnimationFrame(loop);
})();
