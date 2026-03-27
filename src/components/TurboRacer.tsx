import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GAME_WIDTH = 420;
const CAR_W = 50;
const CAR_H = 80;
const TARGET_SCORE = 20000;

type GameState = "idle" | "playing" | "won" | "lost";

const TurboRacer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const stateRef = useRef({
    running: false,
    score: 0,
    coins: 0,
    x: 185,
    y: 0,
    speed: 5,
    keys: {} as Record<string, boolean>,
    enemies: [] as { x: number; y: number }[],
    coins_: [] as { x: number; y: number }[],
    lineOffset: 0,
    lampOffset: 0,
    rafId: 0,
    gameH: 700,
  });

  const drawCar3D = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isPlayer: boolean) => {
    ctx.save();
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x + CAR_W / 2, y + CAR_H + 5, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Car body
    const grad = ctx.createLinearGradient(x, y, x + CAR_W, y + CAR_H);
    if (isPlayer) {
      grad.addColorStop(0, "#ff4444");
      grad.addColorStop(0.5, "#cc0000");
      grad.addColorStop(1, "#880000");
    } else {
      grad.addColorStop(0, color);
      grad.addColorStop(1, "#885500");
    }
    ctx.fillStyle = grad;
    roundRect(ctx, x + 5, y + 15, CAR_W - 10, CAR_H - 15, 6);
    ctx.fill();

    // Car top/roof
    const roofGrad = ctx.createLinearGradient(x, y, x + CAR_W, y + 30);
    if (isPlayer) {
      roofGrad.addColorStop(0, "#ff6666");
      roofGrad.addColorStop(1, "#cc0000");
    } else {
      roofGrad.addColorStop(0, color);
      roofGrad.addColorStop(1, "#aa6600");
    }
    ctx.fillStyle = roofGrad;
    roundRect(ctx, x + 3, y, CAR_W - 6, 50, 10);
    ctx.fill();

    // Windshield
    ctx.fillStyle = isPlayer ? "#00d4ff" : "#88ccff";
    ctx.globalAlpha = 0.8;
    roundRect(ctx, x + 10, y + 8, CAR_W - 20, 18, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Rear windshield
    ctx.fillStyle = "#005577";
    ctx.globalAlpha = 0.6;
    roundRect(ctx, x + 12, y + 35, CAR_W - 24, 10, 3);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Wheels
    ctx.fillStyle = "#222";
    roundRect(ctx, x - 2, y + 12, 8, 18, 3);
    ctx.fill();
    roundRect(ctx, x + CAR_W - 6, y + 12, 8, 18, 3);
    ctx.fill();
    roundRect(ctx, x - 2, y + CAR_H - 20, 8, 18, 3);
    ctx.fill();
    roundRect(ctx, x + CAR_W - 6, y + CAR_H - 20, 8, 18, 3);
    ctx.fill();

    // Wheel rims
    ctx.fillStyle = "#666";
    ctx.fillRect(x, y + 16, 4, 10);
    ctx.fillRect(x + CAR_W - 4, y + 16, 4, 10);
    ctx.fillRect(x, y + CAR_H - 16, 4, 10);
    ctx.fillRect(x + CAR_W - 4, y + CAR_H - 16, 4, 10);

    // Headlights (player) or taillights (enemy)
    if (isPlayer) {
      ctx.fillStyle = "#ffff00";
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(x + 10, y + 2, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + CAR_W - 10, y + 2, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = "#ff3333";
      ctx.shadowColor = "#ff0000";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(x + 10, y + CAR_H - 5, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + CAR_W - 10, y + CAR_H - 5, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  const drawStreetLight = (ctx: CanvasRenderingContext2D, x: number, y: number, side: "left" | "right") => {
    ctx.save();
    // Pole
    ctx.fillStyle = "#555";
    ctx.fillRect(x, y, 4, 60);

    // Arm
    const armDir = side === "left" ? 1 : -1;
    ctx.fillRect(x, y, armDir * 25, 3);

    // Light fixture
    ctx.fillStyle = "#ffee88";
    ctx.shadowColor = "#ffcc00";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(x + armDir * 25, y + 2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Light cone
    ctx.fillStyle = "rgba(255,238,136,0.05)";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(x + armDir * 20, y + 6);
    ctx.lineTo(x + armDir * 10, y + 80);
    ctx.lineTo(x + armDir * 40, y + 80);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawCoin = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    // Glow
    ctx.shadowColor = "#ffcc00";
    ctx.shadowBlur = 15;
    // Coin
    const coinGrad = ctx.createRadialGradient(x + 15, y + 12, 2, x + 15, y + 15, 15);
    coinGrad.addColorStop(0, "#fff7a0");
    coinGrad.addColorStop(0.5, "#ffd700");
    coinGrad.addColorStop(1, "#cc9900");
    ctx.fillStyle = coinGrad;
    ctx.beginPath();
    ctx.ellipse(x + 15, y + 15, 14, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // $ symbol
    ctx.fillStyle = "#886600";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("$", x + 15, y + 21);
    ctx.restore();
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const boxCollide = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
    ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  const loop = useCallback(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!s.running || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Road background
    const roadGrad = ctx.createLinearGradient(0, 0, W, 0);
    roadGrad.addColorStop(0, "#1a1a2e");
    roadGrad.addColorStop(0.15, "#2a2a3e");
    roadGrad.addColorStop(0.5, "#333348");
    roadGrad.addColorStop(0.85, "#2a2a3e");
    roadGrad.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, 0, W, H);

    // Road edges
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 15]);
    ctx.lineDashOffset = -s.lineOffset;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(8, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 8, 0);
    ctx.lineTo(W - 8, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center dashed lines
    s.lineOffset += s.speed;
    if (s.lineOffset > 150) s.lineOffset -= 150;

    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 3;
    ctx.setLineDash([60, 90]);
    ctx.lineDashOffset = -s.lineOffset;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Street lights
    s.lampOffset += s.speed;
    if (s.lampOffset > 250) s.lampOffset -= 250;
    for (let i = -1; i < 5; i++) {
      const ly = i * 250 + s.lampOffset;
      drawStreetLight(ctx, 15, ly, "left");
      drawStreetLight(ctx, W - 19, ly, "right");
    }

    // Move & draw coins
    for (const c of s.coins_) {
      c.y += s.speed;
      if (boxCollide(s.x, s.y, CAR_W, CAR_H, c.x, c.y, 30, 30)) {
        s.coins++;
        s.score += 50;
        c.y = -300 - Math.random() * 300;
        c.x = 30 + Math.random() * (GAME_WIDTH - 90);
      }
      if (c.y > H + 30) {
        c.y = -300 - Math.random() * 200;
        c.x = 30 + Math.random() * (GAME_WIDTH - 90);
      }
      drawCoin(ctx, c.x, c.y);
    }

    // Move & draw enemies
    for (const e of s.enemies) {
      e.y += s.speed;
      if (e.y > H + 80) {
        e.y = -300 - Math.random() * 300;
        e.x = 20 + Math.random() * (GAME_WIDTH - 90);
      }
      drawCar3D(ctx, e.x, e.y, "#ff8800", false);
      if (boxCollide(s.x, s.y, CAR_W, CAR_H, e.x, e.y, CAR_W, CAR_H)) {
        // Explosion effect
        ctx.fillStyle = "rgba(255,100,0,0.6)";
        ctx.beginPath();
        ctx.ellipse(s.x + CAR_W / 2, s.y + CAR_H / 2, 50, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        s.running = false;
        setScore(s.score);
        setCoins(s.coins);
        setGameState("lost");
        return;
      }
    }

    // Player car
    drawCar3D(ctx, s.x, s.y, "#ff0000", true);

    // Movement
    if (s.keys.ArrowLeft && s.x > 15) s.x -= s.speed;
    if (s.keys.ArrowRight && s.x < GAME_WIDTH - CAR_W - 15) s.x += s.speed;
    if (s.keys.ArrowUp && s.y > 0) s.y -= s.speed;
    if (s.keys.ArrowDown && s.y < H - CAR_H) s.y += s.speed;

    s.score++;
    // Speed up gradually
    s.speed = 5 + Math.floor(s.score / 2000);

    setScore(s.score);
    setCoins(s.coins);

    if (s.score >= TARGET_SCORE) {
      s.running = false;
      setGameState("won");
      return;
    }

    s.rafId = requestAnimationFrame(loop);
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = GAME_WIDTH;
    canvas.height = window.innerHeight;
    s.gameH = window.innerHeight;

    cancelAnimationFrame(s.rafId);
    s.score = 0;
    s.coins = 0;
    s.x = 185;
    s.y = canvas.height - 150;
    s.speed = 5;
    s.lineOffset = 0;
    s.lampOffset = 0;
    s.enemies = [];
    s.coins_ = [];

    for (let i = 0; i < 3; i++) {
      s.enemies.push({ x: 20 + Math.random() * (GAME_WIDTH - 90), y: (i + 1) * -300 });
    }
    for (let i = 0; i < 3; i++) {
      s.coins_.push({ x: 30 + Math.random() * (GAME_WIDTH - 90), y: (i + 1) * -400 });
    }

    s.running = true;
    setGameState("playing");
    setScore(0);
    setCoins(0);
    s.rafId = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    const s = stateRef.current;
    const down = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      s.keys[e.key] = true;
    };
    const up = (e: KeyboardEvent) => { s.keys[e.key] = false; };
    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("keyup", up);
      cancelAnimationFrame(s.rafId);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = GAME_WIDTH;
      canvas.height = window.innerHeight;
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative select-none">
      {/* HUD */}
      <div className="fixed top-4 left-4 z-50 space-y-1">
        <div className="text-foreground text-lg font-mono tracking-wider bg-background/80 px-3 py-1 rounded-md border border-primary/30">
          🏁 Score: <span className="text-primary font-bold">{score}</span>
        </div>
        <div className="text-accent text-lg font-mono tracking-wider bg-background/80 px-3 py-1 rounded-md border border-accent/30">
          💰 Coins: <span className="font-bold">{coins}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="fixed top-4 right-4 z-50 w-40">
        <div className="text-muted-foreground text-xs font-mono mb-1 text-right">
          {Math.min(100, Math.floor((score / TARGET_SCORE) * 100))}% to 🏆
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
            animate={{ width: `${Math.min(100, (score / TARGET_SCORE) * 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="block border-l-4 border-r-4 border-primary/60"
        style={{ height: "100vh", imageRendering: "auto" }}
      />

      {/* Overlays */}
      <AnimatePresence>
        {gameState === "idle" && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-40"
          >
            <div
              className="bg-background/95 border-2 border-primary rounded-2xl px-10 py-8 text-center cursor-pointer max-w-xs"
              onClick={startGame}
              style={{ boxShadow: "0 0 40px rgba(255,50,50,0.3)" }}
            >
              <div className="text-5xl mb-4">🏎️</div>
              <h1 className="text-3xl font-bold text-foreground mb-2 tracking-wider">TURBO RACER</h1>
              <p className="text-primary text-lg font-bold mb-4">P R O</p>
              <div className="text-muted-foreground text-sm mb-6 space-y-1">
                <p>Use ← → ↑ ↓ Arrow Keys</p>
                <p>Dodge enemies • Collect coins</p>
              </div>
              <div className="text-accent font-bold text-lg mb-4">🎯 Target: {TARGET_SCORE.toLocaleString()}</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-xl font-bold text-lg text-primary-foreground"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), #ff6644)" }}
                onClick={startGame}
              >
                ▶ START RACE
              </motion.button>
            </div>
          </motion.div>
        )}

        {gameState === "won" && (
          <motion.div
            key="win"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-40"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10 }}
              className="bg-background/95 border-2 border-accent rounded-2xl px-10 py-8 text-center max-w-xs"
              style={{ boxShadow: "0 0 60px rgba(255,200,0,0.4)" }}
            >
              <motion.div
                className="text-7xl mb-4"
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🏆
              </motion.div>
              <h2 className="text-3xl font-bold text-accent mb-2">YOU WIN!</h2>
              <p className="text-foreground text-lg mb-1">Score: <span className="font-bold text-primary">{score.toLocaleString()}</span></p>
              <p className="text-accent mb-6">Coins: {coins} 💰</p>

              {/* Confetti stars */}
              <div className="flex justify-center gap-2 mb-6 text-2xl">
                {["⭐", "🌟", "⭐", "🌟", "⭐"].map((s, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    {s}
                  </motion.span>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-xl font-bold text-lg text-accent-foreground"
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)), #ffaa00)" }}
                onClick={startGame}
              >
                🔄 PLAY AGAIN
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {gameState === "lost" && (
          <motion.div
            key="lose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-40"
          >
            <motion.div
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="bg-background/95 border-2 border-destructive rounded-2xl px-10 py-8 text-center max-w-xs"
              style={{ boxShadow: "0 0 40px rgba(255,50,50,0.3)" }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: 2, duration: 0.3 }}
              >
                💥
              </motion.div>
              <h2 className="text-3xl font-bold text-destructive mb-2">GAME OVER</h2>
              <p className="text-foreground text-lg mb-1">Score: <span className="font-bold text-primary">{score.toLocaleString()}</span></p>
              <p className="text-accent mb-6">Coins: {coins} 💰</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-xl font-bold text-lg text-primary-foreground"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), #ff6644)" }}
                onClick={startGame}
              >
                🔄 TRY AGAIN
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TurboRacer;
