import { useEffect, useRef, useCallback } from "react";

const GAME_WIDTH = 400;
const GAME_HEIGHT = typeof window !== "undefined" ? window.innerHeight : 700;
const CAR_W = 50;
const CAR_H = 80;
const TARGET_SCORE = 20000;

interface Entity {
  x: number;
  y: number;
  el: HTMLDivElement;
}

const TurboRacer = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);

  const state = useRef({
    running: false,
    score: 0,
    coins: 0,
    x: 175,
    y: 500,
    speed: 5,
    keys: {} as Record<string, boolean>,
    lines: [] as Entity[],
    enemies: [] as Entity[],
    coinEntities: [] as Entity[],
    car: null as HTMLDivElement | null,
    rafId: 0,
  });

  const isCollide = (a: DOMRect, b: DOMRect) =>
    !(a.bottom < b.top || a.top > b.bottom || a.right < b.left || a.left > b.right);

  const showOverlay = useCallback((msg: string) => {
    if (overlayRef.current) {
      overlayRef.current.innerHTML = msg;
      overlayRef.current.style.display = "block";
    }
  }, []);

  const endGame = useCallback((win: boolean) => {
    const s = state.current;
    s.running = false;
    cancelAnimationFrame(s.rafId);
    showOverlay(
      win
        ? `🏆 YOU WIN!<br/>Score: ${s.score}<br/><span style="font-size:14px">Click to Restart</span>`
        : `❌ Game Over<br/>Score: ${s.score}<br/><span style="font-size:14px">Click to Try Again</span>`
    );
  }, [showOverlay]);

  const loop = useCallback(() => {
    const s = state.current;
    if (!s.running || !s.car) return;

    const carRect = s.car.getBoundingClientRect();

    // Move lines
    s.lines.forEach((l) => {
      l.y += s.speed;
      if (l.y >= GAME_HEIGHT) l.y -= GAME_HEIGHT + 100;
      l.el.style.top = l.y + "px";
    });

    // Move enemies
    for (const e of s.enemies) {
      e.y += s.speed;
      if (e.y >= GAME_HEIGHT + 80) {
        e.y = -300;
        e.x = Math.random() * (GAME_WIDTH - CAR_W);
        e.el.style.left = e.x + "px";
      }
      e.el.style.top = e.y + "px";
      if (isCollide(carRect, e.el.getBoundingClientRect())) {
        endGame(false);
        return;
      }
    }

    // Move coins
    for (const c of s.coinEntities) {
      c.y += s.speed;
      if (isCollide(carRect, c.el.getBoundingClientRect())) {
        s.coins++;
        s.score += 50;
        c.y = -300;
        c.x = Math.random() * (GAME_WIDTH - 30);
        c.el.style.left = c.x + "px";
      }
      if (c.y >= GAME_HEIGHT + 30) {
        c.y = -300;
        c.x = Math.random() * (GAME_WIDTH - 30);
        c.el.style.left = c.x + "px";
      }
      c.el.style.top = c.y + "px";
    }

    // Player movement
    if (s.keys.ArrowLeft && s.x > 0) s.x -= s.speed;
    if (s.keys.ArrowRight && s.x < GAME_WIDTH - CAR_W) s.x += s.speed;
    if (s.keys.ArrowUp && s.y > 0) s.y -= s.speed;
    if (s.keys.ArrowDown && s.y < GAME_HEIGHT - CAR_H) s.y += s.speed;

    s.car.style.left = s.x + "px";
    s.car.style.top = s.y + "px";

    s.score++;

    if (scoreRef.current) scoreRef.current.textContent = "Score: " + s.score;
    if (coinRef.current) coinRef.current.textContent = "Coins: " + s.coins;

    if (s.score >= TARGET_SCORE) {
      endGame(true);
      return;
    }

    s.rafId = requestAnimationFrame(loop);
  }, [endGame]);

  const startGame = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    const s = state.current;

    cancelAnimationFrame(s.rafId);
    game.innerHTML = "";

    s.score = 0;
    s.coins = 0;
    s.x = 175;
    s.y = GAME_HEIGHT - 150;
    s.speed = 5;
    s.lines = [];
    s.enemies = [];
    s.coinEntities = [];

    // Lines
    for (let i = 0; i < 5; i++) {
      const el = document.createElement("div");
      el.className = "game-line";
      const y = i * 150;
      el.style.top = y + "px";
      game.appendChild(el);
      s.lines.push({ x: 195, y, el });
    }

    // Car
    const car = document.createElement("div");
    car.className = "game-car";
    car.style.left = s.x + "px";
    car.style.top = s.y + "px";
    game.appendChild(car);
    s.car = car;

    // Enemies
    for (let i = 0; i < 3; i++) {
      const el = document.createElement("div");
      el.className = "game-enemy";
      const x = Math.random() * (GAME_WIDTH - CAR_W);
      const y = (i + 1) * -300;
      el.style.left = x + "px";
      el.style.top = y + "px";
      game.appendChild(el);
      s.enemies.push({ x, y, el });
    }

    // Coins
    for (let i = 0; i < 3; i++) {
      const el = document.createElement("div");
      el.className = "game-coin";
      const x = Math.random() * (GAME_WIDTH - 30);
      const y = (i + 1) * -400;
      el.style.left = x + "px";
      el.style.top = y + "px";
      game.appendChild(el);
      s.coinEntities.push({ x, y, el });
    }

    if (overlayRef.current) overlayRef.current.style.display = "none";
    s.running = true;
    s.rafId = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    const s = state.current;
    const down = (e: KeyboardEvent) => { s.keys[e.key] = true; };
    const up = (e: KeyboardEvent) => { s.keys[e.key] = false; };
    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("keyup", up);
      cancelAnimationFrame(s.rafId);
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
      <div ref={scoreRef} className="fixed top-3 left-3 text-foreground text-lg z-50 font-mono">Score: 0</div>
      <div ref={coinRef} className="fixed top-10 left-3 text-accent text-lg z-50 font-mono">Coins: 0</div>

      <div className="relative overflow-hidden border-l-4 border-r-4 border-dashed border-foreground"
        style={{ width: GAME_WIDTH, height: "100vh", background: "hsl(var(--road))" }}>

        <div ref={gameRef} className="w-full h-full relative" />

        <div
          ref={overlayRef}
          onClick={startGame}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/95 border border-primary text-foreground px-8 py-6 text-center cursor-pointer rounded-lg z-40 text-xl leading-relaxed"
          style={{ textShadow: "0 0 10px hsl(var(--neon-glow))" }}
        >
          🏎️ Turbo Racer Pro<br />
          Click to Start<br />
          <span className="text-accent text-base">🎯 Target: {TARGET_SCORE}</span>
        </div>
      </div>

      <style>{`
        .game-car {
          width: ${CAR_W}px; height: ${CAR_H}px;
          position: absolute;
          background: linear-gradient(145deg, hsl(var(--primary)), #a80000);
          border-radius: 10px;
          box-shadow: 0 5px 20px rgba(255,0,0,0.4);
        }
        .game-car::before {
          content: ''; position: absolute;
          width: 40px; height: 20px;
          background: #00c3ff; top: 10px; left: 5px;
          border-radius: 5px;
        }
        .game-enemy {
          width: ${CAR_W}px; height: ${CAR_H}px;
          position: absolute;
          background: linear-gradient(145deg, hsl(var(--secondary)), #cc6600);
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(255,165,0,0.3);
        }
        .game-line {
          width: 10px; height: 100px;
          background: hsl(var(--road-line));
          position: absolute; left: 195px;
        }
        .game-coin {
          width: 30px; height: 30px;
          background: hsl(var(--accent));
          border-radius: 50%;
          position: absolute;
          box-shadow: 0 0 15px hsl(var(--coin-glow));
        }
        .game-coin::after {
          content: '$'; position: absolute;
          top: 3px; left: 9px; font-weight: bold;
          color: hsl(var(--accent-foreground));
        }
      `}</style>
    </div>
  );
};

export default TurboRacer;
