import { GRASS,newFieldwork,REPAIRS,workTarget } from './fieldwork';
import { CROPS,ITEMS } from './content';
import { initialState } from './engine';
import { add } from './inventory';
import { SCENES,passable,harvestable,objectKey } from './world';
import type { GameStateV2 } from './types';
import { AREAS,LEVEL_XP } from './progression';
import { newSocial,newFacilities,newEncounters } from './life-state';
import { validLife } from './life-validation';
export const SAVE_KEY='creekside-farm-save-v2', BACKUP_KEY=`${SAVE_KEY}-backup`, LEGACY_KEY='creekside-farm-save-v1';
export interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void}
const obj=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const num=(v:unknown,min=0,max=1e12):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const int=(v:unknown,min=0,max=1e12):v is number=>num(v,min,max)&&Number.isSafeInteger(v);
const stack=(v:unknown,max=99)=>obj(v)&&typeof v.id==='string'&&Object.hasOwn(ITEMS,v.id)&&int(v.count,1,max);
const uniqueNumbers=(v:unknown,max:number)=>Array.isArray(v)&&v.length>0&&v.every(n=>int(n,0,max))&&new Set(v).size===v.length;
export function validSave(raw:unknown):raw is GameStateV2{
  if(!obj(raw)||raw.version!==2)return false;
  const s=raw;
  if(!int(s.rng,0,4294967295)||!obj(s.calendar)||!int(s.calendar.day,1)||!num(s.calendar.minute,360,1559.999999)||!['sun','rain','snow'].includes(s.calendar.weather))return false;
  const resourceKeys=new Set(Object.values(SCENES).flatMap(scene=>scene.objects.filter(harvestable).map(o=>objectKey(scene.id,o))));
  if(!Array.isArray(s.clearedObjects)||!s.clearedObjects.every((k:unknown)=>typeof k==='string'&&resourceKeys.has(k))||new Set(s.clearedObjects).size!==s.clearedObjects.length)return false;
  const treeKeys=new Set(Object.values(SCENES).flatMap(scene=>scene.objects.filter(o=>o.kind==='tree').map(o=>objectKey(scene.id,o))));
  const allNodes=new Set(Object.values(SCENES).flatMap(scene=>scene.nodes.map(n=>`${scene.id}:${n.id}`)));
  const events=new Set(Object.values(SCENES).flatMap(scene=>scene.objects.filter(o=>o.action?.startsWith('event:')).map(o=>o.action!.slice(6))));
  if(!obj(s.ecology)||s.ecology.version!==1||!obj(s.ecology.trees)||!obj(s.ecology.nodeReady)||!obj(s.ecology.eventReady))return false;
  if(!Object.entries(s.ecology.trees).every(([key,age])=>treeKeys.has(key)&&int(age,0,6)))return false;
  if(!Object.entries(s.ecology.nodeReady).every(([key,day])=>allNodes.has(key)&&int(day,1,s.calendar.day+5)))return false;
  if(!Object.entries(s.ecology.eventReady).every(([key,day])=>events.has(key)&&int(day,1,s.calendar.day+3)))return false;
  if(s.clearedObjects.some((key:string)=>treeKeys.has(key)&&s.ecology.trees[key]===6))return false;
  if(!obj(s.player)||!Object.hasOwn(SCENES,s.player.scene)||!int(s.player.x,1,30)||!int(s.player.y,1,18)||!['up','down','left','right'].includes(s.player.direction)||!passable(s.player.scene,s.player.x,s.player.y,s.clearedObjects,s.ecology.trees))return false;
  if(!obj(s.fieldwork)||s.fieldwork.version!==1||!obj(s.fieldwork.clearedGrass)||!obj(s.fieldwork.damage)||!Array.isArray(s.fieldwork.repairs)||new Set(s.fieldwork.repairs).size!==s.fieldwork.repairs.length||!s.fieldwork.repairs.every((k:unknown)=>typeof k==='string'&&Object.hasOwn(REPAIRS,k))||!int(s.fieldwork.restDay,0,s.calendar.day))return false;
  const grasses=new Set(Object.values(GRASS).flat().map(g=>g.key));
  if(!Object.entries(s.fieldwork.clearedGrass).every(([key,day])=>grasses.has(key)&&int(day,0,s.calendar.day+5)&&(key.startsWith('farm:')?day===0:Number(day)>0)))return false;
  const a=s.player.appearance,v=s.player.vitals;
  if(!obj(a)||!int(a.skin,0,5)||!int(a.hair,0,5)||!int(a.outfit,0,7)||!int(a.hat,-1,5)||!obj(v)||!['health','stamina','hunger'].every(k=>num(v[k],0,100)))return false;
  if(!obj(s.upgrades)||!['farm','tools','rod','bag'].every(k=>int(s.upgrades[k],0,2)))return false;
  for(const key of ['inventory','chest']){const bag=s[key];if(!obj(bag)||!int(bag.capacity,1,120)||!Array.isArray(bag.slots)||bag.slots.length>bag.capacity||!bag.slots.every((v:unknown)=>stack(v)))return false;}
  if(s.inventory.capacity!==24+12*s.upgrades.bag||s.chest.capacity!==120)return false;
  if(!Array.isArray(s.plots)||s.plots.length!==120||!s.plots.every((p:unknown)=>{
    if(!obj(p)||typeof p.tilled!=='boolean')return false;if(p.crop===null)return true;
    const def=obj(p.crop)?CROPS.find(c=>c.id===p.crop.id):undefined;
    return !!def&&p.tilled&&int(p.crop.growth,0,def.days)&&typeof p.crop.watered==='boolean';
  }))return false;
  if(!['hoe','seed','water','hand','rod','axe','pick'].includes(s.selectedTool)||!CROPS.some(c=>c.id===s.selectedSeed)||!int(s.gold)||!int(s.legacyPending)||!int(s.lastSettlement,0,s.calendar.day-1))return false;
  if(!Array.isArray(s.weeds)||s.weeds.some((i:unknown)=>!int(i,0,119)||s.plots[i].tilled||s.plots[i].crop)||new Set(s.weeds).size!==s.weeds.length)return false;
  if(!Array.isArray(s.shipping)||s.shipping.length>Object.keys(ITEMS).length||!s.shipping.every((v:unknown)=>stack(v,1e9)))return false;
  if(!obj(s.stats)||!['planted','harvested','shipped','cooked','caught','orders','revenue','reputation'].every(k=>int(s.stats[k]))||typeof s.stats.boughtAfterShipping!=='boolean')return false;
  if(!obj(s.discoveries)||!Object.entries(s.discoveries).every(([id,d])=>Object.hasOwn(ITEMS,id)&&obj(d)&&int(d.count)&&int(d.firstDay,1,s.calendar.day)))return false;
  const nodeKeys=new Set(Object.values(SCENES).flatMap(scene=>scene.nodes.map(n=>`${scene.id}:${n.id}`)));
  if(!Array.isArray(s.gathered)||!s.gathered.every((k:unknown)=>typeof k==='string'&&nodeKeys.has(k))||new Set(s.gathered).size!==s.gathered.length)return false;
  if(!Array.isArray(s.orders)||s.orders.length!==3||!s.orders.every((o:unknown)=>obj(o)&&typeof o.id==='string'&&Object.hasOwn(ITEMS,o.item)&&int(o.count,1,3)&&int(o.reward,1)&&typeof o.done==='boolean')||new Set(s.orders.map((o:any)=>o.id)).size!==3)return false;
  if(!obj(s.unlocked)||!uniqueNumbers(s.unlocked.outfits,7)||!uniqueNumbers(s.unlocked.hats,5)||!s.unlocked.outfits.includes(a.outfit)||(a.hat!==-1&&!s.unlocked.hats.includes(a.hat)))return false;
  if(!obj(s.settings)||typeof s.settings.fishingAssist!=='boolean'||typeof s.settings.sound!=='boolean')return false;
  if(typeof s.settings.music!=='boolean'||!int(s.settings.volume,0,100)||typeof s.settings.hud!=='boolean'||!int(s.settings.hudWidth,220,360))return false;
  if(!obj(s.progression)||!int(s.progression.xp)||!int(s.progression.fishingRotation)||!Array.isArray(s.progression.areas)||!s.progression.areas.every((a:unknown)=>AREAS.some(area=>area.id===a))||new Set(s.progression.areas).size!==s.progression.areas.length)return false;
  if(!Array.isArray(s.progression.forestEvents)||!s.progression.forestEvents.every((e:unknown)=>typeof e==='string'&&events.has(e))||new Set(s.progression.forestEvents).size!==s.progression.forestEvents.length)return false;
  const area=AREAS.find(a=>a.id===s.player.scene);
  if(area&&!s.progression.areas.includes(area.id)&&s.progression.xp<LEVEL_XP[area.level-1])return false;
  if(s.pendingCatch!==null&&!(typeof s.pendingCatch==='string'&&ITEMS[s.pendingCatch]?.kind==='fish'))return false;
  const targets=Object.values(SCENES).flatMap(scene=>[...scene.objects.filter(harvestable),...scene.nodes.filter(n=>['wood','stone','ore'].includes(n.kind))].map(o=>({key:objectKey(scene.id,o as any),scene:scene.id,x:o.x,y:o.y})));
  if(!Object.entries(s.fieldwork.damage).every(([key,damage])=>{const target=targets.find(t=>t.key===key);if(!target||!int(damage,1,11)||s.clearedObjects.includes(key))return false;const copy={...s,player:{...s.player,scene:target.scene}} as GameStateV2;return !!workTarget(copy,target.x,target.y)&&!(s.ecology.trees[key]!==undefined&&s.ecology.trees[key]<6);}))return false;
  if(!validLife(s as GameStateV2))return false;
  if(!passable(s.player.scene,s.player.x,s.player.y,s.clearedObjects,s.ecology.trees,s.facilities.machines))return false;
  return true;
}
export function migrateV1(raw:unknown):GameStateV2|null{
  if(!obj(raw)||raw.version!==1||!int(raw.day,1)||!int(raw.gold)||!int(raw.seeds)||!int(raw.crops)||!int(raw.pendingGold)||!Array.isArray(raw.plots)||raw.plots.length!==30||!obj(raw.quests))return null;
  if(!['planted','harvested','shipped'].every(k=>int(raw.quests[k]))||typeof raw.quests.boughtAfterShipping!=='boolean')return null;
  const state=initialState(12345);state.calendar.day=raw.day;state.lastSettlement=raw.day-1;state.gold=raw.gold;state.legacyPending=raw.pendingGold;
  state.weeds=[];state.inventory.slots=[{id:'ration',count:3}];
  for(const [id,count] of [['seed_radish',raw.seeds],['radish',raw.crops]] as [string,number][]){if(count>0&&!add(state.inventory,id,count)&&!add(state.chest,id,count))return null;}
  for(let i=0;i<30;i++){const plot=raw.plots[i];if(!obj(plot)||typeof plot.tilled!=='boolean')return null;
    if(plot.crop!==null&&(!obj(plot.crop)||!int(plot.crop.growth,0,2)||typeof plot.crop.watered!=='boolean'||!plot.tilled))return null;
    state.plots[Math.floor(i/6)*12+i%6]={tilled:plot.tilled,crop:plot.crop?{id:'radish',growth:plot.crop.growth,watered:plot.crop.watered}:null};}
  Object.assign(state.stats,raw.quests);
  if(raw.quests.harvested)state.discoveries.radish={count:raw.quests.harvested,firstDay:1};
  return validSave(state)?state:null;
}
export function parseSave(text:string):GameStateV2|null{try{
  const value:unknown=JSON.parse(text);
  // Existing V2 farms gain additive defaults without losing their original record.
  if(obj(value)&&value.version===2){
    if(!Object.hasOwn(value,'social'))value.social=newSocial();
    if(!Object.hasOwn(value,'facilities'))value.facilities=newFacilities();
    if(!Object.hasOwn(value,'encounters'))value.encounters=newEncounters(int(value.calendar?.day,1)?value.calendar.day:1);
    if(!Object.hasOwn(value,'fieldwork'))value.fieldwork=newFieldwork();
    // Do not introduce new farm rocks beneath an existing player or on a cleared route.
    if(!Object.hasOwn(value,'clearedObjects'))value.clearedObjects=['farm:farmrock1','farm:farmrock2'];
    if(!Object.hasOwn(value,'weeds'))value.weeds=[];
    if(obj(value.settings))value.settings={music:true,volume:35,hud:false,hudWidth:260,...value.settings};
    if(!Object.hasOwn(value,'progression'))value.progression={xp:0,areas:[],forestEvents:[],fishingRotation:0};
    else if(obj(value.progression))value.progression={fishingRotation:0,...value.progression};
    if(!Object.hasOwn(value,'ecology')){
      value.ecology={version:1,trees:{},nodeReady:{},eventReady:{}};
      if(obj(value.progression)&&int(value.progression.xp))value.progression.xp*=3;
      if(Array.isArray(value.clearedObjects))for(const key of value.clearedObjects){
        if(Object.values(SCENES).some(scene=>scene.objects.some(o=>o.kind==='tree'&&objectKey(scene.id,o)===key)))value.ecology.trees[key]=0;
      }
    }
  }
  return validSave(value)?value:migrateV1(value);
}catch{return null}}
export function loadGame(storage:StorageLike):{state:GameStateV2;message:string;blocked:boolean}{
  try{
    const current=storage.getItem(SAVE_KEY),backup=storage.getItem(BACKUP_KEY),legacy=storage.getItem(LEGACY_KEY);
    if(current){const state=parseSave(current);if(state)return{state,message:'欢迎回家，进度已恢复。',blocked:false}}
    if(backup){const state=parseSave(backup);if(state)return{state,message:'主存档无法读取，已恢复上一份有效备份。',blocked:false}}
    if(legacy){const state=parseSave(legacy);if(state){storage.setItem(SAVE_KEY,JSON.stringify(state));return{state,message:'旧农场已迁移，金币、耕地和物品都在，旧记录仍保留。',blocked:false}}}
    if(current||backup||legacy)return{state:initialState(),message:'存档损坏，原记录已保留。请在设置中导入备份，或确认开始新农场。',blocked:true};
    return{state:initialState(),message:'先用锄头清理农田杂草，再松土播种。点击背包或按 B 查看口粮。',blocked:false};
  }catch{return{state:initialState(),message:'浏览器暂时无法访问存档，请定期导出保存进度。',blocked:true}}
}
export function saveGame(storage:StorageLike,state:GameStateV2){
  if(!validSave(state))throw new Error('当前状态未通过校验，请导出记录后重试');
  const serialized=JSON.stringify(state),previous=storage.getItem(SAVE_KEY);
  if(previous&&parseSave(previous))storage.setItem(BACKUP_KEY,previous);
  storage.setItem(SAVE_KEY,serialized);
}
