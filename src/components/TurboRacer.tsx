import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeSelect from "./game/ThemeSelect";
import SplashScreen from "./game/SplashScreen";
import StartScreen from "./game/StartScreen";
import GameControls from "./game/GameControls";
import SettingsButton from "./game/SettingsButton";
import CustomizeInterface from "./game/CustomizeInterface";
import { ControlLayout, BtnLayout, loadLayout } from "./game/controlLayout";
import CarGarage from "./game/CarGarage";
import MissionSelect, { Mission, MISSIONS } from "./game/MissionSelect";
import DifficultySelect, { getDifficulty, DIFFICULTY_SPEED_MUL } from "./game/DifficultySelect";
import MultiplayerLobby from "./game/MultiplayerLobby";
import { THEMES, ThemeId, GameTheme } from "./game/themes";
import { CARS, CarData, getWallet, addToWallet, getSelectedCar, getDiamonds, addDiamonds, addCompletedMission, ABILITIES, getAbilityCharges, useAbilityCharge } from "./game/cars";
import { playClickSound, playCoinSound, playGhostSound } from "./game/sounds";

const GAME_WIDTH = 420;
const CAR_W = 50;
const CAR_H = 80;

type GameState = "splash" | "start" | "difficulty" | "lobby" | "mission" | "select" | "garage" | "playing" | "paused" | "won" | "lost";

interface Particle { x: number; y: number; size: number; speed: number }

// Fast racing music using Web Audio API
const createRacingMusic = (): { start: () => void; stop: () => void } => {
  let ctx: AudioContext | null = null;
  let nodes: OscillatorNode[] = [];
  let gains: GainNode[] = [];
  let intervalId: number | null = null;
  let started = false;

  return {
    start: () => {
      if (started) { try { ctx?.resume(); } catch {} return; }
      started = true;
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        try { ctx.resume(); } catch {}
        const master = ctx.createGain();
        master.gain.value = 0.25;
        master.connect(ctx.destination);

        // Engine drone - powerful low rumble
        const engine = ctx.createOscillator();
        const engineGain = ctx.createGain();
        engine.type = "sawtooth";
        engine.frequency.value = 80;
        engineGain.gain.value = 0.4;
        engine.connect(engineGain);
        engineGain.connect(master);
        engine.start();
        nodes.push(engine);
        gains.push(engineGain);

        // High-rev whine
        const rev = ctx.createOscillator();
        const revGain = ctx.createGain();
        rev.type = "square";
        rev.frequency.value = 220;
        revGain.gain.value = 0.15;
        rev.connect(revGain);
        revGain.connect(master);
        rev.start();
        nodes.push(rev);
        gains.push(revGain);

        // Turbo whistle
        const turbo = ctx.createOscillator();
        const turboGain = ctx.createGain();
        turbo.type = "sine";
        turbo.frequency.value = 440;
        turboGain.gain.value = 0.1;
        turbo.connect(turboGain);
        turboGain.connect(master);
        turbo.start();
        nodes.push(turbo);
        gains.push(turboGain);

        // Fast LFO for engine throb
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = "sine";
        lfo.frequency.value = 6;
        lfoGain.gain.value = 20;
        lfo.connect(lfoGain);
        lfoGain.connect(engine.frequency);
        lfoGain.connect(rev.frequency);
        lfo.start();
        nodes.push(lfo);

        // Rhythm pulse for intensity
        const pulse = ctx.createOscillator();
        const pulseGain = ctx.createGain();
        pulse.type = "square";
        pulse.frequency.value = 4;
        pulseGain.gain.value = 0.08;
        pulse.connect(pulseGain);
        pulseGain.connect(master);
        pulse.start();
        nodes.push(pulse);
        gains.push(pulseGain);

        // Rev variations
        let revUp = true;
        intervalId = window.setInterval(() => {
          if (!ctx) return;
          const t = ctx.currentTime;
          if (revUp) {
            engine.frequency.linearRampToValueAtTime(120, t + 0.8);
            rev.frequency.linearRampToValueAtTime(350, t + 0.8);
            turbo.frequency.linearRampToValueAtTime(600, t + 0.8);
          } else {
            engine.frequency.linearRampToValueAtTime(80, t + 0.8);
            rev.frequency.linearRampToValueAtTime(220, t + 0.8);
            turbo.frequency.linearRampToValueAtTime(440, t + 0.8);
          }
          revUp = !revUp;
        }, 1200);
      } catch {}
    },
    stop: () => {
      try {
        if (intervalId) clearInterval(intervalId);
        nodes.forEach(n => { try { n.stop(); } catch {} });
        if (ctx) ctx.close();
        nodes = [];
        gains = [];
        intervalId = null;
        ctx = null;
        started = false;
      } catch {}
    }
  };
};
interface GameCoin { x: number; y: number; value: number; color: string; label: string }
interface GameDiamond { x: number; y: number }
interface GameGhost { x: number; y: number; vy: number; vx: number; phase: number; screamed: boolean; vanishAt: number }
interface GhostWarning { x: number; y: number; spawnAt: number }
interface GameEnemy { x: number; y: number; vx?: number; flipped?: boolean; flipT?: number; flipVX?: number; flipVY?: number; flipRot?: number }

const COIN_TYPES = [
  { value: 50, color: "#cd7f32", label: "50", weight: 5 },
  { value: 100, color: "#c0c0c0", label: "100", weight: 3 },
  { value: 150, color: "#ffd700", label: "150", weight: 1 },
];

const randomCoinType = () => {
  const total = COIN_TYPES.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const ct of COIN_TYPES) {
    r -= ct.weight;
    if (r <= 0) return ct;
  }
  return COIN_TYPES[0];
};

const SENSITIVITY_SPEED = { 1: 4, 2: 5, 3: 7 } as Record<number, number>;

const getCarData = (): CarData => {
  const id = getSelectedCar();
  return CARS.find(c => c.id === id) || CARS[0];
};

