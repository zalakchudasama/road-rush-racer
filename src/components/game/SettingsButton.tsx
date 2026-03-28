import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
}

const labels = ["Low", "Medium", "High"];

const SettingsButton = ({ sensitivity, onSensitivityChange }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Settings gear button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-[180px] z-50 w-10 h-10 rounded-full flex items-center justify-center border border-border bg-background/80 backdrop-blur-sm"
        style={{ touchAction: "none" }}
      >
        <span className="text-lg">⚙️</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-16 right-4 z-[60] bg-background/95 border border-border rounded-xl p-4 w-52 backdrop-blur-sm"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}
          >
            <h3 className="text-foreground font-bold text-sm mb-3 tracking-wider">⚙️ SETTINGS</h3>

            <p className="text-muted-foreground text-xs mb-2">Sensitivity</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((val) => (
                <button
                  key={val}
                  onClick={() => onSensitivityChange(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider transition-colors ${
                    sensitivity === val
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {labels[val - 1]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full py-1.5 rounded-lg text-xs text-muted-foreground border border-border"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsButton;
