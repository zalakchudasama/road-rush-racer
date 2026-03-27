import { useRef, useCallback, useEffect } from "react";

interface SteeringWheelProps {
  onSteer: (dir: { left: boolean; right: boolean; up: boolean; down: boolean }) => void;
}

const SteeringWheel = ({ onSteer }: SteeringWheelProps) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const centerRef = useRef({ x: 0, y: 0 });
  const RADIUS = 55;

  const handleMove = useCallback((cx: number, cy: number) => {
    const dx = cx - centerRef.current.x;
    const dy = cy - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, RADIUS);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }

    const threshold = 8;
    onSteer({
      left: nx < -threshold,
      right: nx > threshold,
      up: ny < -threshold,
      down: ny > threshold,
    });
  }, [onSteer]);

  const handleEnd = useCallback(() => {
    activeRef.current = false;
    if (knobRef.current) {
      knobRef.current.style.transform = "translate(0px, 0px)";
    }
    onSteer({ left: false, right: false, up: false, down: false });
  }, [onSteer]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      activeRef.current = true;
      const rect = el.getBoundingClientRect();
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onMove = (e: TouchEvent) => {
      if (!activeRef.current) return;
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onEnd = () => handleEnd();

    // Mouse support for desktop testing
    const onMouseDown = (e: MouseEvent) => {
      activeRef.current = true;
      const rect = el.getBoundingClientRect();
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      handleMove(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!activeRef.current) return;
      handleMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => handleEnd();

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleMove, handleEnd]);

  return (
    <div
      ref={wheelRef}
      className="fixed bottom-16 right-4 z-50 select-none"
      style={{ touchAction: "none" }}
    >
      {/* Outer ring */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          border: "3px solid rgba(255,255,255,0.2)",
        }}
      >
        {/* Direction indicators */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-lg opacity-40">▲</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-lg opacity-40">▼</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-lg opacity-40">◀</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-lg opacity-40">▶</span>

        {/* Knob */}
        <div
          ref={knobRef}
          className="flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff4444, #ff8800, #ffcc00, #44ff44, #4488ff, #cc44ff)",
            border: "2px solid rgba(255,255,255,0.5)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            transition: "transform 0.03s linear",
            cursor: "grab",
          }}
        >
          <span className="text-xl">🏎️</span>
        </div>
      </div>
    </div>
  );
};

export default SteeringWheel;
