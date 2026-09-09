import { describe,it,expect } from 'vitest';
import { initialState,harvestResource,step,dayEnd } from './engine';
import { quantity } from './inventory';
import { parseSave,validSave } from './persistence';
import { SCENES,passable } from './world';

function tree(){const s=initialState(42);Object.assign(s.player,{x:10,y:4,direction:'up'});s.selectedTool='axe';return s;}
describe('tree cutting and rock mining',()=>{
  it('cuts a whole tree and releases every occupied tile',()=>{
    const s=tree();expect(step(s,'up').ok).toBe(false);
    for(let i=0;i<6;i++)expect(harvestResource(s,10,3).ok).toBe(true);expect(quantity(s.inventory,'wood')).toBe(6);expect(s.player.vitals.stamina).toBe(94);
    expect(s.clearedObjects).toContain('farm:f2');expect(step(s,'up').ok).toBe(true);
    for(const x of [10,11])for(const y of [2,3])expect(passable('farm',x,y,s.clearedObjects)).toBe(true);
    expect(SCENES.farm.objects.some(o=>o.id==='f2')).toBe(true);
  });
  it('mines rocks, applies upgrades, and never gives the same reward twice',()=>{
    const s=initialState(42);Object.assign(s.player,{x:8,y:9});s.selectedTool='pick';s.upgrades.tools=2;
    for(let i=0;i<2;i++)expect(harvestResource(s,8,8).ok).toBe(true);expect(quantity(s.inventory,'stone')).toBe(8);expect(s.player.vitals.stamina).toBe(98);
    const before=JSON.stringify(s);expect(harvestResource(s,8,8).ok).toBe(false);expect(JSON.stringify(s)).toBe(before);
  });
  it('rejects wrong tools and remote actions without changing state',()=>{
    const s=tree();s.selectedTool='pick';const before=JSON.stringify(s);expect(harvestResource(s,10,3).ok).toBe(false);expect(JSON.stringify(s)).toBe(before);
    s.selectedTool='axe';s.player.y=8;const remote=JSON.stringify(s);expect(harvestResource(s,10,3).ok).toBe(false);expect(JSON.stringify(s)).toBe(remote);
  });
  it('does not spend stamina or clear scenery if the backpack cannot hold all materials',()=>{
    const s=tree();s.inventory.slots=Array.from({length:24},()=>({id:'wood',count:99}));s.inventory.slots[0].count=95;s.fieldwork.damage['farm:f2']=10;
    const before=JSON.stringify(s);expect(harvestResource(s,10,3).ok).toBe(false);expect(JSON.stringify(s)).toBe(before);
  });
  it('does not remove resources or give rewards if stamina is insufficient',()=>{
    const s=tree();s.player.vitals.stamina=0;const before=JSON.stringify(s);expect(harvestResource(s,10,3).ok).toBe(false);expect(JSON.stringify(s)).toBe(before);
  });
  it('restores a player inside a cleared tree and preserves clearing overnight',()=>{
    const s=tree();for(let i=0;i<6;i++)harvestResource(s,10,3);step(s,'up');expect(validSave(s)).toBe(true);
    const restored=parseSave(JSON.stringify(s))!;expect(restored.player.y).toBe(3);expect(restored.clearedObjects).toEqual(['farm:f2']);
    dayEnd(restored,false,()=>.9);expect(restored.clearedObjects).toEqual(['farm:f2']);expect(validSave(restored)).toBe(true);
  });
  it('preserves interactive rocks and rejects forged clearing records',()=>{
    const s=tree();Object.assign(s.player,{scene:'forest',x:18,y:7});s.selectedTool='pick';expect(harvestResource(s,18,8).ok).toBe(false);
    for(const cleared of [['forest:spring'],['farm:pond'],['farm:f2','farm:f2'],[null]]){s.clearedObjects=cleared as string[];expect(parseSave(JSON.stringify(s))).toBeNull()}
  });
  it('migrates an older farm safely even if the player stands where new rocks would appear',()=>{
    const old:any=tree();delete old.clearedObjects;Object.assign(old.player,{x:8,y:8});
    const restored=parseSave(JSON.stringify(old))!;expect(restored.player.x).toBe(8);expect(restored.clearedObjects).toContain('farm:farmrock1');expect(validSave(restored)).toBe(true);
  });
});
