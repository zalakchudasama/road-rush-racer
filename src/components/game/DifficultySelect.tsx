import { motion } from "framer-motion";
import { playClickSound } from "./sounds";

export type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTIES: { id: Difficulty; label: string; logo: string; color: string; desc: string }[] = [
  { id: "easy", label: "EASY", logo: "🟢", color: "#22c55e", desc: "Chill ride" },
  { id: "medium", label: "MEDIUM", logo: "🟡", color: "#eab308", desc: "Balanced" },
  { id: "hard", label: "HARD", logo: "🔴", color: "#ef4444", desc: "Pro racer" },
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
          className="text-2xl font-extrabold tracking-[0.25em]"
          style={{
            background: "linear-gradient(135deg,#ff4444,#ff8800,#ffcc00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SELECT DIFFICULTY
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
              <div className="text-4xl mt-1">{d.logo}</div>
              <div className="text-center">
                <div className="font-extrabold text-sm tracking-widest text-white">{d.label}</div>
                <div className="text-[10px] text-white/60">{d.desc}</div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { playClickSound(); setDifficulty(d.id); onPlay(d.id); }}
                className="w-full py-1.5 rounded-lg font-bold text-xs tracking-widest text-white"
                style={{ background: d.color }}
              >
                ▶ PLAY
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DifficultySelect;