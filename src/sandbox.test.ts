import { describe,it,expect } from 'vitest';
import { CROPS,FISH,FORAGE,ITEMS,RECIPES } from './content';
import { add,exchange,quantity,remove,transfer } from './inventory';
import { acceptCatch,advanceTime,availableForage,buy,cook,dayEnd,eat,eligibleFish,farmAction,gather,initialState,seasonOf,sell,setAppearance,step,submitOrder,travel,upgrade } from './engine';
import { BACKUP_KEY,LEGACY_KEY,SAVE_KEY,loadGame,migrateV1,parseSave,saveGame,validSave } from './persistence';
import { reel,startFishing,tickFishing } from './fishing';
import { SCENES,nearby,passable,type SceneDefinition } from './world';
import type { GameStateV2,Inventory,SceneId } from './types';
// These existing agriculture tests start with cleared land; pioneering is tested separately.
const fresh=()=>{const s=initialState(42);s.weeds=[];return s;};
function locate(s:GameStateV2,scene:SceneId,x:number,y:number){s.player.scene=scene;s.player.x=x;s.player.y=y}
function plotState(id='radish'){const s=fresh();locate(s,'farm',12,8);s.selectedTool='hoe';farmAction(s,12,8);add(s.inventory,`seed_${id}`,1);s.selectedSeed=id;s.selectedTool='seed';farmAction(s,12,8);return s}
class MemoryStorage{data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,v)}}

describe('content and unified map',()=>{
  it('ships the complete content catalog',()=>{expect(CROPS).toHaveLength(10);expect(FISH).toHaveLength(14);expect(FORAGE).toHaveLength(6);expect(RECIPES).toHaveLength(8);expect(Object.keys(SCENES)).toHaveLength(10)});
  it('all purchasable products cost more than their resale value',()=>{for(const i of Object.values(ITEMS))if(i.buy)expect(i.sell).toBeLessThan(i.buy)});
  it('all exits, services, fish spots and daily recovery food are reachable',()=>{
    for(const scene of Object.values(SCENES)){
      // The tidal cave is entered through a scheduled dynamic interaction.
      const start:[number,number]=scene.id==='cave'?[6,15]:Object.values(SCENES).flatMap(s=>s.exits).find(e=>e.to===scene.id)!.spawn;
      const seen=new Set<string>(),queue:[number,number][]=[start];
      while(queue.length){const [x,y]=queue.shift()!,key=`${x},${y}`;if(seen.has(key)||!passable(scene.id,x,y))continue;seen.add(key);queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])}
      for(const exit of scene.exits){expect(seen.has(`${exit.x},${exit.y}`),`${scene.id} exit ${exit.id}`).toBe(true);expect(passable(exit.to,...exit.spawn)).toBe(true)}
      for(const node of scene.nodes)expect(seen.has(`${node.x},${node.y}`),`${scene.id} node ${node.id}`).toBe(true);
      for(const [x,y] of scene.fishing)expect(seen.has(`${x},${y}`)).toBe(true);
      for(const object of scene.objects.filter(o=>o.action)){
        const accessible=[...seen].some(key=>{const [x,y]=key.split(',').map(Number);const s=fresh();locate(s,scene.id,x,y);return nearby(s)?.id===object.action});expect(accessible,`${scene.id} ${object.action}`).toBe(true);
      }
    }
  });
  it('rejects remote interaction and collisions; exit travel preserves field state',()=>{const s=plotState();expect(travel(s,'town').ok).toBe(false);locate(s,'farm',30,7);expect(travel(s,'town').ok).toBe(true);expect(s.player.scene).toBe('town');expect(s.plots[0].crop?.id).toBe('radish');locate(s,'farm',5,6);step(s,'up');expect(s.player.y).toBe(6)});
});

