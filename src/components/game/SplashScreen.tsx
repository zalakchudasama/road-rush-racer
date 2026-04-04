import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

interface Props {
  onComplete: () => void;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

const SplashScreen = ({ onComplete }: Props) => {
  const [progress, setProgress] = useState(0);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (deferredPrompt) setCanInstall(true);
    const handler = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

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

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setCanInstall(false);
    deferredPrompt = null;
  };

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
        <motion.div
          className="text-7xl"
          animate={{ x: [-30, 30, -30], rotate: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          🏎️
        </motion.div>

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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground text-sm tracking-widest"
        >
          SPEED • DODGE • WIN
        </motion.p>

        {/* Download / Install Button */}
        {canInstall && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleInstall}
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wider text-white flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #00cc44, #00aa88)" }}
          >
            📲 INSTALL GAME
          </motion.button>
        )}

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
