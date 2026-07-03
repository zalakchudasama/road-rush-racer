export interface CarData {
  id: string;
  name: string;
  emoji: string;
  price: number;
  color1: string;   // primary gradient
  color2: string;   // secondary gradient
  color3: string;   // dark shade
  speed: number;     // speed bonus (0 = normal)
  description: string;
  ability: AbilityType;
  abilityCost: number; // diamonds per purchase
}

export type AbilityType = "shield" | "magnet" | "nitro" | "slow" | "ghostbust";

export interface AbilityInfo {
  id: AbilityType;
  name: string;
  emoji: string;
  description: string;
  durationMs: number;
  color: string;
}

export const ABILITIES: Record<AbilityType, AbilityInfo> = {
  shield:    { id: "shield",    name: "Shield",      emoji: "🛡️", description: "Invincible from cars & ghosts",  durationMs: 4000, color: "#00d4ff" },
  magnet:    { id: "magnet",    name: "Coin Magnet", emoji: "🧲", description: "Pulls coins toward you",         durationMs: 6000, color: "#ffd700" },
  nitro:     { id: "nitro",     name: "Nitro",       emoji: "🚀", description: "Massive speed burst",            durationMs: 4000, color: "#ff6600" },
  slow:      { id: "slow",      name: "Slow Time",   emoji: "⏱️", description: "Slows all enemies",              durationMs: 5000, color: "#aa66ff" },
  ghostbust: { id: "ghostbust", name: "Ghost Buster",emoji: "👻", description: "Wipes ghosts & blocks them",     durationMs: 5000, color: "#ffffff" },
};

export const ABILITY_COST = 10;          // legacy default (kept for fallback)
export const ABILITY_USES_PER_PURCHASE = 3;

export const CARS: CarData[] = [
  { id: "starter",  name: "Street Racer",     emoji: "🏎️", price: 0,    color1: "#ff4444", color2: "#cc0000", color3: "#880000", speed: 0, description: "Your first ride",  ability: "shield",    abilityCost: 10 },
  { id: "nano",     name: "Tata Nano",        emoji: "🚗", price: 1000, color1: "#44dd44", color2: "#22aa22", color3: "#116611", speed: 0, description: "Small & quick",    ability: "magnet",    abilityCost: 20 },
  { id: "swift",    name: "Maruti Swift",     emoji: "🚙", price: 2000, color1: "#4488ff", color2: "#2266cc", color3: "#114488", speed: 1, description: "Smooth handler",   ability: "nitro",     abilityCost: 30 },
  { id: "fortuner", name: "Toyota Fortuner",  emoji: "🚐", price: 3000, color1: "#ffffff", color2: "#cccccc", color3: "#888888", speed: 1, description: "Big & powerful",   ability: "slow",      abilityCost: 40 },
  { id: "scorpio",  name: "Mahindra Scorpio", emoji: "🛻", price: 4000, color1: "#111111", color2: "#333333", color3: "#000000", speed: 2, description: "Beast on road",    ability: "ghostbust", abilityCost: 50 },
  { id: "mustang",  name: "Ford Mustang",     emoji: "🐎", price: 5000, color1: "#ffcc00", color2: "#ddaa00", color3: "#aa7700", speed: 2, description: "American muscle",  ability: "magnet",    abilityCost: 60 },
  { id: "lambo",    name: "Lamborghini",      emoji: "🏁", price: 6000, color1: "#ff6600", color2: "#dd4400", color3: "#aa2200", speed: 3, description: "Ultimate speed",   ability: "nitro",     abilityCost: 70 },
];

const WALLET_KEY = "turbo_racer_wallet";
const OWNED_KEY = "turbo_racer_owned";
const SELECTED_KEY = "turbo_racer_selected";
const DIAMOND_KEY = "turbo_racer_diamonds";

export const getDiamonds = (): number => {
  return parseInt(localStorage.getItem(DIAMOND_KEY) || "0", 10);
};

export const setDiamonds = (amount: number) => {
  localStorage.setItem(DIAMOND_KEY, String(amount));
};

export const addDiamonds = (amount: number) => {
  setDiamonds(getDiamonds() + amount);
};

export const getWallet = (): number => {
  return parseInt(localStorage.getItem(WALLET_KEY) || "0", 10);
};

export const setWallet = (amount: number) => {
  localStorage.setItem(WALLET_KEY, String(amount));
};

export const addToWallet = (amount: number) => {
  setWallet(getWallet() + amount);
};

export const getOwnedCars = (): string[] => {
  try {
    const saved = localStorage.getItem(OWNED_KEY);
    return saved ? JSON.parse(saved) : ["starter"];
  } catch { return ["starter"]; }
};

export const setOwnedCars = (ids: string[]) => {
  localStorage.setItem(OWNED_KEY, JSON.stringify(ids));
};

export const buyCar = (carId: string): boolean => {
  const car = CARS.find(c => c.id === carId);
  if (!car) return false;
  const wallet = getWallet();
  if (wallet < car.price) return false;
  const owned = getOwnedCars();
  if (owned.includes(carId)) return false;
  setWallet(wallet - car.price);
  setOwnedCars([...owned, carId]);
  return true;
};

export const getSelectedCar = (): string => {
  return localStorage.getItem(SELECTED_KEY) || "starter";
};

export const setSelectedCar = (id: string) => {
  localStorage.setItem(SELECTED_KEY, id);
};

const COMPLETED_MISSIONS_KEY = "turbo_racer_completed_missions";

export const getCompletedMissions = (): string[] => {
  try {
    const saved = localStorage.getItem(COMPLETED_MISSIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export const addCompletedMission = (missionId: string) => {
  const completed = getCompletedMissions();
  if (!completed.includes(missionId)) {
    completed.push(missionId);
    localStorage.setItem(COMPLETED_MISSIONS_KEY, JSON.stringify(completed));
  }
};

// ---------------- Ability charges (per-car) ----------------
const ABILITY_CHARGES_KEY = "turbo_racer_ability_charges";

const readChargesMap = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(ABILITY_CHARGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const writeChargesMap = (m: Record<string, number>) => {
  localStorage.setItem(ABILITY_CHARGES_KEY, JSON.stringify(m));
};

export const getAbilityCharges = (carId: string): number => {
  return readChargesMap()[carId] || 0;
};

export const buyAbility = (carId: string): { ok: boolean; reason?: string } => {
  const car = CARS.find(c => c.id === carId);
  if (!car) return { ok: false, reason: "Unknown car" };
  const cost = car.abilityCost ?? ABILITY_COST;
  const diamonds = getDiamonds();
  if (diamonds < cost) return { ok: false, reason: "Not enough diamonds" };
  setDiamonds(diamonds - cost);
  const map = readChargesMap();
  map[carId] = (map[carId] || 0) + ABILITY_USES_PER_PURCHASE;
  writeChargesMap(map);
  return { ok: true };
};

export const useAbilityCharge = (carId: string): boolean => {
  const map = readChargesMap();
  const current = map[carId] || 0;
  if (current <= 0) return false;
  map[carId] = current - 1;
  writeChargesMap(map);
  return true;
};