describe('inventory transactions',()=>{
  it('stacks to 99 and fails without partial writes when full',()=>{const bag:Inventory={capacity:2,slots:[]};expect(add(bag,'berry',198)).toBe(true);expect(bag.slots.map(s=>s.count)).toEqual([99,99]);expect(add(bag,'berry',1)).toBe(false);expect(quantity(bag,'berry')).toBe(198);expect(remove(bag,'berry',-1)).toBe(false)});
  it('rolls back an exchange and transfers exactly once',()=>{const a:Inventory={capacity:1,slots:[{id:'berry',count:4}]},b:Inventory={capacity:1,slots:[{id:'wood',count:99}]};expect(exchange(a,[{id:'berry',count:3}],[{id:'berry_bowl',count:1}])).toBe(false);expect(quantity(a,'berry')).toBe(4);expect(transfer(a,b,'berry',2)).toBe(false);expect(quantity(a,'berry')).toBe(4);b.slots=[];expect(transfer(a,b,'berry',2)).toBe(true);expect(quantity(a,'berry')).toBe(2);expect(quantity(b,'berry')).toBe(2)});
  it('rejects zero, negative and fractional amounts',()=>{const bag:Inventory={capacity:24,slots:[]};for(const n of [0,-5,.5,NaN,Infinity])expect(add(bag,'radish',n)).toBe(false)});
});

describe('agriculture, seasons and daily settlement',()=>{
  it('waters once without repeat charges, grows twice and harvests once',()=>{const s=plotState();s.selectedTool='water';expect(farmAction(s,12,8).ok).toBe(true);const energy=s.player.vitals.stamina;expect(farmAction(s,12,8).ok).toBe(false);expect(s.player.vitals.stamina).toBe(energy);dayEnd(s,false,()=>.8);expect(s.plots[0].crop?.growth).toBe(1);locate(s,'farm',12,8);farmAction(s,12,8);dayEnd(s,false,()=>.8);locate(s,'farm',12,8);s.selectedTool='hand';expect(farmAction(s,12,8).ok).toBe(true);expect(farmAction(s,12,8).ok).toBe(false);expect(quantity(s.inventory,'radish')).toBe(1)});
  it('dry crops stay dormant in growth, rain waters and winter snow does not',()=>{const s=plotState();dayEnd(s,false,()=>0);expect(s.calendar.weather).toBe('rain');expect(s.plots[0].crop?.growth).toBe(0);expect(s.plots[0].crop?.watered).toBe(true);s.calendar.day=14;dayEnd(s,false,()=>0);expect(seasonOf(s.calendar.day)).toBe('winter');expect(s.calendar.weather).toBe('snow');expect(s.plots[0].crop?.watered).toBe(false)});
  it('cross-season crops survive and resume next suitable season',()=>{const s=plotState('pumpkin');s.calendar.day=14;s.plots[0].crop!.watered=true;dayEnd(s,false,()=>.9);const growth=s.plots[0].crop!.growth;expect(s.plots[0].crop!.id).toBe('pumpkin');s.plots[0].crop!.watered=true;dayEnd(s,false,()=>.9);expect(s.plots[0].crop!.growth).toBe(growth);s.calendar.day=57;s.plots[0].crop!.watered=true;dayEnd(s,false,()=>.9);expect(s.plots[0].crop!.growth).toBe(growth+1)});
  it('rejects out-of-season sowing without consuming resources',()=>{const s=fresh();locate(s,'farm',12,8);s.plots[0].tilled=true;s.selectedSeed='cabbage';s.selectedTool='seed';add(s.inventory,'seed_cabbage',1);expect(farmAction(s,12,8).ok).toBe(false);expect(quantity(s.inventory,'seed_cabbage')).toBe(1);expect(s.player.vitals.stamina).toBe(100)});
  it('repeat-harvest crops remain planted after harvest',()=>{const s=plotState('tomato');s.plots[0].crop!.growth=4;s.selectedTool='hand';expect(farmAction(s,12,8).ok).toBe(true);expect(s.plots[0].crop!.growth).toBe(2);expect(s.plots[0].crop!.watered).toBe(false)});
  it('full bags do not consume stamina or destroy ready crops',()=>{const s=plotState();s.inventory.slots=Array.from({length:24},()=>({id:'wood',count:99}));s.plots[0].crop!.growth=2;s.selectedTool='hand';const energy=s.player.vitals.stamina;expect(farmAction(s,12,8).ok).toBe(false);expect(s.plots[0].crop!.growth).toBe(2);expect(s.player.vitals.stamina).toBe(energy)});
  it('simulates all 56 days and starts the next autumn',()=>{const s=fresh();const seasons=new Set<string>();for(let i=0;i<56;i++){seasons.add(seasonOf(s.calendar.day));dayEnd(s,false,()=>.8);expect(validSave(s)).toBe(true)}expect(s.calendar.day).toBe(57);expect(seasonOf(s.calendar.day)).toBe('autumn');expect(seasons.size).toBe(4)});
});

