import { motion } from "framer-motion";
import { useState } from "react";

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
  diamonds: number;
}

const MissionSelect = ({ onSelect, diamonds }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);

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
        <p className="text-muted-foreground text-xs mb-1">Choose a mission, then press START</p>
        <p className="text-sm mb-4 font-mono">
          💎 <span style={{ color: "#00d4ff" }} className="font-bold">{diamonds}</span>
        </p>

        <div className="flex flex-col gap-3 mb-4">
          {MISSIONS.map((m) => (
            <div key={m.id} className="flex flex-col gap-1">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(m.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                  selected === m.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                <div className="text-left">
                  <div className="text-foreground font-bold text-sm">{m.label}</div>
                  <div className="text-muted-foreground text-xs">Target: {m.target.toLocaleString()} pts</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono" style={{ color: "#00d4ff" }}>+{m.diamondBonus} 💎</div>
                  <div className="text-xs font-mono" style={{ color: "#ffd700" }}>+{m.coinBonus} 💰</div>
                </div>
              </motion.button>
              {selected === m.id && (
                <motion.button
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(m)}
                  className="w-full py-2 rounded-xl font-bold text-sm text-primary-foreground tracking-wider"
                  style={{ background: "linear-gradient(135deg, #ff4444, #ff8800)" }}
                >
                  🚀 START
                </motion.button>
              )}
            </div>
          ))}
        </div>

        <p className="text-muted-foreground text-[10px]">Win missions to earn diamonds & bonus coins!</p>
      </div>
    </motion.div>
  );
};

export default MissionSelect;
