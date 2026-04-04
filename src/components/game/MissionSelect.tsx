import { motion } from "framer-motion";
import { getCompletedMissions } from "./cars";

export interface Mission {
  id: string;
  target: number;
  diamondBonus: number;
  coinBonus: number;
  label: string;
}

export const MISSIONS: Mission[] = [
  { id: "m1", target: 5000, diamondBonus: 20, coinBonus: 500, label: "🟢 Easy Run" },
  { id: "m2", target: 8000, diamondBonus: 20, coinBonus: 1000, label: "🟡 Street Heat" },
  { id: "m3", target: 12000, diamondBonus: 20, coinBonus: 2000, label: "🟠 Road Fury" },
  { id: "m4", target: 18000, diamondBonus: 20, coinBonus: 3500, label: "🔴 Turbo Legend" },
];



const playClickSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "square";
    gain.gain.value = 0.15;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
};

interface Props {
  onSelect: (mission: Mission) => void;
  diamonds: number;
}

const MissionSelect = ({ onSelect, diamonds }: Props) => {
  const completedMissions = getCompletedMissions();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: "radial-gradient(ellipse at center, #0a0a1a 0%, #000000 70%)" }}
    >
      <div
        className="bg-background/95 border-2 border-primary rounded-2xl px-8 py-6 text-center max-w-sm w-full"
        style={{ boxShadow: "0 0 40px rgba(255,50,50,0.3)" }}
      >
        <div className="text-4xl mb-2">🎯</div>
        <h1 className="text-2xl font-bold text-foreground mb-1 tracking-wider">SELECT MISSION</h1>
        <p className="text-muted-foreground text-xs mb-1">Tap START on a mission to begin</p>
        <p className="text-sm mb-4 font-mono">
          💎 <span style={{ color: "#00d4ff" }} className="font-bold">{diamonds}</span>
        </p>

        <div className="flex flex-col gap-3 mb-4">
          {MISSIONS.map((m, idx) => {
            const isCompleted = completedMissions.includes(m.id);
            return (
              <motion.div
                key={m.id}
                whileHover={{ scale: 1.03 }}
                className="flex items-center justify-between px-4 py-3 rounded-xl border-2 bg-card relative"
                style={{
                  borderColor: isCompleted ? "#44dd44" : "hsl(var(--border))",
                }}
              >
                <div className="text-left flex-1">
                  <div className="text-foreground font-bold text-sm flex items-center gap-2">
                    {m.label}
                    {isCompleted && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: "#44dd44", color: "#000" }}
                      >
                        ✅ COMPLETED
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    🎯 Score Required: <span className="font-bold text-foreground">{m.target.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs font-mono" style={{ color: "#00d4ff" }}>+{m.diamondBonus} 💎</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    playClickSound();
                    onSelect(m);
                  }}
                  className="ml-3 px-4 py-2 rounded-lg font-bold text-xs text-primary-foreground tracking-wider"
                  style={{ background: "linear-gradient(135deg, #ff4444, #ff8800)" }}
                >
                  🚀 START
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-muted-foreground text-[10px]">Win missions to earn diamonds & bonus score!</p>
      </div>
    </motion.div>
  );
};

export default MissionSelect;
