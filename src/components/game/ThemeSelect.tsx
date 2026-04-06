import { useState } from "react";
import { motion } from "framer-motion";
import { THEMES, ThemeId } from "./themes";
import { playClickSound } from "./sounds";

interface Props {
  onSelect: (id: ThemeId) => void;
  onBack?: () => void;
}

const themeList: ThemeId[] = ["rain", "lava", "ice", "desert"];

const ThemeSelect = ({ onSelect, onBack }: Props) => {
  const [index, setIndex] = useState(0);
  const id = themeList[index];
  const t = THEMES[id];

  const goLeft = () => {
    playClickSound();
    setIndex((prev) => (prev > 0 ? prev - 1 : themeList.length - 1));
  };
  const goRight = () => {
    playClickSound();
    setIndex((prev) => (prev < themeList.length - 1 ? prev + 1 : 0));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50"
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

        <div className="text-3xl mb-2">🛣️</div>
        <h1 className="text-xl font-bold text-foreground mb-4 tracking-wider">SELECT ROAD</h1>

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
            key={id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 aspect-square rounded-2xl border-2 border-border bg-card flex flex-col items-center justify-center p-4"
          >
            <span className="text-5xl mb-3">{t.emoji}</span>
            <span className="text-foreground font-bold text-sm tracking-wider mb-1">{t.name}</span>
            <span className="text-muted-foreground text-xs mb-1">{t.description}</span>
            <div className="text-[10px] text-muted-foreground mb-3">
              {index + 1} / {themeList.length}
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { playClickSound(); onSelect(id); }}
              className="px-6 py-2 rounded-lg font-bold text-xs text-primary-foreground tracking-wider"
              style={{ background: "linear-gradient(135deg, #44dd44, #22aa22)" }}
            >
              ▶️ PLAY
            </motion.button>
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={goRight}
            className="w-10 h-10 rounded-full bg-card border-2 border-border text-foreground font-bold text-xl flex items-center justify-center shrink-0"
          >
            ›
          </motion.button>
        </div>

        <div className="text-muted-foreground text-xs mt-4 space-y-0.5 text-center">
          <p>← → ↑ ↓ Arrow Keys to drive</p>
          <p>Dodge enemies • Collect coins & diamonds!</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ThemeSelect;