interface AbilityButtonProps {
  car: CarData;
  charges: number;
  active: boolean;
  onActivate: () => void;
  onStop: () => void;
  layout?: BtnLayout;
}

const AbilityButton = ({ car, charges, active, onActivate, onStop, layout }: AbilityButtonProps) => {
  const ab = ABILITIES[car.ability];
  const disabled = charges <= 0 && !active;
  const size = layout?.size ?? 56;
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => (active ? onStop() : onActivate())}
      className="fixed z-50 rounded-full flex flex-col items-center justify-center border-2 font-bold"
      style={{
        ...(layout
          ? { left: layout.x, top: layout.y, width: size, height: size }
          : { left: 12, bottom: 30, width: 56, height: 56 }),
        borderColor: ab.color,
        background: disabled
          ? "rgba(20,20,20,0.7)"
          : `linear-gradient(135deg, ${ab.color}cc, ${ab.color}66)`,
        opacity: disabled ? 0.55 : 1,
        boxShadow: active ? `0 0 18px ${ab.color}` : "none",
        touchAction: "none",
      }}
      title={active ? `${ab.name} — tap to stop` : `${ab.name} — ${ab.description}`}
    >
      <span className="leading-none" style={{ fontSize: Math.max(14, size * 0.35) }}>{ab.emoji}</span>
      <span className="font-mono mt-0.5 text-white" style={{ fontSize: Math.max(8, size * 0.18) }}>
        {active ? "STOP" : `×${charges}`}
      </span>
    </motion.button>
  );
};

