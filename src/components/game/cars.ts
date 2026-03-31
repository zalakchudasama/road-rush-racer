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
}

export const CARS: CarData[] = [
  { id: "starter", name: "Street Racer", emoji: "🏎️", price: 0, color1: "#ff4444", color2: "#cc0000", color3: "#880000", speed: 0, description: "Your first ride" },
  { id: "nano", name: "Tata Nano", emoji: "🚗", price: 7000, color1: "#44dd44", color2: "#22aa22", color3: "#116611", speed: 0, description: "Small & quick" },
  { id: "swift", name: "Maruti Swift", emoji: "🚙", price: 9000, color1: "#4488ff", color2: "#2266cc", color3: "#114488", speed: 1, description: "Smooth handler" },
  { id: "fortuner", name: "Toyota Fortuner", emoji: "🚐", price: 12000, color1: "#ffffff", color2: "#cccccc", color3: "#888888", speed: 1, description: "Big & powerful" },
  { id: "scorpio", name: "Mahindra Scorpio", emoji: "🛻", price: 15000, color1: "#111111", color2: "#333333", color3: "#000000", speed: 2, description: "Beast on road" },
  { id: "mustang", name: "Ford Mustang", emoji: "🐎", price: 20000, color1: "#ffcc00", color2: "#ddaa00", color3: "#aa7700", speed: 2, description: "American muscle" },
  { id: "lambo", name: "Lamborghini", emoji: "🏁", price: 35000, color1: "#ff6600", color2: "#dd4400", color3: "#aa2200", speed: 3, description: "Ultimate speed" },
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
