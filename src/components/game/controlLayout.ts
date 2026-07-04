export type BtnKey = "left" | "right" | "up" | "down" | "boost" | "ability";

export interface BtnLayout {
  x: number;
  y: number;
  size: number;
}

export type ControlLayout = Record<BtnKey, BtnLayout>;

const STORAGE_KEY = "roadrush.controlLayout.v2";

export function getDefaultLayout(
  W: number = typeof window !== "undefined" ? window.innerWidth : 800,
  H: number = typeof window !== "undefined" ? window.innerHeight : 600,
): ControlLayout {
  const sz = 52;
  const boostSz = 64;
  const abSz = 56;
  const bottomRow = H - 100 - sz;
  return {
    left:    { x: 12,                         y: bottomRow,           size: sz },
    right:   { x: 12 + sz + 12,               y: bottomRow,           size: sz },
    boost:   { x: Math.round(W / 2 - boostSz / 2), y: H - 100 - boostSz, size: boostSz },
    up:      { x: W - 12 - sz,                y: H - 90 - sz * 2 - 12, size: sz },
    down:    { x: W - 12 - sz,                y: H - 90 - sz,          size: sz },
    ability: { x: 12,                         y: H - 30 - abSz,        size: abSz },
  };
}

export function loadLayout(): ControlLayout {
  const def = getDefaultLayout();
  if (typeof window === "undefined") return def;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<ControlLayout>;
    const merged: ControlLayout = { ...def };
    (Object.keys(def) as BtnKey[]).forEach((k) => {
      const v = parsed[k];
      if (v && typeof v.x === "number" && typeof v.y === "number" && typeof v.size === "number") {
        merged[k] = { x: v.x, y: v.y, size: v.size };
      }
    });
    return merged;
  } catch {
    return def;
  }
}

export function saveLayout(layout: ControlLayout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
}

export function resetLayout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}