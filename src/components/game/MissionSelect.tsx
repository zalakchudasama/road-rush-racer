import { motion } from "framer-motion";

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

const MissionSelect = ({ onSelect, diamonds }: Props) => (
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
      <p className="text-muted-foreground text-xs mb-1">Complete the target score to win!</p>
      <p className="text-sm mb-4 font-mono">
        💎 <span style={{ color: "#00d4ff" }} className="font-bold">{diamonds}</span>
      </p>

      <div className="flex flex-col gap-3 mb-4">
        {MISSIONS.map((m) => (
          <motion.button
            key={m.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(m)}
            className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-card hover:border-primary transition-colors"
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
        ))}
      </div>

      <p className="text-muted-foreground text-[10px]">Win missions to earn diamonds & bonus coins!</p>
    </div>
  </motion.div>
);

export default MissionSelect;
