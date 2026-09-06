import { describe,it,expect } from 'vitest';
import { initialState,farmAction,dayEnd } from './engine';
import { quantity,sortInventory,add,transfer } from './inventory';
import { parseSave,validSave } from './persistence';
import { isUnlockedPlot,FARM } from './world';
import type { Inventory } from './types';

function field(){const s=initialState(42);s.player.x=12;s.player.y=8;return s;}
describe('pioneering and backpack',()=>{
  it('starts with dense weeds on the field, including the expansion land',()=>{
    const s=field();expect(s.weeds.length).toBeGreaterThan(80);
    expect(s.weeds.filter(i=>isUnlockedPlot(s,FARM.x+i%12,FARM.y+Math.floor(i/12))).length).toBeGreaterThan(20);
    expect(validSave(s)).toBe(true);
  });
  it('clears, tills and plants in separate steps, rewarding fiber once',()=>{
    const s=field();expect(farmAction(s,12,8).ok).toBe(true);
    expect(s.plots[0].tilled).toBe(false);expect(s.weeds).not.toContain(0);
    expect(quantity(s.inventory,'fiber')).toBe(1);expect(s.player.vitals.stamina).toBe(98);
    expect(s.progression.xp).toBe(2);
    expect(farmAction(s,12,8).ok).toBe(true);expect(s.plots[0].tilled).toBe(true);
    s.selectedTool='seed';expect(farmAction(s,12,8).ok).toBe(true);
    expect(s.plots[0].crop?.id).toBe('radish');expect(quantity(s.inventory,'fiber')).toBe(1);
    expect(validSave(s)).toBe(true);
  });
  it('rejects wrong tools, distance and locked land without charges',()=>{
    const s=field();s.selectedTool='seed';const before=JSON.stringify(s);
    expect(farmAction(s,12,8).ok).toBe(false);expect(JSON.stringify(s)).toBe(before);
    s.selectedTool='hoe';const next=JSON.stringify(s);
    expect(farmAction(s,14,8).ok).toBe(false);expect(farmAction(s,20,8).ok).toBe(false);expect(JSON.stringify(s)).toBe(next);
  });
  it('retains weeds and rewards when the backpack is full or stamina is insufficient',()=>{
    for(const full of [true,false]){const s=field();
      if(full)s.inventory.slots=Array.from({length:24},()=>({id:'wood',count:99}));else s.player.vitals.stamina=1;
      const before=JSON.stringify(s);expect(farmAction(s,12,8).ok).toBe(false);expect(JSON.stringify(s)).toBe(before);
    }
  });
  it('preserves cleared land across sleep and save restore',()=>{
    const s=field();farmAction(s,12,8);dayEnd(s,false,()=>.9);
    const restored=parseSave(JSON.stringify(s))!;expect(restored.weeds).toEqual(s.weeds);
    expect(restored.weeds).not.toContain(0);expect(quantity(restored.inventory,'fiber')).toBe(1);
  });
  it('loads older V2 farms without introducing weeds onto existing plots',()=>{
    const old:any=field();delete old.weeds;old.plots[0]={tilled:true,crop:{id:'radish',growth:1,watered:true}};
    const restored=parseSave(JSON.stringify(old))!;expect(restored.weeds).toEqual([]);expect(restored.plots[0]).toEqual(old.plots[0]);
  });
  it('rejects corrupt, duplicate and cultivated weed positions',()=>{
    for(const weeds of [[-1],[120],[0,0],['0'],null]){const s=field();(s as any).weeds=weeds;expect(parseSave(JSON.stringify(s))).toBeNull()}
    const s=field();s.plots[0].tilled=true;expect(validSave(s)).toBe(false);
  });
  it('sorts and merges partial stacks without changing totals or exceeding 99',()=>{
    const bag:Inventory={capacity:24,slots:[{id:'fiber',count:70},{id:'ration',count:3},{id:'fiber',count:50},{id:'seed_radish',count:5}]};
    expect(sortInventory(bag)).toBe(true);expect(bag.slots.map(s=>s.id)).toEqual(['seed_radish','ration','fiber','fiber']);
    expect(bag.slots.filter(s=>s.id==='fiber').map(s=>s.count)).toEqual([99,21]);expect(quantity(bag,'ration')).toBe(3);
    const once=JSON.stringify(bag);sortInventory(bag);expect(JSON.stringify(bag)).toBe(once);
  });
  it('stores clearing rewards in the chest and restores quantities',()=>{
    const s=field();farmAction(s,12,8);expect(transfer(s.inventory,s.chest,'fiber',1)).toBe(true);
    expect(quantity(s.inventory,'fiber')).toBe(0);expect(transfer(s.chest,s.inventory,'fiber',1)).toBe(true);
    expect(quantity(s.inventory,'fiber')).toBe(1);expect(add(s.inventory,'fiber',100)).toBe(true);
    expect(quantity(parseSave(JSON.stringify(s))!.inventory,'fiber')).toBe(101);
  });
});
