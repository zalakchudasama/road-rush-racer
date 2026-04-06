import { motion } from "framer-motion";
import { getCompletedMissions } from "./cars";
import { playClickSound } from "./sounds";

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

interface Props {
  onSelect: (mission: Mission) => void;
  onBack?: () => void;
}

const MissionSelect = ({ onSelect, onBack }: Props) => {
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
        className="bg-background/95 border-2 border-primary rounded-2xl px-6 py-5 text-center max-w-sm w-full"
        style={{ boxShadow: "0 0 40px rgba(255,50,50,0.3)" }}
      >
        {onBack && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { playClickSound(); onBack(); }}
            className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold border-2 border-border text-foreground bg-card"
          >
            ←
          </motion.button>
        )}
        <div className="text-4xl mb-2">🎯</div>
        <h1 className="text-2xl font-bold text-foreground mb-1 tracking-wider">SELECT MISSION</h1>
        <p className="text-muted-foreground text-xs mb-4">Tap START on a mission to begin</p>

        <div className="flex flex-col gap-3 mb-4">
          {MISSIONS.map((m) => {
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
                {/* Completed tick - large and visible */}
                {isCompleted && (
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "#44dd44", color: "#000" }}
                  >
                    ✓
                  </div>
                )}
                <div className="text-left flex-1">
                  <div className="text-foreground font-bold text-sm">
                    {m.label}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    🎯 Score Required: <span className="font-bold text-foreground">{m.target.toLocaleString()}</span>
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
