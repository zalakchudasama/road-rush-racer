import { useRef, useCallback, useEffect } from "react";

interface GameControlsProps {
  onControl: (dir: { left: boolean; right: boolean; up: boolean; down: boolean }) => void;
  sensitivity: number;
  boostFill: number;
  boostActive: boolean;
  onBoost: () => void;
}

const GameControls = ({ onControl, sensitivity, boostFill, boostActive, onBoost }: GameControlsProps) => {
  const pressedRef = useRef({ left: false, right: false, up: false, down: false });
  const wheelRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const centerRef = useRef({ x: 0, y: 0 });
  const RADIUS = 50;

  const emitState = useCallback(() => {
    onControl({ ...pressedRef.current });
  }, [onControl]);

  const press = useCallback((key: "up" | "down") => {
    pressedRef.current[key] = true;
    emitState();
  }, [emitState]);

  const release = useCallback((key: "up" | "down") => {
    pressedRef.current[key] = false;
    emitState();
  }, [emitState]);

  // Steering wheel handlers
  const handleWheelMove = useCallback((cx: number) => {
    const dx = cx - centerRef.current.x;
    const clampedX = Math.max(-RADIUS, Math.min(RADIUS, dx));
    if (knobRef.current) {
      knobRef.current.style.transform = `translateX(${clampedX}px)`;
    }
    const threshold = 8;
    pressedRef.current.left = clampedX < -threshold;
    pressedRef.current.right = clampedX > threshold;
    emitState();
  }, [emitState]);

  const handleWheelEnd = useCallback(() => {
    activeRef.current = false;
    if (knobRef.current) {
      knobRef.current.style.transform = "translateX(0px)";
    }
    pressedRef.current.left = false;
    pressedRef.current.right = false;
    emitState();
  }, [emitState]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const onStart = (e: PointerEvent) => {
      e.preventDefault();
      activeRef.current = true;
      const rect = el.getBoundingClientRect();
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      handleWheelMove(e.clientX);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!activeRef.current) return;
      e.preventDefault();
      handleWheelMove(e.clientX);
    };
    const onEnd = () => handleWheelEnd();
    el.addEventListener("pointerdown", onStart);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onEnd);
    el.addEventListener("pointercancel", onEnd);
    return () => {
      el.removeEventListener("pointerdown", onStart);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onEnd);
      el.removeEventListener("pointercancel", onEnd);
    };
  }, [handleWheelMove, handleWheelEnd]);

  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  const btnBase = "flex items-center justify-center select-none active:scale-90 transition-transform duration-75";
  const size = sensitivity === 3 ? 56 : sensitivity === 2 ? 52 : 48;

  return (
    <>
      {/* LEFT SIDE: Up (drive) & Down (brake) */}
      <div
        className="fixed left-3 z-50 flex flex-col items-center gap-3"
        style={{ bottom: 90 }}
      >
        <button
          className={btnBase}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
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
            width: size,
            height: size,
            borderRadius: "50%",
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
        <p className="text-[10px] tracking-wider opacity-40 text-foreground">DRIVE</p>
      </div>

      {/* RIGHT SIDE: Steering + Boost */}
      <div className="fixed right-3 z-50 flex flex-col items-center gap-3" style={{ bottom: 80 }}>
        {/* BOOST button */}
        <button
          className={btnBase}
          style={{
            width: 62,
            height: 62,
            borderRadius: "50%",
            background: boostActive
              ? "linear-gradient(135deg, #ff4400, #ff8800)"
              : boostFill >= 30
              ? "linear-gradient(135deg, #ff8800, #ffcc00)"
              : "linear-gradient(135deg, #444, #666)",
            border: boostActive ? "3px solid #fff" : "2px solid rgba(255,255,255,0.3)",
            boxShadow: boostActive
              ? "0 0 20px rgba(255,100,0,0.8)"
              : "0 3px 10px rgba(255,150,0,0.3)",
            touchAction: "none",
            position: "relative",
            overflow: "hidden",
          }}
          onPointerDown={(e) => { e.preventDefault(); onBoost(); }}
        >
          {/* Fill indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${boostFill}%`,
              background: boostActive
                ? "rgba(255,100,0,0.4)"
                : "rgba(255,200,0,0.3)",
              transition: "height 0.1s",
            }}
          />
          <span className="text-white text-sm font-bold relative z-10">
            {boostActive ? "🔥" : "🚀"}
          </span>
        </button>
        <p className="text-[10px] tracking-wider opacity-40 text-foreground">BOOST</p>

        {/* Steering wheel */}
        <div
          ref={wheelRef}
          style={{ touchAction: "none" }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 130,
              height: 56,
              borderRadius: 28,
              background: "rgba(255,255,255,0.06)",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            <span className="absolute left-2 text-sm opacity-50 font-bold" style={{ color: "#4488ff" }}>◀</span>
            <span className="absolute right-2 text-sm opacity-50 font-bold" style={{ color: "#ffaa00" }}>▶</span>
            <div
              ref={knobRef}
              className="flex items-center justify-center cursor-grab"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ff4444, #ff8800, #ffcc00, #44ff44, #4488ff, #cc44ff)",
                border: "2px solid rgba(255,255,255,0.5)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                transition: "transform 0.04s linear",
              }}
            >
              <span className="text-lg">🏎️</span>
            </div>
          </div>
          <p className="text-center text-[10px] mt-1 tracking-wider opacity-40 text-foreground">STEER</p>
        </div>
      </div>
    </>
  );
};

export default GameControls;
