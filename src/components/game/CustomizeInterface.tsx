import { useEffect, useRef, useState } from "react";
import { ControlLayout, BtnKey, getDefaultLayout, saveLayout } from "./controlLayout";

interface Props {
  initial: ControlLayout;
  onSave: (layout: ControlLayout) => void;
  onCancel: () => void;
}

const META: Record<BtnKey, { label: string; icon: string; bg: string }> = {
  left:    { label: "LEFT",    icon: "◀",  bg: "linear-gradient(135deg, #4488ff, #2266dd)" },
  right:   { label: "RIGHT",   icon: "▶",  bg: "linear-gradient(135deg, #ffaa00, #dd8800)" },
  up:      { label: "UP",      icon: "▲",  bg: "linear-gradient(135deg, #00cc66, #00aa55)" },
  down:    { label: "DOWN",    icon: "▼",  bg: "linear-gradient(135deg, #ff4444, #cc2222)" },
  boost:   { label: "BOOST",   icon: "🚀", bg: "linear-gradient(135deg, #00ccff, #0088ff)" },
  ability: { label: "ABILITY", icon: "✨", bg: "linear-gradient(135deg, #a855f7, #7e22ce)" },
};

const MIN_SIZE = 36;
const MAX_SIZE = 96;

const CustomizeInterface = ({ initial, onSave, onCancel }: Props) => {
  const [layout, setLayout] = useState<ControlLayout>(initial);
  const [selected, setSelected] = useState<BtnKey>("left");
  const dragRef = useRef<{ key: BtnKey; dx: number; dy: number } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      e.preventDefault();
      setLayout((prev) => {
        const b = prev[d.key];
        const W = window.innerWidth, H = window.innerHeight;
        const nx = Math.max(0, Math.min(W - b.size, e.clientX - d.dx));
        const ny = Math.max(60, Math.min(H - b.size, e.clientY - d.dy));
        return { ...prev, [d.key]: { ...b, x: nx, y: ny } };
      });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const startDrag = (k: BtnKey, e: React.PointerEvent) => {
    e.preventDefault();
    setSelected(k);
    const b = layout[k];
    dragRef.current = { key: k, dx: e.clientX - b.x, dy: e.clientY - b.y };
  };

  const resize = (delta: number) => {
    setLayout((prev) => {
      const b = prev[selected];
      const size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, b.size + delta));
      return { ...prev, [selected]: { ...b, size } };
    });
  };

  const handleSave = () => { saveLayout(layout); onSave(layout); };
  const handleReset = () => setLayout(getDefaultLayout());

  return (
    <div
      className="fixed inset-0 z-[100]"
      style={{
        background:
          "linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 40%, #2a1a1a 100%)",
      }}
    >
      {/* Fake road backdrop so it looks like game */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0"
        style={{
          width: "60%",
          background:
            "repeating-linear-gradient(180deg, #2a2a2a 0 60px, #333 60px 65px, #ffcc00 65px 95px, #333 95px 100px)",
          opacity: 0.35,
        }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-background/85 backdrop-blur-sm border-b border-border">
        <div className="flex flex-col">
          <h3 className="text-foreground font-bold text-sm tracking-wider whitespace-nowrap">
            🎮 CUSTOMIZE CONTROLS
          </h3>
          <span className="text-[10px] text-muted-foreground">
            Drag buttons · Tap to select · Use −/+ to resize
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground bg-muted"
          >
            RESET
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground"
          >
            SAVE
          </button>
        </div>
      </div>

      {/* Resize controls (for selected) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/85 border border-border rounded-full px-3 py-1.5 backdrop-blur-sm">
        <span className="text-[11px] text-muted-foreground tracking-wider">
          {META[selected].label}
        </span>
        <button
          onClick={() => resize(-6)}
          className="w-7 h-7 rounded-full bg-muted text-foreground font-bold text-lg leading-none flex items-center justify-center border border-border"
        >
          −
        </button>
        <span className="text-[11px] text-foreground font-mono w-8 text-center">
          {layout[selected].size}
        </span>
        <button
          onClick={() => resize(6)}
          className="w-7 h-7 rounded-full bg-muted text-foreground font-bold text-lg leading-none flex items-center justify-center border border-border"
        >
          +
        </button>
      </div>

      {/* Draggable buttons */}
      {(Object.keys(layout) as BtnKey[]).map((k) => {
        const b = layout[k];
        const m = META[k];
        const isSel = selected === k;
        return (
          <div
            key={k}
            onPointerDown={(e) => startDrag(k, e)}
            className="absolute flex items-center justify-center select-none"
            style={{
              left: b.x,
              top: b.y,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background: m.bg,
              border: isSel ? "3px dashed #fff" : "2px solid rgba(255,255,255,0.35)",
              boxShadow: isSel
                ? "0 0 22px rgba(255,255,255,0.6)"
                : "0 3px 10px rgba(0,0,0,0.4)",
              touchAction: "none",
              cursor: "grab",
              zIndex: 20,
            }}
          >
            <span className="text-white font-bold" style={{ fontSize: Math.max(14, b.size * 0.35) }}>
              {m.icon}
            </span>
            <span
              className="absolute text-white/90 font-mono tracking-wider"
              style={{ fontSize: 9, bottom: -14, whiteSpace: "nowrap" }}
            >
              {m.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CustomizeInterface;