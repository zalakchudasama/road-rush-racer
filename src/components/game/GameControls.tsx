import { useRef, useCallback, useEffect, useState } from "react";

interface GameControlsProps {
  onControl: (dir: { left: boolean; right: boolean; up: boolean; down: boolean }) => void;
  sensitivity: number;
  onBoost?: (active: boolean) => void;
}

const GameControls = ({ onControl, sensitivity, onBoost }: GameControlsProps) => {
  const pressedRef = useRef({ left: false, right: false, up: false, down: false });
  const [boostMeter, setBoostMeter] = useState(0); // 0-100
  const [boosting, setBoosting] = useState(false);
  const boostRef = useRef({ meter: 0, active: false });

  const emitState = useCallback(() => {
    onControl({ ...pressedRef.current });
  }, [onControl]);

  const press = useCallback((key: "up" | "down" | "left" | "right") => {
    pressedRef.current[key] = true;
    emitState();
  }, [emitState]);

  const release = useCallback((key: "up" | "down" | "left" | "right") => {
    pressedRef.current[key] = false;
    emitState();
  }, [emitState]);

  // Boost auto-fill & drain loop
  useEffect(() => {
    const interval = setInterval(() => {
      const b = boostRef.current;
      if (b.active) {
        // Drain: empty in ~4 seconds (100 / (4*20) = 1.25 per tick)
        b.meter = Math.max(0, b.meter - 1.25);
        if (b.meter <= 0) {
          b.active = false;
          setBoosting(false);
          onBoost?.(false);
        }
      } else {
        // Fill: 0→100 in 15 seconds (100 / (15*20) ≈ 0.333 per tick)
        b.meter = Math.min(100, b.meter + 0.333);
      }
      setBoostMeter(Math.round(b.meter));
    }, 50);
    return () => clearInterval(interval);
  }, [onBoost]);

  const activateBoost = useCallback(() => {
    const b = boostRef.current;
    if (!b.active && b.meter >= 30) {
      b.active = true;
      setBoosting(true);
      onBoost?.(true);
    }
  }, [onBoost]);

  // Prevent context menu
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  const btnBase = "flex items-center justify-center select-none active:scale-90 transition-transform duration-75";
  const size = sensitivity === 3 ? 56 : sensitivity === 2 ? 52 : 48;

  return (
    <>
      {/* LEFT SIDE: Left & Right steering buttons (horizontal) */}
      <div
        className="fixed left-3 z-50 flex flex-row items-center gap-3"
        style={{ bottom: 100 }}
      >
        <button
          className={btnBase}
          style={{
            width: size, height: size, borderRadius: "50%",
            background: "linear-gradient(135deg, #4488ff, #2266dd)",
            border: "2px solid rgba(255,255,255,0.3)",
            boxShadow: "0 3px 10px rgba(68,136,255,0.4)",
            touchAction: "none",
          }}
          onPointerDown={(e) => { e.preventDefault(); press("left"); }}
          onPointerUp={() => release("left")}
          onPointerLeave={() => release("left")}
          onPointerCancel={() => release("left")}
        >
          <span className="text-white text-xl font-bold">◀</span>
        </button>
        <button
          className={btnBase}
          style={{
            width: size, height: size, borderRadius: "50%",
            background: "linear-gradient(135deg, #ffaa00, #dd8800)",
            border: "2px solid rgba(255,255,255,0.3)",
            boxShadow: "0 3px 10px rgba(255,170,0,0.4)",
            touchAction: "none",
          }}
          onPointerDown={(e) => { e.preventDefault(); press("right"); }}
          onPointerUp={() => release("right")}
          onPointerLeave={() => release("right")}
          onPointerCancel={() => release("right")}
        >
          <span className="text-white text-xl font-bold">▶</span>
        </button>
      </div>

      {/* CENTER BOTTOM: Boost button */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
        style={{ bottom: 100 }}
      >
        <button
          className={btnBase}
          onClick={toggleBoost}
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: boosting
              ? "linear-gradient(135deg, #ff4400, #ff8800)"
              : boostMeter >= 30
                ? "linear-gradient(135deg, #00ccff, #0088ff)"
                : "linear-gradient(135deg, #444, #666)",
            border: "3px solid rgba(255,255,255,0.4)",
            boxShadow: boosting
              ? "0 0 20px rgba(255,100,0,0.7)"
              : boostMeter >= 30
                ? "0 0 15px rgba(0,200,255,0.5)"
                : "none",
            touchAction: "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Fill indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${boostMeter}%`,
              background: boosting
                ? "rgba(255,200,0,0.3)"
                : "rgba(0,200,255,0.25)",
              transition: "height 0.1s linear",
            }}
          />
          <span className="text-white text-lg font-bold relative z-10">🚀</span>
        </button>
        <p className="text-[10px] mt-1 tracking-wider opacity-50 text-foreground">
          {boosting ? "BOOST!" : boostMeter >= 30 ? `${boostMeter}%` : `${boostMeter}%`}
        </p>
      </div>

      {/* RIGHT SIDE: Up & Down speed buttons */}
      <div
        className="fixed right-3 z-50 flex flex-col items-center gap-3"
        style={{ bottom: 90 }}
      >
        <button
          className={btnBase}
          style={{
            width: size, height: size, borderRadius: "50%",
            background: "linear-gradient(135deg, #00cc66, #00aa55)",
            border: "2px solid rgba(255,255,255,0.3)",
            boxShadow: "0 3px 10px rgba(0,200,100,0.4)",
            touchAction: "none",
          }}
          onPointerDown={(e) => { e.preventDefault(); press("up"); }}
          onPointerUp={() => release("up")}
          onPointerLeave={() => release("up")}
          onPointerCancel={() => release("up")}
        >
          <span className="text-white text-xl font-bold">▲</span>
        </button>
        <button
          className={btnBase}
          style={{
            width: size, height: size, borderRadius: "50%",
            background: "linear-gradient(135deg, #ff4444, #cc2222)",
            border: "2px solid rgba(255,255,255,0.3)",
            boxShadow: "0 3px 10px rgba(255,50,50,0.4)",
            touchAction: "none",
          }}
          onPointerDown={(e) => { e.preventDefault(); press("down"); }}
          onPointerUp={() => release("down")}
          onPointerLeave={() => release("down")}
          onPointerCancel={() => release("down")}
        >
          <span className="text-white text-xl font-bold">▼</span>
        </button>
        <p className="text-[10px] tracking-wider opacity-40 text-foreground">SPEED</p>
      </div>
    </>
  );
};

export default GameControls;
