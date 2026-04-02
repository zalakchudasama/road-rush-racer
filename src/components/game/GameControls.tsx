import { useRef, useCallback, useEffect } from "react";

interface GameControlsProps {
  onControl: (dir: { left: boolean; right: boolean; up: boolean; down: boolean }) => void;
  sensitivity: number;
}

const GameControls = ({ onControl, sensitivity }: GameControlsProps) => {
  const pressedRef = useRef({ left: false, right: false, up: false, down: false });
  const activeRef = useRef(false);

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
      {/* LEFT SIDE: Left & Right steering buttons */}
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
            width: size,
            height: size,
            borderRadius: "50%",
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
        <p className="text-[10px] tracking-wider opacity-40 text-foreground">STEER</p>
      </div>

      {/* RIGHT SIDE: Up & Down speed buttons */}
      <div
        className="fixed right-3 z-50 flex flex-col items-center gap-3"
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
        <p className="text-[10px] tracking-wider opacity-40 text-foreground">SPEED</p>
      </div>
    </>
  );
};

export default GameControls;
