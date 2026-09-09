import { describe,it,expect } from 'vitest';
import { initialState,dayEnd } from './engine';
import { parseSave,validSave } from './persistence';
import { gift,storyAction,talk,villagerNodes,storyNodes } from './villagers';
import { placeMachine,startProcessing,collectMachine,storeMachine } from './facilities';
import { generateEncounters,encounterNodes,investigateEncounter,ENCOUNTERS } from './encounters';
import { passable } from './world';
import { add,quantity } from './inventory';

describe('Valley life integration smoke checks',()=>{
  it('migrates missing modules without changing existing progress, and rejects damaged modules',()=>{
    const s=initialState(22),old=JSON.parse(JSON.stringify(s));delete old.social;delete old.facilities;delete old.encounters;
    const restored=parseSave(JSON.stringify(old))!;expect(restored.gold).toBe(s.gold);expect(restored.plots).toEqual(s.plots);expect(validSave(restored)).toBe(true);
    old.social={version:1,people:{}};expect(parseSave(JSON.stringify(old))).toBeNull();
  });
  it('limits gifts and conversations, and advances a story atomically',()=>{
    const s=initialState(22);s.calendar.minute=600;s.player.scene='town';s.player.x=9;s.player.y=8;
    expect(talk(s,'ahe').ok).toBe(true);talk(s,'ahe');expect(s.social.people.ahe.hearts).toBe(2);
    add(s.inventory,'radish',4);expect(gift(s,'ahe','radish').ok).toBe(true);expect(gift(s,'ahe','radish').ok).toBe(false);
    expect(storyAction(s,'ahe').ok).toBe(true);expect(storyAction(s,'ahe').ok).toBe(true);expect(s.social.people.ahe.stage).toBe(1);expect(quantity(s.inventory,'radish')).toBe(0);
    expect(storyAction(s,'ahe').ok).toBe(false);expect(validSave(s)).toBe(true);
  });
  it('places, produces, collects once, and stores only the selected device',()=>{
    const s=initialState(5);s.weeds=[];s.facilities.stored.preserver=2;
    expect(placeMachine(s,'preserver',12,8).ok).toBe(true);expect(placeMachine(s,'preserver',13,8).ok).toBe(true);
    s.player.x=12;s.player.y=9;add(s.inventory,'berry',2);expect(startProcessing(s,1,'jam_berry').ok).toBe(true);
    expect(storeMachine(s,1).ok).toBe(false);expect(validSave(s)).toBe(true);
    dayEnd(s,false,()=>.9);expect(s.facilities.machines[0].output).toBe('jam_berry');
    s.player.scene='farm';s.player.x=12;s.player.y=9;expect(collectMachine(s,1).ok).toBe(true);expect(collectMachine(s,1).ok).toBe(false);
    expect(storeMachine(s,1).ok).toBe(true);expect(s.facilities.machines.map(m=>m.id)).toEqual([2]);expect(validSave(s)).toBe(true);
  });
  it('sprinkles only at dawn and preserves new crops for manual watering',()=>{
    const s=initialState(5);s.weeds=[];s.facilities.stored.sprinkler=1;expect(placeMachine(s,'sprinkler',13,9).ok).toBe(true);
    s.plots[12]={tilled:true,crop:{id:'radish',growth:0,watered:false}};
    expect(s.plots[12].crop!.watered).toBe(false);dayEnd(s,false,()=>.9);expect(s.plots[12].crop!.watered).toBe(true);
    expect(validSave(s)).toBe(true);
  });
  it('preserves a cave session after high tide and keeps reward claims across reloads',()=>{
    const s=initialState(9);s.calendar.day=3;s.calendar.minute=750;s.progression.areas.push('coast');generateEncounters(s,'rain',()=>.9);
    s.player.scene='coast';s.player.x=10;s.player.y=3;expect(investigateEncounter(s,'adventure:enter').ok).toBe(true);
    s.calendar.minute=1150;
    for(let i=0;i<3;i++){const n=encounterNodes(s).find(n=>n.id===`adventure:tide:${i}`)!;s.player.x=n.x;s.player.y=n.y;expect(investigateEncounter(s,n.id).ok).toBe(true);}
    const restored=parseSave(JSON.stringify(s))!;expect(restored).not.toBeNull();expect(restored.encounters.daily.find(e=>e.id==='tide')!.claimed).toBe(true);
    restored.player.x=6;restored.player.y=15;expect(investigateEncounter(restored,'adventure:leave').ok).toBe(true);expect(validSave(restored)).toBe(true);
  });
  it('does not reroll an existing day and exposes reachable authored interaction nodes',()=>{
    const s=initialState(12);s.calendar.day=3;s.calendar.minute=1050;s.progression.areas.push('coast','ridge');s.encounters.foxTrades=3;generateEncounters(s,'rain',()=>0);
    const events=JSON.stringify(s.encounters.daily);generateEncounters(s,'sun',()=>1);expect(JSON.stringify(s.encounters.daily)).toBe(events);
    for(const id of ['zhou','shi'] as const){s.social.people[id].stage=1;s.social.people[id].active=true;}
    const nodes=[...villagerNodes(s),...storyNodes(s),...Object.values(ENCOUNTERS).flatMap(e=>e.points.map(([x,y])=>({scene:e.scene,x,y})))];
    for(const n of nodes)expect([[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>passable(n.scene,n.x+dx,n.y+dy)),`${n.scene} ${n.x},${n.y}`).toBe(true);
  });
});
