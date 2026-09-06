import { describe,it,expect } from 'vitest';
import { initialState,harvestResource,dayEnd,gather,availableForage,eligibleFish,travel } from './engine';
import { fishingAnchor,RecastGuard,startFishing } from './fishing';
import { SCENES,passable,treeStage } from './world';
import { growWorld } from './ecology';
import { parseSave,validSave } from './persistence';
import { areaOpen,levelOf,purchaseArea,forestEvent } from './progression';
import { fishingPanelPosition,hudOnLeft } from './overlays';

describe('water anchors and recast input',()=>{
  it('places the bobber inside water for every reachable side of every fishing spot',()=>{
    for(const scene of Object.values(SCENES))for(const [x,y] of scene.fishing)for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
      if(!passable(scene.id,x+dx,y+dy))continue;
      const s=initialState(1);Object.assign(s.player,{scene:scene.id,x:x+dx,y:y+dy});
      const p=fishingAnchor(s)!;expect(p,scene.id).toBeTruthy();
      expect(scene.objects.some(o=>o.kind==='water'&&p.x>o.x+.5&&p.x<o.x+o.w-.5&&p.y>o.y+.5&&p.y<o.y+o.h-.5)).toBe(true);
      expect(startFishing(s,()=>0)!.anchor).toEqual(p);
    }
  });
  it('blocks quick taps and held space even after the cooldown expires',()=>{
    const g=new RecastGuard();g.input(' ',true);g.finish();g.tick(2);expect(g.ready).toBe(false);
    g.input(' ',false);expect(g.ready).toBe(true);g.finish();g.input(' ',true);g.input(' ',false);g.tick(.5);expect(g.ready).toBe(false);g.tick(.71);expect(g.ready).toBe(true);
  });
  it('waits for all held controls to release and does not advance on pause',()=>{
    const g=new RecastGuard();g.input(' ',true);g.input('pointer',true);g.finish();g.tick(0);expect(g.remaining).toBe(1.2);g.tick(2);g.input(' ',false);expect(g.ready).toBe(false);g.input('pointer',false);expect(g.ready).toBe(true);
  });
  it('keeps the nearby panel within the frame and away from the HUD',()=>{
    const hud={x:630,y:12,width:350,height:105};
    const p=fishingPanelPosition({x:650,y:120},{width:1000,height:625},{width:170,height:205},[hud]);
    expect(p.x+p.width).toBeLessThanOrEqual(1000);expect(p.y).toBeGreaterThanOrEqual(8);expect(p.x+p.width<=hud.x||p.y>=hud.y+hud.height).toBe(true);
  });
  it('moves the HUD early and uses a wider threshold to avoid flickering back',()=>{
    const f={width:1000,height:625},h={width:330,height:110};expect(hudOnLeft(false,{x:600,y:140},f,h)).toBe(true);expect(hudOnLeft(true,{x:570,y:140},f,h)).toBe(true);expect(hudOnLeft(true,{x:490,y:140},f,h)).toBe(false);
  });
});
describe('slower living world',()=>{
  it('regrows cut trees through two visible stages before restoring collision',()=>{
    const s=initialState(1);Object.assign(s.player,{x:10,y:4});s.selectedTool='axe';harvestResource(s,10,3);
    const o=SCENES.farm.objects.find(o=>o.id==='f2')!;
    expect(treeStage(s,'farm',o)).toBe('sapling');
    for(let d=1;d<=6;d++){dayEnd(s,false,()=>.9);expect(validSave(s)).toBe(true);expect(treeStage(s,'farm',o)).toBe(d<3?'sapling':d<6?'young':'mature');}
    expect(s.clearedObjects).not.toContain('farm:f2');expect(passable('farm',10,3,s.clearedObjects,s.ecology.trees)).toBe(false);
  });
  it('prevents chopping immature trees and growing a solid tree under the player',()=>{
    const s=initialState(1);Object.assign(s.player,{x:15,y:4});s.selectedTool='axe';const before=JSON.stringify(s);expect(harvestResource(s,15,3).ok).toBe(false);expect(JSON.stringify(s)).toBe(before);
    s.ecology.trees['farm:f3']=5;s.player.y=3;growWorld(s);expect(s.ecology.trees['farm:f3']).toBe(5);expect(validSave(s)).toBe(true);
  });
  it('restores wild forage after three days, materials after five, and farm food daily',()=>{
    const s=initialState(1);Object.assign(s.player,{scene:'forest',x:5,y:6});gather(s,5,6);Object.assign(s.player,{x:11,y:10});s.selectedTool='axe';gather(s,11,10);
    Object.assign(s.player,{scene:'farm',x:2,y:9});gather(s,2,9);
    for(let d=1;d<=5;d++){dayEnd(s,false,()=>.9);expect(availableForage(s,'farm').some(n=>n.id==='food0')).toBe(true);expect(availableForage(s,'forest').some(n=>n.id==='forage0')).toBe(d>=3);expect(availableForage(s,'forest').some(n=>n.id==='wood0')).toBe(d>=5);}
  });
  it('preserves recovery deadlines after reload and rejects invalid ecology',()=>{
    const s=initialState(1);Object.assign(s.player,{scene:'forest',x:5,y:6});gather(s,5,6);const r=parseSave(JSON.stringify(s))!;expect(r.ecology.nodeReady['forest:forage0']).toBe(4);
    for(const mutate of [(x:any)=>x.ecology.trees['farm:f2']=9,(x:any)=>x.ecology.nodeReady.fake=3,(x:any)=>x.ecology.eventReady.coastGift=-1]){const c=structuredClone(s);mutate(c);expect(parseSave(JSON.stringify(c))).toBeNull();}
  });
  it('migrates old experience once without losing earned levels or paid regions',()=>{
    const old:any=initialState(1);delete old.ecology;old.progression.xp=280;old.progression.areas=['coast'];old.clearedObjects=['farm:f2'];
    const s=parseSave(JSON.stringify(old))!;expect(s.progression.xp).toBe(840);expect(levelOf(s)).toBe(5);expect(areaOpen(s,'quarry')).toBe(true);expect(areaOpen(s,'coast')).toBe(true);expect(s.ecology.trees['farm:f2']).toBe(0);expect(parseSave(JSON.stringify(s))!.progression.xp).toBe(840);
  });
  it('takes more production to reach the first upgrade',()=>{const s=initialState(1);s.progression.xp=40;expect(levelOf(s)).toBe(1);s.progression.xp=120;expect(levelOf(s)).toBe(2);});
});
describe('new connected regions',()=>{
  it('purchases the coast at its lake gate, travels and returns safely',()=>{
    const s=initialState(1);Object.assign(s.player,{scene:'lake',x:6,y:18});s.gold=400;expect(travel(s,'coast').ok).toBe(false);expect(purchaseArea(s,'coast').ok).toBe(true);expect(s.gold).toBe(50);expect(travel(s,'coast').ok).toBe(true);expect(validSave(s)).toBe(true);expect(travel(s,'lake').ok).toBe(true);
  });
  it('opens the ridge at level six and keeps a fish pool through all seasons and weather',()=>{
    const s=initialState(1);s.progression.xp=1260;Object.assign(s.player,{scene:'quarry',x:30,y:10});expect(travel(s,'ridge').ok).toBe(true);expect(validSave(s)).toBe(true);expect(travel(s,'quarry').ok).toBe(true);
    for(const scene of ['coast','ridge'] as const)for(const day of [1,15,29,43])for(const weather of ['sun','rain','snow'] as const)for(const minute of [360,720,1200,1500]){s.player.scene=scene;s.calendar={day,weather,minute};expect(eligibleFish(s).length).toBeGreaterThan(0);}
  });
  it('does not grant regional gifts again after one night or a reload',()=>{
    const s=initialState(1);s.progression.areas=['coast'];Object.assign(s.player,{scene:'coast',x:9,y:8});expect(forestEvent(s,'coastGift').ok).toBe(true);dayEnd(s,false,()=>.9);Object.assign(s.player,{scene:'coast',x:9,y:8});expect(forestEvent(parseSave(JSON.stringify(s))!,'coastGift').ok).toBe(false);
  });
});
