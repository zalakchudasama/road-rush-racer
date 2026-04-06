import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { playClickSound } from "./sounds";
import scorpioBg from "@/assets/scorpio-bg.jpg";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

interface Props {
  onStart: () => void;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

const StartScreen = ({ onStart }: Props) => {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (deferredPrompt) setCanInstall(true);
    const handler = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    playClickSound();
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
      className="absolute inset-0 flex items-center justify-center z-50 overflow-hidden"
    >
      {/* Scorpio Background */}
      <div className="absolute inset-0">
        <img
          src={scorpioBg}
          alt="Scorpio Classic S11"
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.4)" }}
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)" }} />
      </div>

      <div className="relative flex flex-col items-center gap-5 px-6">
        {/* Animated car emoji */}
        <motion.div
          className="text-7xl"
          animate={{ x: [-20, 20, -20], rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          🏎️
        </motion.div>

        {/* Game Title */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-extrabold tracking-[0.2em] text-center"
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
          className="text-sm tracking-[0.3em]"
          style={{ color: "rgba(200,200,200,0.7)" }}
        >
          SPEED • DODGE • WIN
        </motion.p>

        {/* Start Game Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring" }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            playClickSound();
            onStart();
          }}
          className="mt-2 px-10 py-4 rounded-2xl font-extrabold text-lg tracking-widest text-white"
          style={{
            background: "linear-gradient(135deg, #ff4444, #ff8800)",
            boxShadow: "0 0 30px rgba(255,68,68,0.5), 0 0 60px rgba(255,136,0,0.3)",
          }}
        >
          🎮 START GAME
        </motion.button>

        {/* Download Now Button */}
        {canInstall && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, type: "spring" }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleInstall}
            className="px-8 py-3 rounded-2xl font-extrabold text-sm tracking-widest text-white flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #00cc44, #00aa88)",
              boxShadow: "0 0 20px rgba(0,204,68,0.4)",
            }}
          >
            📲 DOWNLOAD NOW
          </motion.button>
        )}

        {/* Developer credit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6"
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

export default StartScreen;