describe('health, cooking and recovery',()=>{
  it('deducts hunger on hourly boundaries and starvation reduces life',()=>{const s=fresh();advanceTime(s,36);expect(s.player.vitals.hunger).toBe(96);s.player.vitals.hunger=0;advanceTime(s,36);expect(s.player.vitals.health).toBe(95)});
  it('sleep skips hunger ticks and recovers without exhausting health',()=>{const s=fresh();s.player.vitals={health:25,stamina:0,hunger:25};dayEnd(s,false,()=>.9);expect(s.player.vitals).toEqual({health:55,stamina:100,hunger:15})});
  it('zero health rescues once and preserves items; late-night rescue is bounded',()=>{const s=fresh();s.gold=1500;s.player.vitals.health=0;const bag=JSON.stringify(s.inventory);expect(advanceTime(s,1)?.dayEnded).toBe(true);expect(s.calendar.day).toBe(2);expect(s.gold).toBe(1400);expect(JSON.stringify(s.inventory)).toBe(bag);expect(s.player.scene).toBe('home');advanceTime(s,1);expect(s.calendar.day).toBe(2);s.calendar.minute=1559;expect(advanceTime(s,1)?.dayEnded).toBe(true);expect(s.gold).toBe(1300)});
  it('recovery is free at zero gold and daily berries restore ability to work',()=>{const s=fresh();s.gold=0;s.inventory.slots=[];s.player.vitals={health:50,stamina:0,hunger:0};locate(s,'farm',2,9);expect(gather(s,2,9).ok).toBe(true);expect(eat(s,'berry').ok).toBe(true);expect(s.player.vitals.stamina).toBe(15);expect(s.player.vitals.hunger).toBe(20);dayEnd(s,true,()=>.8);expect(s.gold).toBe(0);expect(s.gathered).toHaveLength(0);expect(availableForage(s,'farm')).toHaveLength(6)});
  it('hazards hurt on entry only and collision does not repeatedly hurt',()=>{const s=fresh();locate(s,'forest',16,10);step(s,'right');expect(s.player.vitals.health).toBe(95);advanceTime(s,.1);expect(s.player.vitals.health).toBe(95)});
  it('cooking checks location, material, space and consumes atomically',()=>{const s=fresh();add(s.inventory,'berry',3);expect(cook(s,'berry_bowl').ok).toBe(false);locate(s,'home',22,7);expect(cook(s,'berry_bowl').ok).toBe(true);expect(quantity(s.inventory,'berry')).toBe(0);expect(quantity(s.inventory,'berry_bowl')).toBe(1);expect(s.stats.cooked).toBe(1);expect(cook(s,'berry_bowl').ok).toBe(false)});
  it('only food can be eaten and restores within caps',()=>{const s=fresh();add(s.inventory,'wood',1);expect(eat(s,'wood').ok).toBe(false);s.player.vitals.hunger=90;expect(eat(s,'ration').ok).toBe(true);expect(s.player.vitals.hunger).toBe(100);expect(quantity(s.inventory,'ration')).toBe(2)});
});

