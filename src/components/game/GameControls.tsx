import { useRef, useCallback, useEffect } from "react";

interface GameControlsProps {
  onControl: (dir: { left: boolean; right: boolean; up: boolean; down: boolean }) => void;
  sensitivity: number;
}

const GameControls = ({ onControl, sensitivity }: GameControlsProps) => {
  const pressedRef = useRef({ left: false, right: false, up: false, down: false });

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

  // Touch left/right side of screen to steer
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const x = e.touches[i].clientX;
        const w = window.innerWidth;
        if (x < w * 0.35) {
          pressedRef.current.left = true;
        } else if (x > w * 0.65) {
          pressedRef.current.right = true;
        }
      }
      emitState();
    };
    const onMove = (e: TouchEvent) => {
      pressedRef.current.left = false;
      pressedRef.current.right = false;
      for (let i = 0; i < e.touches.length; i++) {
        const x = e.touches[i].clientX;
        const w = window.innerWidth;
        if (x < w * 0.35) {
          pressedRef.current.left = true;
        } else if (x > w * 0.65) {
          pressedRef.current.right = true;
        }
      }
      emitState();
    };
    const onEnd = () => {
      pressedRef.current.left = false;
      pressedRef.current.right = false;
      emitState();
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [emitState]);

  // Keyboard for PC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const down = e.type === "keydown";
      if (e.key === "ArrowLeft") pressedRef.current.left = down;
      if (e.key === "ArrowRight") pressedRef.current.right = down;
      if (e.key === "ArrowUp") pressedRef.current.up = down;
      if (e.key === "ArrowDown") pressedRef.current.down = down;
      emitState();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [emitState]);

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
      {/* Visual indicators for touch steering zones */}
      <div className="fixed left-2 top-1/2 -translate-y-1/2 z-40 pointer-events-none opacity-20">
        <span className="text-3xl text-foreground">◀</span>
      </div>
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40 pointer-events-none opacity-20">
        <span className="text-3xl text-foreground">▶</span>
      </div>

      {/* CENTER BOTTOM: Up & Down arrows */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3"
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
