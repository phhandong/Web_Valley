export type Tool = 'hoe' | 'seed' | 'water' | 'hand';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Plot {
  tilled: boolean;
  crop: null | { growth: number; watered: boolean };
}

export interface QuestState {
  planted: number;
  harvested: number;
  shipped: number;
  boughtAfterShipping: boolean;
}

export interface GameState {
  version: 1;
  day: number;
  gold: number;
  pendingGold: number;
  seeds: number;
  crops: number;
  selectedTool: Tool;
  player: { x: number; y: number; direction: Direction };
  plots: Plot[];
  quests: QuestState;
}

export const FARM = { x: 10, y: 6, cols: 6, rows: 5 } as const;
export const SEED_PRICE = 10;
export const CROP_PRICE = 25;

export function createInitialState(): GameState {
  return {
    version: 1,
    day: 1,
    gold: 50,
    pendingGold: 0,
    seeds: 5,
    crops: 0,
    selectedTool: 'hoe',
    player: { x: 8, y: 8, direction: 'right' },
    plots: Array.from({ length: FARM.cols * FARM.rows }, () => ({ tilled: false, crop: null })),
    quests: { planted: 0, harvested: 0, shipped: 0, boughtAfterShipping: false }
  };
}

export function plotIndexAt(tileX: number, tileY: number): number {
  if (tileX < FARM.x || tileX >= FARM.x + FARM.cols || tileY < FARM.y || tileY >= FARM.y + FARM.rows) return -1;
  return (tileY - FARM.y) * FARM.cols + tileX - FARM.x;
}

export type ActionResult = { ok: boolean; message: string };

export function useTool(state: GameState, tileX: number, tileY: number): ActionResult {
  const index = plotIndexAt(tileX, tileY);
  if (index < 0) return { ok: false, message: '这里不是可耕作的土地' };
  const plot = state.plots[index];

  if (state.selectedTool === 'hoe') {
    if (plot.tilled) return { ok: false, message: '这块地已经松过土了' };
    plot.tilled = true;
    return { ok: true, message: '松软的泥土散发着清香' };
  }
  if (state.selectedTool === 'seed') {
    if (!plot.tilled) return { ok: false, message: '先用锄头松土吧' };
    if (plot.crop) return { ok: false, message: '这里已经种着东西了' };
    if (state.seeds <= 0) return { ok: false, message: '种子用完了，去杂货摊看看吧' };
    state.seeds -= 1;
    plot.crop = { growth: 0, watered: false };
    state.quests.planted += 1;
    return { ok: true, message: '种下了一颗萝卜种子' };
  }
  if (state.selectedTool === 'water') {
    if (!plot.crop) return { ok: false, message: plot.tilled ? '这块地还没有播种' : '先松土再播种吧' };
    if (plot.crop.growth >= 2) return { ok: false, message: '萝卜已经成熟，可以收获了' };
    if (plot.crop.watered) return { ok: false, message: '今天已经浇过水了' };
    plot.crop.watered = true;
    return { ok: true, message: '水珠落进了土里' };
  }
  if (!plot.crop || plot.crop.growth < 2) return { ok: false, message: '这里还没有成熟的作物' };
  plot.crop = null;
  state.crops += 1;
  state.quests.harvested += 1;
  return { ok: true, message: '收获了一颗脆生生的萝卜！' };
}

export function sleep(state: GameState): number {
  const earned = state.pendingGold;
  state.gold += earned;
  state.pendingGold = 0;
  state.day += 1;
  for (const plot of state.plots) {
    if (!plot.crop) continue;
    if (plot.crop.watered && plot.crop.growth < 2) plot.crop.growth += 1;
    plot.crop.watered = false;
  }
  return earned;
}

export function buySeeds(state: GameState, amount: number): ActionResult {
  const cost = amount * SEED_PRICE;
  if (state.gold < cost) return { ok: false, message: '金币不够，先去收获萝卜吧' };
  state.gold -= cost;
  state.seeds += amount;
  if (state.quests.shipped >= 5) state.quests.boughtAfterShipping = true;
  return { ok: true, message: `买到了 ${amount} 颗萝卜种子` };
}

export function shipAll(state: GameState): ActionResult {
  if (state.crops <= 0) return { ok: false, message: '背包里没有可以出售的萝卜' };
  const count = state.crops;
  state.crops = 0;
  state.pendingGold += count * CROP_PRICE;
  state.quests.shipped += count;
  return { ok: true, message: `${count} 颗萝卜已装箱，明早结算` };
}

export function isValidState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<GameState>;
  return state.version === 1 && typeof state.day === 'number' && typeof state.gold === 'number' &&
    typeof state.seeds === 'number' && typeof state.crops === 'number' && Array.isArray(state.plots) &&
    state.plots.length === FARM.cols * FARM.rows && !!state.player && !!state.quests;
}

export function questComplete(state: GameState): boolean {
  return state.quests.planted >= 5 && state.quests.harvested >= 5 && state.quests.shipped >= 5 && state.quests.boughtAfterShipping;
}
