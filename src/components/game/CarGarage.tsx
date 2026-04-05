import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CARS, CarData, getWallet, getOwnedCars, buyCar, getSelectedCar, setSelectedCar, getDiamonds } from "./cars";
import { playClickSound } from "./sounds";

interface Props {
  onBack: () => void;
  onCarChanged: () => void;
}

const CarGarage = ({ onBack, onCarChanged }: Props) => {
  const [wallet, setWalletState] = useState(getWallet);
  const [owned, setOwned] = useState(getOwnedCars);
  const [selected, setSelected] = useState(getSelectedCar);
  const [msg, setMsg] = useState("");

  const handleBuy = (car: CarData) => {
    if (owned.includes(car.id)) return;
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

  const handleSelect = (car: CarData) => {
    if (!owned.includes(car.id)) return;
    setSelectedCar(car.id);
    setSelected(car.id);
    onCarChanged();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-background/95 border-2 border-primary rounded-2xl px-5 py-5 text-center w-full max-w-sm max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 0 40px rgba(255,50,50,0.3)" }}
      >
        <div className="text-4xl mb-2">🏪</div>
        <h2 className="text-xl font-bold text-foreground mb-1 tracking-wider">CAR GARAGE</h2>
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <span className="text-lg">💰</span>
            <span className="font-bold text-lg" style={{ color: "#ffd700" }}>{wallet.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">💎</span>
            <span className="font-bold text-lg" style={{ color: "#00d4ff" }}>{getDiamonds().toLocaleString()}</span>
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

        <div className="space-y-2 mb-4">
          {CARS.map((car) => {
            const isOwned = owned.includes(car.id);
            const isSelected = selected === car.id;
            return (
              <motion.div
                key={car.id}
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : isOwned
                    ? "border-accent/50 bg-card"
                    : "border-border bg-card/50"
                }`}
              >
                <div className="text-3xl">{car.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="text-foreground font-bold text-sm">{car.name}</div>
                  <div className="text-muted-foreground text-[10px]">{car.description}</div>
                  {car.speed > 0 && (
                    <div className="text-[10px] mt-0.5" style={{ color: "#44dd44" }}>
                      +{car.speed} speed bonus
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {isOwned ? (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelect(car)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
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
                      onClick={() => handleBuy(car)}
                      className="px-3 py-1.5 rounded-lg font-bold text-xs text-background"
                      style={{
                        background: wallet >= car.price
                          ? "linear-gradient(135deg, #ffd700, #ff8c00)"
                          : "#555",
                      }}
                    >
                      💰 {car.price.toLocaleString()}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-6 py-2 rounded-xl font-bold text-sm border-2 border-border text-foreground"
        >
          ← BACK
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CarGarage;
