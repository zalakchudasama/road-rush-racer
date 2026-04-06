import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CARS, CarData, getWallet, getOwnedCars, buyCar, getSelectedCar, setSelectedCar, getDiamonds } from "./cars";
import { playClickSound } from "./sounds";

interface Props {
  onBack: () => void;
  onCarChanged: () => void;
  onNext?: () => void;
}

const CarGarage = ({ onBack, onCarChanged, onNext }: Props) => {
  const [wallet, setWalletState] = useState(getWallet);
  const [owned, setOwned] = useState(getOwnedCars);
  const [selected, setSelected] = useState(getSelectedCar);
  const [msg, setMsg] = useState("");
  const [index, setIndex] = useState(0);

  const car = CARS[index];
  const isOwned = owned.includes(car.id);
  const isSelected = selected === car.id;

  const handleBuy = () => {
    if (isOwned) return;
    if (wallet < car.price) {
      setMsg(`Need ${car.price - wallet} more coins!`);
      setTimeout(() => setMsg(""), 2000);
      return;
    }
    const ok = buyCar(car.id);
    if (ok) {
      setWalletState(getWallet());
      setOwned(getOwnedCars());
      setMsg(`🎉 ${car.name} purchased!`);
      setTimeout(() => setMsg(""), 2000);
    }
  };

  const handleSelect = () => {
    if (!isOwned) return;
    setSelectedCar(car.id);
    setSelected(car.id);
    onCarChanged();
  };

  const goLeft = () => {
    playClickSound();
    setIndex((prev) => (prev > 0 ? prev - 1 : CARS.length - 1));
  };
  const goRight = () => {
    playClickSound();
    setIndex((prev) => (prev < CARS.length - 1 ? prev + 1 : 0));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50 p-4"
    >
      <div className="flex flex-col items-center w-full max-w-sm">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { playClickSound(); onBack(); }}
          className="self-start mb-4 w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold border-2 border-border text-foreground bg-card"
        >
          ←
        </motion.button>

        <div className="text-3xl mb-1">🏪</div>
        <h2 className="text-xl font-bold text-foreground mb-1 tracking-wider">CAR GARAGE</h2>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span className="font-bold text-sm" style={{ color: "#ffd700" }}>{wallet.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💎</span>
            <span className="font-bold text-sm" style={{ color: "#00d4ff" }}>{getDiamonds().toLocaleString()}</span>
          </div>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-bold mb-2"
              style={{ color: msg.includes("Need") ? "#ff4444" : "#44dd44" }}
            >
              {msg}
            </motion.p>
          )}
        </AnimatePresence>

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
            key={car.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex-1 aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-4 ${
              isSelected ? "border-primary bg-primary/10" : isOwned ? "border-accent/50 bg-card" : "border-border bg-card/50"
            }`}
          >
            <div className="text-5xl mb-2">{car.emoji}</div>
            <div className="text-foreground font-bold text-sm mb-1">{car.name}</div>
            <div className="text-muted-foreground text-[10px] mb-1">{car.description}</div>
            {car.speed > 0 && (
              <div className="text-[10px] mb-1" style={{ color: "#44dd44" }}>
                +{car.speed} speed bonus
              </div>
            )}
            <div className="text-[10px] text-muted-foreground mb-3">
              {index + 1} / {CARS.length}
            </div>

            {isOwned ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSelect}
                className={`px-5 py-2 rounded-lg font-bold text-xs ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:bg-accent/20"
                }`}
              >
                {isSelected ? "✓ SELECTED" : "SELECT"}
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleBuy}
                className="px-5 py-2 rounded-lg font-bold text-xs text-background"
                style={{
                  background: wallet >= car.price
                    ? "linear-gradient(135deg, #ffd700, #ff8c00)"
                    : "#555",
                }}
              >
                💰 {car.price.toLocaleString()}
              </motion.button>
            )}
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={goRight}
            className="w-10 h-10 rounded-full bg-card border-2 border-border text-foreground font-bold text-xl flex items-center justify-center shrink-0"
          >
            ›
          </motion.button>
        </div>

        {onNext && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { playClickSound(); onNext(); }}
            className="mt-4 px-8 py-3 rounded-xl font-bold text-sm text-primary-foreground tracking-wider"
            style={{ background: "linear-gradient(135deg, #ff4444, #ff8800)" }}
          >
            🎯 MISSIONS →
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default CarGarage;
