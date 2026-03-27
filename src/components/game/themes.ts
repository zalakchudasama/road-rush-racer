export type ThemeId = "rain" | "lava" | "ice" | "desert";

export interface GameTheme {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  road: { top: string; mid: string; bot: string };
  edgeColor: string;
  lineColor: string;
  particles: { color: string; count: number; speed: number; type: "rain" | "ember" | "snow" | "sand" };
  skyGlow: string;
  lampColor: string;
  lampGlow: string;
}

export const THEMES: Record<ThemeId, GameTheme> = {
  rain: {
    id: "rain",
    name: "RAIN STORM",
    emoji: "🌧️",
    description: "Wet roads & lightning",
    road: { top: "#1a2030", mid: "#2a3545", bot: "#1a2535" },
    edgeColor: "#4488ff",
    lineColor: "rgba(150,200,255,0.5)",
    particles: { color: "rgba(150,200,255,0.6)", count: 80, speed: 14, type: "rain" },
    skyGlow: "rgba(100,150,255,0.08)",
    lampColor: "#aaccff",
    lampGlow: "#4488ff",
  },
  lava: {
    id: "lava",
    name: "LAVA INFERNO",
    emoji: "🌋",
    description: "Molten roads & fire",
    road: { top: "#2a0a00", mid: "#3a1500", bot: "#1a0800" },
    edgeColor: "#ff4400",
    lineColor: "rgba(255,100,0,0.6)",
    particles: { color: "rgba(255,120,20,0.7)", count: 40, speed: 3, type: "ember" },
    skyGlow: "rgba(255,60,0,0.1)",
    lampColor: "#ff6622",
    lampGlow: "#ff3300",
  },
  ice: {
    id: "ice",
    name: "HIMALAYA ICE",
    emoji: "❄️",
    description: "Frozen roads & snowfall",
    road: { top: "#1a2a3a", mid: "#2a3a4a", bot: "#1a2535" },
    edgeColor: "#88ddff",
    lineColor: "rgba(200,230,255,0.6)",
    particles: { color: "rgba(220,240,255,0.8)", count: 50, speed: 2, type: "snow" },
    skyGlow: "rgba(150,200,255,0.06)",
    lampColor: "#cceeFF",
    lampGlow: "#66bbff",
  },
  desert: {
    id: "desert",
    name: "DESERT HEAT",
    emoji: "🏜️",
    description: "Sandy roads & dust",
    road: { top: "#3a2a10", mid: "#4a3518", bot: "#2a1a08" },
    edgeColor: "#ddaa44",
    lineColor: "rgba(220,180,100,0.5)",
    particles: { color: "rgba(200,170,100,0.5)", count: 30, speed: 4, type: "sand" },
    skyGlow: "rgba(255,200,80,0.08)",
    lampColor: "#ffcc66",
    lampGlow: "#dd9922",
  },
};
