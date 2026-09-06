import { describe,it,expect } from 'vitest';
import { initialState,dayEnd,travel,gather,toolCost,acceptCatch } from './engine';
import { areaOpen,levelOf,purchaseArea,forestEvent } from './progression';
import { add,quantity } from './inventory';
import { parseSave,validSave } from './persistence';
import { startFishing,tickFishing,reel } from './fishing';
import type { GameStateV2 } from './types';
function at(s:GameStateV2,x:number,y:number){s.player.scene='forest';s.player.x=x;s.player.y=y;}
describe('exploration progression',()=>{
  it('locks entry, opens at the exact level threshold, and keeps a safe return path',()=>{
    const s=initialState(1);at(s,30,6);expect(travel(s,'grove').ok).toBe(false);s.progression.xp=299;expect(areaOpen(s,'grove')).toBe(false);s.progression.xp=300;expect(levelOf(s)).toBe(3);expect(travel(s,'grove').ok).toBe(true);expect(validSave(s)).toBe(true);expect(travel(s,'forest').ok).toBe(true);expect(s.player.scene).toBe('forest');
  });
  it('purchases only at the correct gate and charges once, with no level requirement',()=>{
    const s=initialState(1);s.gold=500;expect(purchaseArea(s,'grove').ok).toBe(false);at(s,30,6);expect(purchaseArea(s,'grove').ok).toBe(true);expect(s.gold).toBe(320);expect(purchaseArea(s,'grove').ok).toBe(false);expect(s.gold).toBe(320);expect(parseSave(JSON.stringify(s))!.progression.areas).toEqual(['grove']);at(s,30,17);expect(purchaseArea(s,'quarry').ok).toBe(false);expect(s.gold).toBe(320);
  });
  it('requires all clues, pays the cache once, and resets only on a new day',()=>{
    const s=initialState(1);at(s,6,4);expect(forestEvent(s,'cache').ok).toBe(false);
    for(const [id,x,y] of [['trail1',9,6],['trail2',26,13],['trail3',12,17]] as const){at(s,x,y);expect(forestEvent(s,id).ok).toBe(true);expect(forestEvent(s,id).ok).toBe(false)}
    at(s,6,4);expect(forestEvent(s,'cache').ok).toBe(true);expect(s.gold).toBe(110);expect(s.progression.xp).toBe(54);expect(forestEvent(s,'cache').ok).toBe(false);const recovered=parseSave(JSON.stringify(s))!;expect(forestEvent(recovered,'cache').ok).toBe(false);dayEnd(s);expect(s.progression.forestEvents).toEqual([]);
  });
  it('fox trades atomically and the spring recovers once per day',()=>{
    const s=initialState(1);at(s,10,8);expect(forestEvent(s,'fox').ok).toBe(false);add(s.inventory,'berry',2);expect(forestEvent(s,'fox').ok).toBe(true);expect(quantity(s.inventory,'berry')).toBe(0);expect(s.gold).toBe(75);expect(forestEvent(s,'fox').ok).toBe(false);at(s,18,7);s.player.vitals.stamina=0;expect(forestEvent(s,'spring').ok).toBe(true);expect(s.player.vitals.stamina).toBe(25);expect(forestEvent(s,'spring').ok).toBe(false);
  });
  it('full inventory does not consume daily regional rewards',()=>{
    const s=initialState(1);s.progression.xp=100;s.player.scene='grove';s.player.x=13;s.player.y=7;s.inventory.slots=Array.from({length:24},()=>({id:'wood',count:99}));expect(forestEvent(s,'groveGift').ok).toBe(false);expect(s.progression.forestEvents).toEqual([]);s.inventory.slots.pop();expect(forestEvent(s,'groveGift').ok).toBe(true);expect(quantity(s.inventory,'apple')).toBe(3);
  });
  it('successful production gives experience; failed and duplicate actions do not',()=>{
    const s=initialState(1);s.player.x=2;s.player.y=9;expect(gather(s,2,9).ok).toBe(true);expect(s.progression.xp).toBe(2);gather(s,2,9);expect(s.progression.xp).toBe(2);s.pendingCatch='crucian';acceptCatch(s);expect(s.progression.xp).toBe(14);acceptCatch(s);expect(s.progression.xp).toBe(14);
  });
});
describe('compatibility and fishing balance',()=>{
  it('adds defaults to existing V2 without losing progress',()=>{
    const s:any=initialState(42);s.gold=321;delete s.progression;delete s.settings.music;delete s.settings.volume;delete s.settings.hud;delete s.settings.hudWidth;const restored=parseSave(JSON.stringify(s))!;expect(restored.gold).toBe(321);expect(restored.settings).toMatchObject({music:true,volume:35,hud:false,hudWidth:260});expect(restored.progression.xp).toBe(0);expect(validSave(restored)).toBe(true);
  });
  it('rejects malformed progression and settings',()=>{
    for(const mutate of [(s:any)=>s.progression.xp=-1,(s:any)=>s.progression.areas=['unknown'],(s:any)=>s.progression.forestEvents=['fox','fox'],(s:any)=>s.settings.volume=500,(s:any)=>s.settings.hudWidth=0]){const s=initialState(1);mutate(s);expect(parseSave(JSON.stringify(s))).toBe(null)}
  });
  it('challenge fishing is narrower and has a shorter reaction window; upgraded rods help',()=>{
    const s=initialState(1);s.player.x=5;s.player.y=10;s.stats.caught=6;s.progression.fishingRotation=3;const f=startFishing(s,()=>0)!;expect(f.range).toBe(.18);tickFishing(f,4,false);expect(f.timer).toBe(1.25);s.settings.fishingAssist=true;s.upgrades.rod=2;s.progression.fishingRotation=3;const assisted=startFishing(s,()=>0)!;expect(assisted.range).toBeCloseTo(.47);tickFishing(assisted,4,false);expect(assisted.timer).toBe(2.2);
  });
  it('idle fishing loses, but an assisted tracking player still wins',()=>{
    const s=initialState(1);s.player.x=5;s.player.y=10;s.stats.caught=6;s.progression.fishingRotation=3;const idle=startFishing(s,()=>0)!;tickFishing(idle,4,false);reel(idle);for(let i=0;i<3000&&idle.stage==='reeling';i++)tickFishing(idle,1/60,false);expect(idle.stage).toBe('lost');s.settings.fishingAssist=true;s.progression.fishingRotation=3;const f=startFishing(s,()=>0)!;tickFishing(f,4,false);reel(f);for(let i=0;i<3000&&f.stage==='reeling';i++)tickFishing(f,1/60,f.float>f.fishY);expect(f.stage).toBe('won');
  });
  it('labour upgrades reduce work cost without discounting casts',()=>{
    const s=initialState(1);expect(toolCost(s,3)).toBe(3);s.upgrades.tools=2;expect(toolCost(s,3)).toBe(1);s.player.x=5;s.player.y=10;startFishing(s,()=>0);expect(s.player.vitals.stamina).toBe(95);
  });
});
