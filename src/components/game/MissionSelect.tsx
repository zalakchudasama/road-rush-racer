import { useState } from "react";
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
  const [index, setIndex] = useState(0);

  // Unlock logic: mission 0 always unlocked, others need previous completed
  const isUnlocked = (i: number) => {
    if (i === 0) return true;
    return completedMissions.includes(MISSIONS[i - 1].id);
  };

  const m = MISSIONS[index];
  const unlocked = isUnlocked(index);
  const isCompleted = completedMissions.includes(m.id);

  const goLeft = () => {
    playClickSound();
    setIndex((prev) => (prev > 0 ? prev - 1 : MISSIONS.length - 1));
  };
  const goRight = () => {
    playClickSound();
    setIndex((prev) => (prev < MISSIONS.length - 1 ? prev + 1 : 0));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: "radial-gradient(ellipse at center, #0a0a1a 0%, #000000 70%)" }}
    >
      <div className="flex flex-col items-center w-full max-w-sm px-4">
        {onBack && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { playClickSound(); onBack(); }}
            className="self-start mb-4 w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold border-2 border-border text-foreground bg-card"
          >
            ←
          </motion.button>
        )}

        <div className="text-3xl mb-2">🎯</div>
        <h1 className="text-xl font-bold text-foreground mb-4 tracking-wider">SELECT MISSION</h1>

        {/* Carousel */}
        <div className="flex items-center gap-3 w-full">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={goLeft}
            className="w-10 h-10 rounded-full bg-card border-2 border-border text-foreground font-bold text-xl flex items-center justify-center shrink-0"
          >
            ‹
          </motion.button>

          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 aspect-square rounded-2xl border-2 bg-card flex flex-col items-center justify-center p-4 relative"
            style={{
              borderColor: isCompleted ? "#44dd44" : unlocked ? "hsl(var(--border))" : "#555",
              opacity: unlocked ? 1 : 0.5,
            }}
          >
            {isCompleted && (
              <div
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "#44dd44", color: "#000" }}
              >
                ✓
              </div>
            )}
            {!unlocked && (
              <div className="absolute top-2 right-2 text-2xl">🔒</div>
            )}

            <div className="text-4xl mb-2">{m.label.split(" ")[0]}</div>
            <div className="text-foreground font-bold text-sm mb-1">{m.label.slice(2)}</div>
            <div className="text-muted-foreground text-xs mb-1">
              🎯 Score: <span className="font-bold text-foreground">{m.target.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {index + 1} / {MISSIONS.length}
            </div>

            {unlocked && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { playClickSound(); onSelect(m); }}
                className="mt-3 px-6 py-2 rounded-lg font-bold text-xs text-primary-foreground tracking-wider"
                style={{ background: "linear-gradient(135deg, #ff4444, #ff8800)" }}
              >
                🚀 START
              </motion.button>
            )}
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={goRight}
            className="w-10 h-10 rounded-full bg-card border-2 border-border text-foreground font-bold text-xl flex items-center justify-center shrink-0"
          >
            ›
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MissionSelect;
