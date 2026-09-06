export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'sun' | 'rain' | 'snow';
export type SceneId = 'farm' | 'home' | 'town' | 'forest' | 'lake' | 'grove' | 'quarry';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Tool = 'hoe' | 'seed' | 'water' | 'hand' | 'rod' | 'axe' | 'pick';
export type RNG = () => number;
export interface Appearance { skin: number; hair: number; outfit: number; hat: number }
export interface PlayerVitals { health: number; stamina: number; hunger: number }
export interface CalendarState { day: number; minute: number; weather: Weather }
export interface Stack { id: string; count: number }
export interface Inventory { capacity: number; slots: Stack[] }
export interface Plot { tilled: boolean; crop: null | { id: string; growth: number; watered: boolean } }
export interface Discovery { count: number; firstDay: number }
export interface Order { id: string; item: string; count: number; reward: number; done: boolean }
export interface GameStateV2 {
  version: 2;
  rng: number;
  calendar: CalendarState;
  player: { scene: SceneId; x: number; y: number; direction: Direction; appearance: Appearance; vitals: PlayerVitals };
  gold: number;
  inventory: Inventory;
  chest: Inventory;
  shipping: Stack[];
  legacyPending: number;
  plots: Plot[];
  weeds: number[];
  clearedObjects: string[];
  selectedTool: Tool;
  selectedSeed: string;
  upgrades: { farm: number; tools: number; rod: number; bag: number };
  stats: { planted: number; harvested: number; shipped: number; cooked: number; caught: number; orders: number; revenue: number; reputation: number; boughtAfterShipping: boolean };
  discoveries: Record<string, Discovery>;
  gathered: string[];
  orders: Order[];
  unlocked: { outfits: number[]; hats: number[] };
  settings: { fishingAssist: boolean; sound: boolean; music: boolean; volume: number; hud: boolean; hudWidth: number };
  progression: { xp: number; areas: string[]; forestEvents: string[]; fishingRotation: number };
  pendingCatch: string | null;
  lastSettlement: number;
}
export interface Food { health: number; stamina: number; hunger: number }
export interface ItemDefinition { id: string; name: string; kind: 'seed' | 'crop' | 'fish' | 'forage' | 'meal' | 'material'; color: string; sell: number; buy?: number; food?: Food; description: string }
export interface CropDefinition { id: string; name: string; seasons: Season[]; days: number; regrow: number; seedPrice: number; sell: number; color: string }
export interface FishDefinition { id: string; name: string; rarity: number; seasons: Season[]; weather: Weather[]; hours: [number, number]; scenes: SceneId[]; sell: number; color: string }
export interface Recipe { id: string; name: string; ingredients: Stack[]; food: Food; sell: number }
export interface Result { ok: boolean; message: string; effect?: 'water' | 'soil' | 'harvest' | 'food'; dayEnded?: boolean }