describe('economy and cosmetics',()=>{
  it('enforces hours, quantity, season, location and funds',()=>{const s=fresh();locate(s,'town',8,7);expect(buy(s,'seed_radish',1).ok).toBe(false);s.calendar.minute=480;expect(buy(s,'seed_radish',1).ok).toBe(true);expect(s.gold).toBe(40);expect(buy(s,'seed_radish',-1).ok).toBe(false);expect(buy(s,'seed_radish',5).ok).toBe(false);expect(buy(s,'seed_cabbage',1).ok).toBe(false)});
  it('selected shipping pays next morning and cannot pay twice',()=>{const s=fresh();add(s.inventory,'radish',3);locate(s,'farm',9,6);expect(sell(s,'radish',2,true).ok).toBe(true);expect(s.gold).toBe(50);expect(quantity(s.inventory,'radish')).toBe(1);dayEnd(s,false,()=>.9);expect(s.gold).toBe(100);dayEnd(s,false,()=>.9);expect(s.gold).toBe(100)});
  it('order completion cannot be replayed',()=>{const s=fresh(),o=s.orders[0];locate(s,'town',12,14);add(s.inventory,o.item,o.count);expect(submitOrder(s,o.id).ok).toBe(true);const gold=s.gold;expect(submitOrder(s,o.id).ok).toBe(false);expect(s.gold).toBe(gold);expect(s.stats.reputation).toBe(10)});
  it('upgrades cost material and expand capacity, bounded at tier 3',()=>{const s=fresh();locate(s,'town',25,7);s.calendar.minute=600;s.gold=2000;expect(upgrade(s,'bag').ok).toBe(true);expect(s.inventory.capacity).toBe(36);expect(upgrade(s,'bag').ok).toBe(true);expect(s.inventory.capacity).toBe(48);expect(upgrade(s,'bag').ok).toBe(false);expect(upgrade(s,'farm').ok).toBe(false);add(s.inventory,'wood',50);add(s.inventory,'stone',50);expect(upgrade(s,'farm').ok).toBe(true)});
  it('wearing checks unlocks and does not mutate attributes',()=>{const s=fresh();locate(s,'home',12,7);const stats=JSON.stringify(s.player.vitals);expect(setAppearance(s,{skin:3,hair:5,outfit:7,hat:-1}).ok).toBe(false);expect(setAppearance(s,{skin:3,hair:5,outfit:2,hat:-1}).ok).toBe(true);expect(JSON.stringify(s.player.vitals)).toBe(stats);expect(s.player.appearance.skin).toBe(3)});
});

describe('fishing sessions',()=>{
  it('has a catchable fish in every legal season-weather-hour combination',()=>{const s=fresh();for(const scene of ['farm','lake'] as const)for(const day of [1,15,29,43])for(const minute of [360,720,1080,1440,1550])for(const weather of (seasonOf(day)==='winter'?['sun','snow']:['sun','rain']) as ('sun'|'rain'|'snow')[]){s.player.scene=scene;s.calendar={day,minute,weather};expect(eligibleFish(s).length).toBeGreaterThan(0)}});
  it('charges one cast, bite timeout fails, and assistance enlarges the bar',()=>{const s=fresh();locate(s,'farm',5,10);const f=startFishing(s,()=>.1)!;expect(s.player.vitals.stamina).toBe(95);tickFishing(f,5,false);expect(f.stage).toBe('bite');tickFishing(f,3,false);expect(f.stage).toBe('lost');expect(s.stats.caught).toBe(0);s.settings.fishingAssist=true;const assisted=startFishing(s,()=>.1)!;expect(assisted.range).toBeGreaterThan(f.range)});
  it('a tracking player can win without direct state manipulation',()=>{const s=fresh();locate(s,'farm',5,10);s.settings.fishingAssist=true;const f=startFishing(s,()=>0)!;tickFishing(f,4,false);reel(f);for(let i=0;i<3600&&f.stage==='reeling';i++)tickFishing(f,1/60,f.float>f.fishY);expect(f.stage).toBe('won')});
  it('full bag keeps a pending fish until explicitly replaced; reward only once',()=>{const s=fresh();s.inventory.slots=Array.from({length:24},()=>({id:'wood',count:99}));s.pendingCatch='crucian';expect(acceptCatch(s).ok).toBe(false);expect(s.pendingCatch).toBe('crucian');expect(acceptCatch(s,0).ok).toBe(true);expect(quantity(s.inventory,'crucian')).toBe(1);expect(s.stats.caught).toBe(1);expect(acceptCatch(s,0).ok).toBe(false)});
  it('rescue cancels a pending fish without rewarding it',()=>{const s=fresh();s.pendingCatch='carp';dayEnd(s,true,()=>.9);expect(s.pendingCatch).toBe(null);expect(s.stats.caught).toBe(0)});
});

