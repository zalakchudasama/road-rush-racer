import { motion } from "framer-motion";
import { THEMES, ThemeId } from "./themes";
import { playClickSound } from "./sounds";

interface Props {
  onSelect: (id: ThemeId) => void;
  onGarage?: () => void;
  onBack?: () => void;
}

const themeList: ThemeId[] = ["rain", "lava", "ice", "desert"];

const ThemeSelect = ({ onSelect, onGarage, onBack }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50"
    >
      <div
        className="bg-background/95 border-2 border-primary rounded-2xl px-8 py-6 text-center max-w-sm w-full"
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
        <div className="text-5xl mb-3">🏎️</div>
        <h1 className="text-2xl font-bold text-foreground mb-1 tracking-wider">TURBO RACER PRO</h1>
        <p className="text-muted-foreground text-sm mb-4">Tap PLAY on a road to begin</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {themeList.map((id) => {
            const t = THEMES[id];
            return (
              <motion.div
                key={id}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 border-border bg-card"
              >
                <span className="text-3xl">{t.emoji}</span>
                <span className="text-foreground font-bold text-xs tracking-wider">{t.name}</span>
                <span className="text-muted-foreground text-[10px]">{t.description}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { playClickSound(); onSelect(id); }}
                  className="mt-1 w-full py-1.5 rounded-lg font-bold text-xs text-primary-foreground tracking-wider"
                  style={{ background: "linear-gradient(135deg, #44dd44, #22aa22)" }}
                >
                  ▶️ PLAY
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {onGarage && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playClickSound(); onGarage!(); }}
            className="mb-4 px-5 py-2 rounded-xl font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)" }}
          >
            🏪 CAR GARAGE
          </motion.button>
        )}

        <div className="text-muted-foreground text-xs space-y-0.5">
          <p>← → ↑ ↓ Arrow Keys to drive</p>
          <p>Dodge enemies • Collect coins & diamonds!</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ThemeSelect;
