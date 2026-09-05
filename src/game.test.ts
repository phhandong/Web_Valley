import { describe, expect, it } from 'vitest';
import { buySeeds, createInitialState, isValidState, shipAll, sleep, useTool } from './game';

function plantedState() {
  const state=createInitialState();
  state.selectedTool='hoe';useTool(state,10,6);
  state.selectedTool='seed';useTool(state,10,6);
  return state;
}

describe('农场规则',()=>{
  it('需要松土后才能播种，并正确扣除种子',()=>{
    const state=createInitialState();state.selectedTool='seed';
    expect(useTool(state,10,6).ok).toBe(false);
    state.selectedTool='hoe';expect(useTool(state,10,6).ok).toBe(true);
    state.selectedTool='seed';expect(useTool(state,10,6).ok).toBe(true);
    expect(state.seeds).toBe(4);
  });

  it('同一天不能重复浇水，只有浇水过夜才成长',()=>{
    const state=plantedState();state.selectedTool='water';
    expect(useTool(state,10,6).ok).toBe(true);
    expect(useTool(state,10,6).ok).toBe(false);
    sleep(state);expect(state.plots[0].crop?.growth).toBe(1);
    sleep(state);expect(state.plots[0].crop?.growth).toBe(1);
  });

  it('两次浇水过夜后成熟并且只能收获一次',()=>{
    const state=plantedState();state.selectedTool='water';
    useTool(state,10,6);sleep(state);useTool(state,10,6);sleep(state);
    state.selectedTool='hand';expect(useTool(state,10,6).ok).toBe(true);
    expect(state.crops).toBe(1);expect(useTool(state,10,6).ok).toBe(false);expect(state.crops).toBe(1);
  });

  it('购买会扣款，余额不足时保持状态',()=>{
    const state=createInitialState();expect(buySeeds(state,5).ok).toBe(true);
    expect(state.gold).toBe(0);expect(state.seeds).toBe(10);
    expect(buySeeds(state,1).ok).toBe(false);expect(state.seeds).toBe(10);
  });

  it('出货次日结算',()=>{
    const state=createInitialState();state.crops=3;
    shipAll(state);expect(state.crops).toBe(0);expect(state.pendingGold).toBe(75);expect(state.gold).toBe(50);
    expect(sleep(state)).toBe(75);expect(state.gold).toBe(125);expect(state.pendingGold).toBe(0);
  });

  it('可验证序列化恢复的存档',()=>{
    const state=createInitialState();state.day=4;state.plots[0].tilled=true;
    const restored:unknown=JSON.parse(JSON.stringify(state));
    expect(isValidState(restored)).toBe(true);expect((restored as typeof state).day).toBe(4);expect((restored as typeof state).plots[0].tilled).toBe(true);
    expect(isValidState({version:1,plots:[]})).toBe(false);
  });
});