describe('save validation, backup and migration',()=>{
  it('validates saves and rejects dangerous or corrupt values',()=>{const original=fresh();expect(validSave(original)).toBe(true);for(const mutate of [(s:any)=>s.gold=-1,(s:any)=>s.player.x=999,(s:any)=>s.player.scene='missing',(s:any)=>s.inventory.slots[0].id='__proto__',(s:any)=>s.player.vitals.health=null,(s:any)=>s.calendar.minute=1560,(s:any)=>s.plots[0].crop={id:'ghost',growth:0,watered:true},(s:any)=>s.player.appearance.outfit=7]){const s=structuredClone(original);mutate(s);expect(validSave(s)).toBe(false)}});
  it('backs up a valid previous save and recovers it if current is corrupted',()=>{const storage=new MemoryStorage(),s=fresh();saveGame(storage,s);s.gold=71;saveGame(storage,s);expect(parseSave(storage.getItem(BACKUP_KEY)!)!.gold).toBe(50);storage.setItem(SAVE_KEY,'{broken');const loaded=loadGame(storage);expect(loaded.blocked).toBe(false);expect(loaded.state.gold).toBe(50);expect(loaded.message).toContain('备份')});
  it('invalid records remain intact and block automatic overwrite',()=>{const storage=new MemoryStorage();storage.setItem(SAVE_KEY,'broken');expect(loadGame(storage).blocked).toBe(true);expect(storage.getItem(SAVE_KEY)).toBe('broken')});
  it('imports legacy 30 plots into new columns without losing economic state',()=>{const raw={version:1,day:4,gold:99,seeds:7,crops:4,pendingGold:75,plots:Array.from({length:30},(_,i)=>({tilled:true,crop:i===29?{growth:1,watered:true}:null})),quests:{planted:12,harvested:7,shipped:5,boughtAfterShipping:true}};const s=migrateV1(raw)!;expect(s.gold).toBe(99);expect(s.legacyPending).toBe(75);expect(quantity(s.inventory,'seed_radish')).toBe(7);expect(quantity(s.inventory,'radish')).toBe(4);expect(s.plots[53].crop?.growth).toBe(1);expect(s.stats.harvested).toBe(7);expect(validSave(s)).toBe(true);const store=new MemoryStorage();store.setItem(LEGACY_KEY,JSON.stringify(raw));loadGame(store);expect(store.getItem(LEGACY_KEY)).toBe(JSON.stringify(raw));expect(store.getItem(SAVE_KEY)).toBeTruthy()});
  it('does not serialize fishing sessions, but preserves paid stamina and pending catches',()=>{const s=fresh();locate(s,'farm',5,10);startFishing(s,()=>0);const recovered=parseSave(JSON.stringify(s))!;expect(recovered.player.vitals.stamina).toBe(95);expect('fishing' in recovered).toBe(false);s.pendingCatch='crucian';expect(parseSave(JSON.stringify(s))!.pendingCatch).toBe('crucian')});
});