const TurboRacer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const racingMusicRef = useRef(createRacingMusic());
  const musicOnRef = useRef(false);
  const [gameState, setGameState] = useState<GameState>("splash");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [diamonds, setDiamonds_] = useState(0);
  const [theme, setTheme] = useState<GameTheme>(THEMES.rain);
  const [sensitivity, setSensitivity] = useState(2);
  const [controlLayout, setControlLayout] = useState<ControlLayout>(() => loadLayout());
  const [showCustomize, setShowCustomize] = useState(false);
  useEffect(() => {
    const onResize = () => setControlLayout(loadLayout());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const [lastScore, setLastScore] = useState(0);
  const [lastCoins, setLastCoins] = useState(0);
  const [totalWallet, setTotalWallet] = useState(getWallet);
  const [totalDiamonds, setTotalDiamonds] = useState(getDiamonds);
  const [currentCar, setCurrentCar] = useState<CarData>(getCarData);
  const [currentMission, setCurrentMission] = useState<Mission>(MISSIONS[0]);
  const [coinCollections, setCoinCollections] = useState<{ value: number; id: number }[]>([]);
  const coinIdRef = useRef(0);
  const boostActiveRef = useRef(false);
  const stateRef = useRef({
    running: false,
    score: 0,
    coins: 0,
    diamonds: 0,
    x: 185,
    y: 0,
    speed: 5,
    baseSpeed: 5,
    keys: {} as Record<string, boolean>,
    enemies: [] as GameEnemy[],
    coins_: [] as GameCoin[],
    diamonds_: [] as GameDiamond[],
    ghosts: [] as GameGhost[],
    nextGhostAt: 0,
    particles: [] as Particle[],
    lineOffset: 0,
    lampOffset: 0,
    rafId: 0,
    gameH: 700,
    theme: THEMES.rain as GameTheme,
    car: CARS[0] as CarData,
    targetScore: 20000,
    missionId: "m1",
    missionDiamondBonus: 20,
    missionCoinBonus: 0,
    // ability timers (absolute timestamps in ms; 0 = inactive)
    shieldUntil: 0,
    magnetUntil: 0,
    nitroUntil: 0,
    slowUntil: 0,
    ghostBustUntil: 0,
  });
  const [abilityCharges, setAbilityCharges] = useState(0);
  const [abilityActive, setAbilityActive] = useState(false);

  const drawCar3D = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isPlayer: boolean, facingDown?: boolean) => {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x + CAR_W / 2, y + CAR_H + 5, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(x, y, x + CAR_W, y + CAR_H);
    if (isPlayer) {
      const car = stateRef.current.car;
      grad.addColorStop(0, car.color1);
      grad.addColorStop(0.5, car.color2);
      grad.addColorStop(1, car.color3);
    } else {
      grad.addColorStop(0, color);
      grad.addColorStop(1, "#885500");
    }
    ctx.fillStyle = grad;
    roundRect(ctx, x + 5, y + 15, CAR_W - 10, CAR_H - 15, 6);
    ctx.fill();

    const roofGrad = ctx.createLinearGradient(x, y, x + CAR_W, y + 30);
    if (isPlayer) {
      const car = stateRef.current.car;
      roofGrad.addColorStop(0, car.color1);
      roofGrad.addColorStop(1, car.color2);
    } else {
      roofGrad.addColorStop(0, color);
      roofGrad.addColorStop(1, "#aa6600");
    }
    ctx.fillStyle = roofGrad;
    roundRect(ctx, x + 3, y, CAR_W - 6, 50, 10);
    ctx.fill();

    ctx.fillStyle = isPlayer ? "#00d4ff" : "#88ccff";
    ctx.globalAlpha = 0.8;
    roundRect(ctx, x + 10, y + 8, CAR_W - 20, 18, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#005577";
    ctx.globalAlpha = 0.6;
    roundRect(ctx, x + 12, y + 35, CAR_W - 24, 10, 3);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#222";
    roundRect(ctx, x - 2, y + 12, 8, 18, 3); ctx.fill();
    roundRect(ctx, x + CAR_W - 6, y + 12, 8, 18, 3); ctx.fill();
    roundRect(ctx, x - 2, y + CAR_H - 20, 8, 18, 3); ctx.fill();
    roundRect(ctx, x + CAR_W - 6, y + CAR_H - 20, 8, 18, 3); ctx.fill();

    ctx.fillStyle = "#666";
    ctx.fillRect(x, y + 16, 4, 10);
    ctx.fillRect(x + CAR_W - 4, y + 16, 4, 10);
    ctx.fillRect(x, y + CAR_H - 16, 4, 10);
    ctx.fillRect(x + CAR_W - 4, y + CAR_H - 16, 4, 10);

    if (isPlayer) {
      ctx.fillStyle = "#ffff00";
      ctx.beginPath(); ctx.ellipse(x + 10, y + 2, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + CAR_W - 10, y + 2, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = "#ff3333";
      ctx.beginPath(); ctx.ellipse(x + 10, y + CAR_H - 5, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + CAR_W - 10, y + CAR_H - 5, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  const drawStreetLight = (ctx: CanvasRenderingContext2D, x: number, y: number, side: "left" | "right", t: GameTheme) => {
    ctx.save();
    ctx.fillStyle = "#555";
    ctx.fillRect(x, y, 4, 60);
    const dir = side === "left" ? 1 : -1;
    ctx.fillRect(x, y, dir * 25, 3);
    ctx.fillStyle = t.lampColor;
    ctx.beginPath();
    ctx.ellipse(x + dir * 25, y + 2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.skyGlow;
    ctx.beginPath();
    ctx.moveTo(x + dir * 20, y + 6);
    ctx.lineTo(x + dir * 10, y + 80);
    ctx.lineTo(x + dir * 40, y + 80);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawCoin = (ctx: CanvasRenderingContext2D, x: number, y: number, coin: GameCoin) => {
    ctx.save();
    if (coin.value >= 150) {
      ctx.fillStyle = "rgba(255,215,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(x + 15, y + 15, 20, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = coin.color;
    ctx.beginPath();
    ctx.ellipse(x + 15, y + 15, 14, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x + 15, y + 15, 10, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(coin.label, x + 15, y + 18);
    ctx.restore();
  };

  const drawGhost = (ctx: CanvasRenderingContext2D, g: GameGhost) => {
    ctx.save();
    const cx = g.x;
    const cy = g.y;
    // outer aura
    const aura = ctx.createRadialGradient(cx, cy, 5, cx, cy, 50);
    aura.addColorStop(0, "rgba(180,255,255,0.45)");
    aura.addColorStop(1, "rgba(180,255,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.fill();

    // body
    ctx.fillStyle = "rgba(240,250,255,0.92)";
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 22, Math.PI, 0); // head dome
    // wavy bottom
    const baseY = cy + 22;
    ctx.lineTo(cx + 22, baseY);
    for (let i = 0; i < 5; i++) {
      const wx = cx + 22 - (i + 1) * (44 / 5);
      const wy = baseY + (i % 2 === 0 ? -6 : 6) + Math.sin(g.phase + i) * 2;
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(cx - 22, cy - 6);
    ctx.closePath();
    ctx.shadowColor = "rgba(120,220,255,0.9)";
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    // hollow black eyes
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(cx - 8, cy - 8, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 8, cy - 8, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    // gaping mouth
    ctx.beginPath(); ctx.ellipse(cx, cy + 6, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, s: typeof stateRef.current) => {
    const t = s.theme;
    const p = t.particles;
    ctx.save();
    for (const pt of s.particles) {
      pt.y += pt.speed;
      if (pt.y > s.gameH + 10) {
        pt.y = -10;
        pt.x = Math.random() * GAME_WIDTH;
      }
      ctx.fillStyle = p.color;
      if (p.type === "rain") {
        ctx.fillRect(pt.x, pt.y, 1.5, pt.size * 3);
      } else if (p.type === "snow") {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "ember") {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        pt.y -= pt.speed * 2;
        pt.x += (Math.random() - 0.5) * 2;
        if (pt.y < -10) { pt.y = s.gameH + 10; pt.x = Math.random() * GAME_WIDTH; }
      } else {
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        pt.x += Math.sin(pt.y * 0.02) * 1.5;
      }
    }
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

  const addCoinPopup = useCallback((value: number) => {
    playCoinSound();
    const id = ++coinIdRef.current;
    setCoinCollections(prev => [...prev.slice(-4), { value, id }]);
    setTimeout(() => {
      setCoinCollections(prev => prev.filter(c => c.id !== id));
    }, 1200);
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!s.running || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const t = s.theme;

    ctx.clearRect(0, 0, W, H);

    const roadGrad = ctx.createLinearGradient(0, 0, W, 0);
    roadGrad.addColorStop(0, t.road.top);
    roadGrad.addColorStop(0.5, t.road.mid);
    roadGrad.addColorStop(1, t.road.bot);
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = t.skyGlow;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = t.edgeColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 15]);
    ctx.lineDashOffset = -s.lineOffset;
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(8, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 8, 0); ctx.lineTo(W - 8, H); ctx.stroke();
    ctx.setLineDash([]);

    s.lineOffset += s.speed;
    if (s.lineOffset > 150) s.lineOffset -= 150;
    ctx.strokeStyle = t.lineColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([60, 90]);
    ctx.lineDashOffset = -s.lineOffset;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);

    s.lampOffset += s.speed;
    if (s.lampOffset > 250) s.lampOffset -= 250;
    for (let i = -1; i < 5; i++) {
      const ly = i * 250 + s.lampOffset;
      drawStreetLight(ctx, 15, ly, "left", t);
      drawStreetLight(ctx, W - 19, ly, "right", t);
    }

    drawParticles(ctx, s);

    for (const c of s.coins_) {
      c.y += s.speed;
      if (boxCollide(s.x, s.y, CAR_W, CAR_H, c.x, c.y, 30, 30)) {
        s.coins++;
        s.score += c.value;
        addCoinPopup(c.value);
        const newType = randomCoinType();
        c.y = -300 - Math.random() * 300;
        c.x = 30 + Math.random() * (GAME_WIDTH - 90);
        c.value = newType.value;
        c.color = newType.color;
        c.label = newType.label;
      }
      if (c.y > H + 30) {
        const newType = randomCoinType();
        c.y = -300 - Math.random() * 200;
        c.x = 30 + Math.random() * (GAME_WIDTH - 90);
        c.value = newType.value;
        c.color = newType.color;
        c.label = newType.label;
      }
      drawCoin(ctx, c.x, c.y, c);
    }

    // Diamond collectibles
    for (const d of s.diamonds_) {
      d.y += s.speed;
      if (boxCollide(s.x, s.y, CAR_W, CAR_H, d.x, d.y, 24, 24)) {
        s.diamonds++;
        addCoinPopup(-1); // -1 signals diamond
        d.y = -600 - Math.random() * 800;
        d.x = 30 + Math.random() * (GAME_WIDTH - 90);
      }
      if (d.y > H + 30) {
        d.y = -600 - Math.random() * 400;
        d.x = 30 + Math.random() * (GAME_WIDTH - 90);
      }
      // Draw diamond
      ctx.save();
      ctx.fillStyle = "rgba(0,212,255,0.2)";
      ctx.beginPath();
      ctx.ellipse(d.x + 12, d.y + 12, 16, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#00d4ff";
      ctx.beginPath();
      ctx.moveTo(d.x + 12, d.y);
      ctx.lineTo(d.x + 24, d.y + 10);
      ctx.lineTo(d.x + 12, d.y + 24);
      ctx.lineTo(d.x, d.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.moveTo(d.x + 12, d.y + 3);
      ctx.lineTo(d.x + 20, d.y + 10);
      ctx.lineTo(d.x + 12, d.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Mission-specific enemy car color palettes
    const MISSION_CAR_COLORS: Record<string, string[]> = {
      m1: ["#888888", "#555555", "#aaaaaa", "#666666", "#999999"], // grey tones (parked)
      m2: ["#00cc66", "#0099ff", "#cc00ff", "#ff6600", "#ffcc00"], // colorful oncoming
      m3: ["#ff0066", "#9900ff", "#00ffcc", "#ff3300", "#6600cc"], // neon
      m4: ["#ff0000", "#ff4400", "#cc0000", "#ff6600", "#dd2200"], // aggressive reds
    };
    const missionColors = MISSION_CAR_COLORS[s.missionId] || MISSION_CAR_COLORS.m3;

    const nowAbility = performance.now();
    const slowMul = nowAbility < s.slowUntil ? 0.35 : 1;
    const shieldOn = nowAbility < s.shieldUntil;
    const ghostBustOn = nowAbility < s.ghostBustUntil;
    const magnetOn = nowAbility < s.magnetUntil;

    for (let ei = 0; ei < s.enemies.length; ei++) {
      const e = s.enemies[ei];
      const enemyColor = missionColors[ei % missionColors.length];
      let isFacingDown = false;

      // Flipped enemies (knocked by boss car) fly away with their own physics
      if (e.flipped) {
        e.x += e.flipVX || 0;
        e.y += e.flipVY || 0;
        e.flipT = (e.flipT || 0) + 1;
        e.flipRot = (e.flipRot || 0) + 0.18;
        // respawn after flying off-screen
        if (e.flipT > 90 || e.x < -120 || e.x > GAME_WIDTH + 120 || e.y < -200 || e.y > H + 200) {
          e.flipped = false;
          e.flipT = 0;
          e.x = 20 + Math.random() * (GAME_WIDTH - 90);
          e.y = -CAR_H - 100 - Math.random() * 400;
          e.vx = undefined;
        }
        ctx.save();
        ctx.translate(e.x + CAR_W / 2, e.y + CAR_H / 2);
        ctx.rotate(Math.PI + (e.flipRot || 0));
        drawCar3D(ctx, -CAR_W / 2, -CAR_H / 2, enemyColor, false, isFacingDown);
        ctx.restore();
        continue;
      }

      if (s.missionId === "m2") {
        // Mission 2: cars move top to bottom (coming towards player)
        e.y += s.speed * 0.8 * slowMul;
        isFacingDown = true;
        if (e.y > H + CAR_H + 100) {
          e.y = -CAR_H - 100 - Math.random() * 300;
          e.x = 20 + Math.random() * (GAME_WIDTH - 90);
        }
      } else if (s.missionId === "m4") {
        // Mission 4: cars come from all directions
        const dir = ei % 4;
        if (dir === 0) { // top to bottom
          e.y += s.speed * 0.9 * slowMul;
          isFacingDown = true;
          if (e.y > H + CAR_H + 100) { e.y = -CAR_H - 200 - Math.random() * 300; e.x = 20 + Math.random() * (GAME_WIDTH - 90); }
        } else if (dir === 1) { // bottom to top
          e.y -= s.speed * 0.7 * slowMul;
          if (e.y < -CAR_H - 100) { e.y = H + 100 + Math.random() * 300; e.x = 20 + Math.random() * (GAME_WIDTH - 90); }
        } else if (dir === 2) { // left to right
          (e as any).vx = (e as any).vx || s.speed * 0.6;
          e.x += (e as any).vx * slowMul;
          e.y += s.speed * 0.3 * slowMul;
          isFacingDown = true;
          if (e.x > GAME_WIDTH + 50) { e.x = -CAR_W - 50; e.y = Math.random() * H; }
          if (e.y > H + 100) { e.y = -CAR_H - 100; }
        } else { // right to left
          (e as any).vx = (e as any).vx || -(s.speed * 0.6);
          e.x += (e as any).vx * slowMul;
          e.y += s.speed * 0.3 * slowMul;
          isFacingDown = true;
          if (e.x < -CAR_W - 50) { e.x = GAME_WIDTH + 50; e.y = Math.random() * H; }
          if (e.y > H + 100) { e.y = -CAR_H - 100; }
        }
      } else if (s.missionId !== "m1") {
        // Other missions: cars move bottom to top
        e.y -= s.speed * 0.6 * slowMul;
        if (e.y < -CAR_H - 100) {
          e.y = H + 100 + Math.random() * 300;
          e.x = 20 + Math.random() * (GAME_WIDTH - 90);
        }
      }
      drawCar3D(ctx, e.x, e.y, enemyColor, false, isFacingDown);
      if (boxCollide(s.x, s.y, CAR_W, CAR_H, e.x, e.y, CAR_W, CAR_H)) {
        // Boss-tier car (last in CARS) flips enemies on contact instead of crashing
        if (s.car.id === CARS[CARS.length - 1].id) {
          e.flipped = true;
          e.flipT = 0;
          e.flipRot = 0;
          const dx = (e.x + CAR_W / 2) - (s.x + CAR_W / 2);
          e.flipVX = (dx >= 0 ? 1 : -1) * (5 + Math.random() * 3);
          e.flipVY = -7 - Math.random() * 3;
          // small impact flash
          ctx.fillStyle = "rgba(255,220,80,0.7)";
          ctx.beginPath();
          ctx.ellipse(e.x + CAR_W / 2, e.y + CAR_H / 2, 28, 28, 0, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        // Shield ability: bounce enemy away, no crash
        if (shieldOn) {
          e.flipped = true;
          e.flipT = 0;
          e.flipRot = 0;
          const dx = (e.x + CAR_W / 2) - (s.x + CAR_W / 2);
          e.flipVX = (dx >= 0 ? 1 : -1) * (5 + Math.random() * 3);
          e.flipVY = -6 - Math.random() * 3;
          ctx.fillStyle = "rgba(0,212,255,0.55)";
          ctx.beginPath();
          ctx.ellipse(s.x + CAR_W / 2, s.y + CAR_H / 2, 50, 50, 0, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        ctx.fillStyle = "rgba(255,100,0,0.6)";
        ctx.beginPath();
        ctx.ellipse(s.x + CAR_W / 2, s.y + CAR_H / 2, 50, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        s.running = false;
        racingMusicRef.current.stop();
        addDiamonds(s.diamonds);
        setTotalWallet(getWallet());
        setTotalDiamonds(getDiamonds());
        setLastScore(s.score);
        setLastCoins(s.coins);
        setScore(s.score);
        setCoins(s.coins);
        setDiamonds_(s.diamonds);
        setGameState("lost");
        return;
      }
    }

    // Prevent enemy-vs-enemy overlap: push apart on Y if two normal enemies collide
    for (let i = 0; i < s.enemies.length; i++) {
      const a = s.enemies[i];
      if (a.flipped) continue;
      for (let j = i + 1; j < s.enemies.length; j++) {
        const b = s.enemies[j];
        if (b.flipped) continue;
        if (boxCollide(a.x, a.y, CAR_W, CAR_H, b.x, b.y, CAR_W, CAR_H)) {
          const overlapY = (CAR_H) - Math.abs(a.y - b.y);
          if (a.y < b.y) { a.y -= overlapY / 2 + 1; b.y += overlapY / 2 + 1; }
          else { a.y += overlapY / 2 + 1; b.y -= overlapY / 2 + 1; }
          // nudge X slightly apart if in same lane
          if (Math.abs(a.x - b.x) < CAR_W * 0.6) {
            if (a.x < b.x) { a.x = Math.max(15, a.x - 4); b.x = Math.min(GAME_WIDTH - CAR_W - 15, b.x + 4); }
            else { a.x = Math.min(GAME_WIDTH - CAR_W - 15, a.x + 4); b.x = Math.max(15, b.x - 4); }
          }
        }
      }
    }

    // Ghosts: spawn periodically from below the road and rise up toward the player
    const now = performance.now();
    // Ghost-buster: instantly clear all on activation window
    if (ghostBustOn && s.ghosts.length > 0) {
      s.ghosts.length = 0;
    }
    if (now >= s.nextGhostAt) {
      s.ghosts.push({
        x: 40 + Math.random() * (GAME_WIDTH - 80),
        y: H + 60,
        vy: -2.2 - Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 1.2,
        phase: Math.random() * Math.PI * 2,
        screamed: false,
      });
      s.nextGhostAt = now + 6000 + Math.random() * 5000;
    }
    for (let gi = s.ghosts.length - 1; gi >= 0; gi--) {
      const g = s.ghosts[gi];
      g.y += g.vy;
      g.x += g.vx;
      g.phase += 0.2;
      // play horror sound the first time it becomes visible on screen
      if (!g.screamed && g.y < H - 20) {
        playGhostSound();
        g.screamed = true;
      }
      // collide with player → instant game over
      if (boxCollide(s.x, s.y, CAR_W, CAR_H, g.x - 22, g.y - 22, 44, 50)) {
        // Shield / Ghost-buster makes the ghost vanish instead of crashing
        if (shieldOn || ghostBustOn) {
          ctx.fillStyle = "rgba(180,255,255,0.55)";
          ctx.beginPath();
          ctx.ellipse(g.x, g.y, 36, 36, 0, 0, Math.PI * 2);
          ctx.fill();
          s.ghosts.splice(gi, 1);
          continue;
        }
        ctx.fillStyle = "rgba(0,200,255,0.5)";
        ctx.fillRect(0, 0, W, H);
        s.running = false;
        racingMusicRef.current.stop();
        addDiamonds(s.diamonds);
        setTotalWallet(getWallet());
        setTotalDiamonds(getDiamonds());
        setLastScore(s.score);
        setLastCoins(s.coins);
        setScore(s.score);
        setCoins(s.coins);
        setDiamonds_(s.diamonds);
        setGameState("lost");
        return;
      }
      drawGhost(ctx, g);
      if (g.y < -80) s.ghosts.splice(gi, 1);
      // Ability protections from ghost collisions handled in collide block above
    }

    // Background racing music ONLY plays while a ghost is visible on screen
    const ghostVisible = s.ghosts.some(g => g.y < H && g.y > -60);
    if (ghostVisible && !musicOnRef.current) {
      musicOnRef.current = true;
      racingMusicRef.current.start();
    } else if (!ghostVisible && musicOnRef.current) {
      musicOnRef.current = false;
      racingMusicRef.current.stop();
    }

    // Magnet: pull coins toward the player
    if (magnetOn) {
      for (const c of s.coins_) {
        const cx = c.x + 15, cy = c.y + 15;
        const px = s.x + CAR_W / 2, py = s.y + CAR_H / 2;
        const dx = px - cx, dy = py - cy;
        const d = Math.hypot(dx, dy);
        if (d < 220 && d > 1) {
          const pull = 4.5;
          c.x += (dx / d) * pull;
          c.y += (dy / d) * pull;
        }
      }
    }

    // Player aura for active abilities
    if (shieldOn || magnetOn || nowAbility < s.nitroUntil || nowAbility < s.slowUntil || ghostBustOn) {
      const auraColor = shieldOn
        ? "rgba(0,212,255,0.55)"
        : nowAbility < s.nitroUntil
          ? "rgba(255,120,0,0.55)"
          : magnetOn
            ? "rgba(255,215,0,0.45)"
            : nowAbility < s.slowUntil
              ? "rgba(170,102,255,0.45)"
              : "rgba(255,255,255,0.45)";
      ctx.save();
      const pulse = 1 + Math.sin(nowAbility / 80) * 0.08;
      const grad = ctx.createRadialGradient(
        s.x + CAR_W / 2, s.y + CAR_H / 2, 10,
        s.x + CAR_W / 2, s.y + CAR_H / 2, 60 * pulse,
      );
      grad.addColorStop(0, auraColor);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x + CAR_W / 2, s.y + CAR_H / 2, 60 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawCar3D(ctx, s.x, s.y, "#ff0000", true);

    const moveSpeed = s.speed;
    if (s.keys.ArrowLeft && s.x > 15) s.x -= moveSpeed;
    if (s.keys.ArrowRight && s.x < GAME_WIDTH - CAR_W - 15) s.x += moveSpeed;
    if (s.keys.ArrowUp && s.y > 0) s.y -= moveSpeed;
    if (s.keys.ArrowDown && s.y < H - CAR_H) s.y += moveSpeed;

    const isBoost = boostActiveRef.current;
    const nitroOn = performance.now() < s.nitroUntil;
    const mult = nitroOn ? 3.2 : isBoost ? 2.5 : 1;
    s.score += nitroOn ? 4 : isBoost ? 3 : 1;
    s.speed = (s.baseSpeed + s.car.speed + Math.floor(s.score / 2000)) * mult;

    if (s.score % 10 === 0) {
      setScore(s.score);
      setCoins(s.coins);
      setDiamonds_(s.diamonds);
    }

    if (s.score >= s.targetScore) {
      s.running = false;
      racingMusicRef.current.stop();
      addToWallet(s.coins * 10 + Math.floor(s.score / 10) + s.missionCoinBonus);
      addDiamonds(s.diamonds + s.missionDiamondBonus);
      setTotalWallet(getWallet());
      setTotalDiamonds(getDiamonds());
      setLastScore(s.score);
      setLastCoins(s.coins);
      addCompletedMission(s.missionId);
      setGameState("won");
      return;
    }

    s.rafId = requestAnimationFrame(loop);
  }, [addCoinPopup]);

  const startGame = useCallback((themeId: ThemeId) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectedTheme = THEMES[themeId];
    s.theme = selectedTheme;
    s.car = getCarData();
    setCurrentCar(s.car);
    setTheme(selectedTheme);

    canvas.width = GAME_WIDTH;
    canvas.height = window.innerHeight;
    s.gameH = window.innerHeight;

    cancelAnimationFrame(s.rafId);
    s.score = 0;
    s.coins = 0;
    s.diamonds = 0;
    s.x = 185;
    s.y = canvas.height - 150;
    s.baseSpeed = (SENSITIVITY_SPEED[sensitivity] || 5) * (DIFFICULTY_SPEED_MUL[getDifficulty()] || 1);
    s.speed = s.baseSpeed + s.car.speed;
    s.lineOffset = 0;
    s.lampOffset = 0;
    s.enemies = [];
    s.coins_ = [];
    s.diamonds_ = [];
    s.particles = [];
    s.ghosts = [];
    s.nextGhostAt = performance.now() + 4000 + Math.random() * 3000;
    s.shieldUntil = 0;
    s.magnetUntil = 0;
    s.nitroUntil = 0;
    s.slowUntil = 0;
    s.ghostBustUntil = 0;
    setAbilityCharges(getAbilityCharges(s.car.id));
    setAbilityActive(false);

     const enemyCount = s.missionId === "m1" ? 15 : s.missionId === "m4" ? 8 : 3;
     for (let i = 0; i < enemyCount; i++) {
       const randomX = 20 + Math.random() * (GAME_WIDTH - 90);
       let randomY: number;
       if (s.missionId === "m1") {
         randomY = -(Math.random() * 3000 + 200);
       } else if (s.missionId === "m4") {
         // Spread around all sides
         randomY = i % 2 === 0 ? -(Math.random() * 500 + 100) : canvas.height + 100 + Math.random() * 300;
       } else {
         randomY = canvas.height + 100 + i * 250;
       }
       s.enemies.push({ x: randomX, y: randomY });
     }
    for (let i = 0; i < 4; i++) {
      const ct = randomCoinType();
      s.coins_.push({
        x: 30 + Math.random() * (GAME_WIDTH - 90),
        y: (i + 1) * -350,
        value: ct.value,
        color: ct.color,
        label: ct.label,
      });
    }
    // Spawn 2 diamonds on the road
    for (let i = 0; i < 2; i++) {
      s.diamonds_.push({
        x: 30 + Math.random() * (GAME_WIDTH - 90),
        y: -500 - (i + 1) * 600,
      });
    }
    const pc = selectedTheme.particles;
    for (let i = 0; i < pc.count; i++) {
      s.particles.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * window.innerHeight,
        size: 1 + Math.random() * 3,
        speed: pc.speed * (0.5 + Math.random()),
      });
    }

    s.running = true;
    setGameState("playing");
    setScore(0);
    setCoins(0);
    setDiamonds_(0);
    setCoinCollections([]);
    // Music starts inside the loop only when a ghost is on screen
    musicOnRef.current = false;
    s.rafId = requestAnimationFrame(loop);
  }, [loop, sensitivity]);

  useEffect(() => {
    stateRef.current.baseSpeed = SENSITIVITY_SPEED[sensitivity] || 5;
  }, [sensitivity]);

  // Mobile: resume/pause music with tab visibility so it doesn't die silently
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        // If ghost is still on screen when tab returns, ensure music resumes
        if (musicOnRef.current) {
          try { racingMusicRef.current.start(); } catch {}
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

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
    if (!canvas) return;
    canvas.width = GAME_WIDTH;
    canvas.height = window.innerHeight;
  }, []);

  const refreshCar = () => {
    setCurrentCar(getCarData());
    setTotalWallet(getWallet());
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative select-none">
      {/* HUD */}
      {gameState === "playing" && (
        <>
          <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
            <div className="bg-background/80 px-2 py-1 rounded-md border border-primary/30 flex items-center gap-1">
              <span>🏁</span>
              <span className="text-primary font-bold text-sm font-mono">{score}</span>
            </div>
            <div className="bg-background/80 px-2 py-1 rounded-md border border-accent/30 flex items-center gap-1">
              <span>💰</span>
              <span className="font-bold text-sm font-mono" style={{ color: "#ffd700" }}>{coins}</span>
            </div>
            <div className="bg-background/80 px-2 py-1 rounded-md border flex items-center gap-1" style={{ borderColor: "rgba(0,212,255,0.3)" }}>
              <span>💎</span>
              <span className="font-bold text-sm font-mono" style={{ color: "#00d4ff" }}>{diamonds}</span>
            </div>
          </div>

          {/* Progress bar moved below pause/settings */}
          <div className="fixed top-28 right-4 z-50 w-28">
            <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                animate={{ width: `${Math.min(100, (score / currentMission.target) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Pause Button - top right */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              playClickSound();
              stateRef.current.running = false;
              racingMusicRef.current.stop();
              setGameState("paused");
            }}
            className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-background/80 border-2 border-primary/50 flex items-center justify-center text-lg"
          >
            ⏸️
          </motion.button>

          <SettingsButton
            sensitivity={sensitivity}
            onSensitivityChange={setSensitivity}
            onCustomize={() => setShowCustomize(true)}
          />

          <AbilityButton
            car={currentCar}
            charges={abilityCharges}
            active={abilityActive}
            layout={controlLayout.ability}
            onActivate={() => {
              const ab = ABILITIES[currentCar.ability];
              if (abilityCharges <= 0 || abilityActive) return;
              if (!useAbilityCharge(currentCar.id)) return;
              playClickSound();
              const s = stateRef.current;
              // Ability stays active until the player loses the game
              const until = Number.POSITIVE_INFINITY;
              if (ab.id === "shield") s.shieldUntil = until;
              else if (ab.id === "magnet") s.magnetUntil = until;
              else if (ab.id === "nitro") s.nitroUntil = until;
              else if (ab.id === "slow") s.slowUntil = until;
              else if (ab.id === "ghostbust") { s.ghostBustUntil = until; s.ghosts.length = 0; }
              setAbilityCharges(getAbilityCharges(currentCar.id));
              setAbilityActive(true);
            }}
            onStop={() => {
              playClickSound();
              const s = stateRef.current;
              s.shieldUntil = 0;
              s.magnetUntil = 0;
              s.nitroUntil = 0;
              s.slowUntil = 0;
              s.ghostBustUntil = 0;
              setAbilityActive(false);
            }}
          />

          {/* Coin collection popups */}
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1">
            <AnimatePresence>
              {coinCollections.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.5 }}
                  className="font-bold text-lg font-mono"
                  style={{ color: c.value === -1 ? "#00d4ff" : c.value >= 150 ? "#ffd700" : c.value >= 100 ? "#c0c0c0" : "#cd7f32" }}
                >
                  {c.value === -1 ? "+1 💎" : `+${c.value} 💰`}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      <canvas
        ref={canvasRef}
        className="block border-l-4 border-r-4 border-primary/60"
        style={{ height: "100vh", imageRendering: "auto" }}
      />

      {/* Controls */}
      {(gameState === "playing" || gameState === "paused") && (
        <GameControls
          sensitivity={sensitivity}
          layout={controlLayout}
          onControl={(dir) => {
            const s = stateRef.current;
            s.keys.ArrowLeft = dir.left;
            s.keys.ArrowRight = dir.right;
            s.keys.ArrowUp = dir.up;
            s.keys.ArrowDown = dir.down;
          }}
          onBoost={(active) => {
            boostActiveRef.current = active;
          }}
        />
      )}

      {showCustomize && (
        <CustomizeInterface
          initial={controlLayout}
          onSave={(l) => { setControlLayout(l); setShowCustomize(false); }}
          onCancel={() => setShowCustomize(false)}
        />
      )}

      {/* Developer Credit */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
        <p className="text-[10px] sm:text-xs font-mono tracking-widest bg-background/50 px-3 py-1 rounded-full border border-orange-500/30 backdrop-blur-sm whitespace-nowrap" style={{ color: 'rgba(200,160,100,0.7)' }}>
          Developed by{" "}
          <span
            className="font-extrabold text-sm"
            style={{
              background: "linear-gradient(135deg, #ffd700, #ff8c00, #ff4500, #ffd700)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Zalak Chudasama
          </span>
        </p>
      </div>

      <AnimatePresence>
        {gameState === "splash" && (
          <SplashScreen onComplete={() => setGameState("start")} />
        )}

        {gameState === "start" && (
          <StartScreen onStart={() => setGameState("difficulty")} />
        )}

        {gameState === "difficulty" && (
          <DifficultySelect
            onPlay={(d) => {
              if (d === "medium") setGameState("lobby");
              else setGameState("garage");
            }}
            onBack={() => setGameState("start")}
          />
        )}

        {gameState === "lobby" && (
          <MultiplayerLobby
            onStart={({ themeId }) => {
              refreshCar();
              const m = MISSIONS[0];
              setCurrentMission(m);
              stateRef.current.targetScore = m.target;
              stateRef.current.missionId = m.id;
              stateRef.current.missionDiamondBonus = m.diamondBonus;
              stateRef.current.missionCoinBonus = m.coinBonus;
              startGame(themeId);
            }}
            onBack={() => setGameState("difficulty")}
          />
        )}

        {gameState === "garage" && (
          <CarGarage
            onBack={() => setGameState("start")}
            onCarChanged={refreshCar}
            onNext={() => { playClickSound(); setGameState("mission"); }}
          />
        )}

        {gameState === "mission" && (
          <MissionSelect
            onSelect={(m) => {
              setCurrentMission(m);
              stateRef.current.targetScore = m.target;
              stateRef.current.missionId = m.id;
              stateRef.current.missionDiamondBonus = m.diamondBonus;
              stateRef.current.missionCoinBonus = m.coinBonus;
              refreshCar();
              setGameState("select");
            }}
            onBack={() => { playClickSound(); setGameState("garage"); }}
          />
        )}

        {gameState === "select" && (
          <ThemeSelect
            onSelect={(id) => startGame(id)}
            onBack={() => { playClickSound(); setGameState("mission"); }}
          />
        )}

        {gameState === "paused" && (
          <motion.div
            key="paused"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-40"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-background/95 border-2 border-primary rounded-2xl px-8 py-6 text-center max-w-xs"
              style={{ boxShadow: "0 0 40px rgba(255,150,0,0.3)" }}
            >
              <div className="text-5xl mb-3">⏸️</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">PAUSED</h2>
              <p className="text-muted-foreground text-sm mb-1">Score: <span className="text-primary font-bold">{score.toLocaleString()}</span></p>
              <p className="text-muted-foreground text-sm mb-4">💰 Coins: <span className="font-bold" style={{ color: "#ffd700" }}>{coins}</span></p>
              <div className="flex gap-2 justify-center flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-primary-foreground"
                  style={{ background: "linear-gradient(135deg, #44dd44, #22aa22)" }}
                  onClick={() => {
                    playClickSound();
                    stateRef.current.running = true;
                    setGameState("playing");
                    stateRef.current.rafId = requestAnimationFrame(loop);
                  }}
                >
                  ▶️ RESUME
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-border text-foreground"
                  onClick={() => {
                    playClickSound();
                    stateRef.current.running = false;
                    setGameState("mission");
                  }}
                >
                  🚪 QUIT
                </motion.button>
              </div>
            </motion.div>
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
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="bg-background/95 border-2 border-accent rounded-2xl px-8 py-6 text-center max-w-xs"
              style={{ boxShadow: "0 0 40px rgba(255,200,0,0.3)" }}
            >
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-accent mb-2">MISSION COMPLETE!</h2>
              <p className="text-foreground text-sm mb-1">🎯 {currentMission.label}</p>
              <p className="text-foreground text-base mb-1">Score: <span className="font-bold text-primary">{score.toLocaleString()}</span></p>
              <p className="text-foreground mb-1">Coins earned: <span className="font-bold" style={{ color: "#ffd700" }}>{(coins * 10 + Math.floor(score / 10) + currentMission.coinBonus).toLocaleString()}</span> 💰</p>
              <p className="text-foreground mb-1">Bonus: <span className="font-bold" style={{ color: "#00d4ff" }}>+{currentMission.diamondBonus + diamonds} 💎</span></p>
              <p className="text-muted-foreground text-xs mb-3">Wallet: 💰 {totalWallet.toLocaleString()} | 💎 {totalDiamonds}</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-primary-foreground"
                  style={{ background: "linear-gradient(135deg, hsl(var(--accent)), #ffaa00)" }}
                  onClick={() => { playClickSound(); startGame(theme.id); }}
                >
                  🔄 PLAY AGAIN
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm border-2 border-border text-foreground"
                  onClick={() => { playClickSound(); setGameState("mission"); }}
                >
                  🗺️ MISSIONS
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState === "lost" && (
          <motion.div
            key="lose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-end pb-16 z-40"
          >
            <motion.div
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="bg-background/95 border-2 border-destructive rounded-2xl px-8 py-6 text-center max-w-xs w-full"
              style={{ boxShadow: "0 0 40px rgba(255,50,50,0.3)" }}
            >
              <motion.div
                className="text-5xl mb-3"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: 2, duration: 0.3 }}
              >
                💥
              </motion.div>
              <h2 className="text-2xl font-bold text-destructive mb-2">GAME OVER</h2>
              <p className="text-foreground text-base mb-1">Score: <span className="font-bold text-primary">{score.toLocaleString()}</span></p>
              <p className="text-foreground mb-1">Coins earned: <span className="font-bold" style={{ color: "#ffd700" }}>{(coins * 10 + Math.floor(score / 10)).toLocaleString()}</span> 💰</p>
              <p className="text-muted-foreground text-xs mb-3">Wallet: 💰 {totalWallet.toLocaleString()}</p>
              <div className="flex flex-col gap-2 mt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm border-2 border-border text-foreground"
                  onClick={() => { playClickSound(); setGameState("mission"); }}
                >
                  🗺️ MISSIONS
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-4 py-3 rounded-xl font-bold text-sm text-primary-foreground"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), #ff6644)" }}
                  onClick={() => { playClickSound(); startGame(theme.id); }}
                >
                  🔄 TRY AGAIN
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TurboRacer;
