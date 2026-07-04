import { motion } from "framer-motion";
import { playClickSound } from "./sounds";
import type { ReactNode } from "react";

export type Difficulty = "easy" | "medium" | "hard";

const CircleIcon = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill={color} />
  </svg>
);

const WifiIcon = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const DIFFICULTIES: { id: Difficulty; label: string; logo: ReactNode; color: string }[] = [
  { id: "easy", label: "EASY", logo: <CircleIcon color="#22c55e" />, color: "#22c55e" },
  { id: "medium", label: "MULTIPLAYER", logo: <WifiIcon color="#eab308" />, color: "#eab308" },
  { id: "hard", label: "HARD", logo: <CircleIcon color="#ef4444" />, color: "#ef4444" },
];

export const getDifficulty = (): Difficulty =>
  (localStorage.getItem("tr_difficulty") as Difficulty) || "medium";

export const setDifficulty = (d: Difficulty) => localStorage.setItem("tr_difficulty", d);

export const DIFFICULTY_SPEED_MUL: Record<Difficulty, number> = {
  easy: 0.8,
  medium: 1,
  hard: 1.3,
};

interface Props {
  onPlay: (d: Difficulty) => void;
  onBack: () => void;
}

const DifficultySelect = ({ onPlay, onBack }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90"
    >
      <button
        onClick={() => { playClickSound(); onBack(); }}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full border-2 border-white/40 bg-black/60 text-white text-xl font-bold flex items-center justify-center"
      >
        ←
      </button>

      <div className="flex flex-col items-center gap-6 px-4 w-full max-w-md">
        <h2
          className="text-2xl sm:text-3xl font-extrabold tracking-[0.25em] whitespace-nowrap"
          style={{
            background: "linear-gradient(135deg,#ff4444,#ff8800,#ffcc00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SELECT MOOD
        </h2>

        <div className="grid grid-cols-3 gap-3 w-full">
          {DIFFICULTIES.map((d) => (
            <motion.div
              key={d.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              className="aspect-square rounded-2xl border-2 flex flex-col items-center justify-between p-3"
              style={{
                borderColor: d.color,
                background: `linear-gradient(160deg, ${d.color}33, rgba(0,0,0,0.7))`,
                boxShadow: `0 0 20px ${d.color}55`,
              }}
            >
              <div className="mt-1">{d.logo}</div>
              <div className="text-[9px] sm:text-[10px] font-extrabold tracking-wider text-white whitespace-nowrap">
                {d.label}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (d.id !== "easy") return;
                  playClickSound();
                  setDifficulty(d.id);
                  onPlay(d.id);
                }}
                disabled={d.id !== "easy"}
                className="w-full py-1.5 rounded-lg font-bold text-xs tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: d.color }}
              >
                {d.id === "easy" ? "▶ PLAY" : "🔒"}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DifficultySelect;
