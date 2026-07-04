import { useRef, useCallback, useEffect, useState } from "react";
import type { ControlLayout, BtnLayout } from "./controlLayout";

interface GameControlsProps {
  onControl: (dir: { left: boolean; right: boolean; up: boolean; down: boolean }) => void;
  sensitivity: number;
  onBoost?: (active: boolean) => void;
  layout?: ControlLayout;
}

const GameControls = ({ onControl, sensitivity, onBoost, layout }: GameControlsProps) => {
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

  const posStyle = (b: BtnLayout | undefined, fallback: React.CSSProperties): React.CSSProperties =>
    b
      ? { position: "fixed", left: b.x, top: b.y, width: b.size, height: b.size, borderRadius: "50%", touchAction: "none" }
      : { ...fallback, touchAction: "none" };

  return (
    <>
      {/* LEFT steering */}
      <button
        className={btnBase + " fixed z-50"}
        style={{
          ...posStyle(layout?.left, { position: "fixed", left: 12, bottom: 100, width: size, height: size, borderRadius: "50%" }),
          background: "linear-gradient(135deg, #4488ff, #2266dd)",
          border: "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0 3px 10px rgba(68,136,255,0.4)",
        }}
        onPointerDown={(e) => { e.preventDefault(); press("left"); }}
        onPointerUp={() => release("left")}
        onPointerLeave={() => release("left")}
        onPointerCancel={() => release("left")}
      >
        <span className="text-white text-xl font-bold">◀</span>
      </button>

      {/* RIGHT steering */}
      <button
        className={btnBase + " fixed z-50"}
        style={{
          ...posStyle(layout?.right, { position: "fixed", left: 12 + size + 12, bottom: 100, width: size, height: size, borderRadius: "50%" }),
          background: "linear-gradient(135deg, #ffaa00, #dd8800)",
          border: "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0 3px 10px rgba(255,170,0,0.4)",
        }}
        onPointerDown={(e) => { e.preventDefault(); press("right"); }}
        onPointerUp={() => release("right")}
        onPointerLeave={() => release("right")}
        onPointerCancel={() => release("right")}
      >
        <span className="text-white text-xl font-bold">▶</span>
      </button>

      {/* BOOST */}
      <button
        className={btnBase + " fixed z-50"}
        onPointerDown={(e) => { e.preventDefault(); activateBoost(); }}
        style={{
            ...posStyle(layout?.boost, { position: "fixed", left: "50%", bottom: 100, width: 64, height: 64, borderRadius: "50%", transform: "translateX(-50%)" }),
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
            overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: `${boostMeter}%`,
            background: boosting ? "rgba(255,200,0,0.3)" : "rgba(0,200,255,0.25)",
            transition: "height 0.1s linear",
          }}
        />
        <span className="text-white text-lg font-bold relative z-10">🚀</span>
      </button>

      {/* UP */}
      <button
        className={btnBase + " fixed z-50"}
        style={{
          ...posStyle(layout?.up, { position: "fixed", right: 12, bottom: 90 + size + 12, width: size, height: size, borderRadius: "50%" }),
          background: "linear-gradient(135deg, #00cc66, #00aa55)",
          border: "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0 3px 10px rgba(0,200,100,0.4)",
        }}
        onPointerDown={(e) => { e.preventDefault(); press("up"); }}
        onPointerUp={() => release("up")}
        onPointerLeave={() => release("up")}
        onPointerCancel={() => release("up")}
      >
        <span className="text-white text-xl font-bold">▲</span>
      </button>

      {/* DOWN */}
      <button
        className={btnBase + " fixed z-50"}
        style={{
          ...posStyle(layout?.down, { position: "fixed", right: 12, bottom: 90, width: size, height: size, borderRadius: "50%" }),
          background: "linear-gradient(135deg, #ff4444, #cc2222)",
          border: "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0 3px 10px rgba(255,50,50,0.4)",
        }}
        onPointerDown={(e) => { e.preventDefault(); press("down"); }}
        onPointerUp={() => release("down")}
        onPointerLeave={() => release("down")}
        onPointerCancel={() => release("down")}
      >
        <span className="text-white text-xl font-bold">▼</span>
      </button>
    </>
  );
};

export default GameControls;
