import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: Props) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        background: "radial-gradient(ellipse at center, #1a0a00 0%, #000000 70%)",
      }}
    >
      <div className="flex flex-col items-center gap-6 px-6">
        {/* Car animation */}
        <motion.div
          className="text-7xl"
          animate={{ x: [-30, 30, -30], rotate: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          🏎️
        </motion.div>

        {/* Game Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-extrabold tracking-[0.3em] text-center"
          style={{
            background: "linear-gradient(135deg, #ff4444, #ff8800, #ffcc00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          TURBO RACER PRO
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground text-sm tracking-widest"
        >
          SPEED • DODGE • WIN
        </motion.p>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 220 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <div className="h-2 rounded-full overflow-hidden border border-orange-500/30"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #ff4444, #ff8800, #ffcc00)",
                width: `${progress}%`,
              }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2 tracking-wider">
            Loading... {progress}%
          </p>
        </motion.div>

        {/* Developer credit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <p className="text-[10px] sm:text-xs tracking-widest whitespace-nowrap" style={{ color: "rgba(200,160,100,0.6)" }}>
            Developed by{" "}
            <span
              className="font-extrabold text-sm"
              style={{
                background: "linear-gradient(135deg, #ffd700, #ff8c00, #ff4500, #ffd700)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Zalak Chudasama
            </span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
