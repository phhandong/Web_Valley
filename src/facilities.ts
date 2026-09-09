import { CROPS, ITEMS, SEASONS } from './content';
import { FLOWERS, MACHINES, PROCESSING } from './life-content';
import { add, cloneBag, remove } from './inventory';
import { GRASS } from './fieldwork';
import { FARM, SCENES, isUnlockedPlot, objectDistance, objectKey, passable, plotIndex } from './world';
import { LEVEL_THRESHOLDS } from './balance';
import type { DynamicNode, GameStateV2, Machine, MachineKind, Result } from './types';
const result=(ok:boolean,message:string):Result=>({ok,message});
const season=(day:number)=>SEASONS[(2+Math.floor((day-1)/14))%4];
export const machineAt=(s:GameStateV2,x:number,y:number)=>s.player.scene==='farm'?s.facilities.machines.find(m=>m.x===x&&m.y===y):undefined;
export const machineBusy=(m:Machine)=>!!m.job||!!m.output||m.honeyProgress>0;
export const machineStatus=(m:Machine)=>m.output?'待领取：'+ITEMS[m.output].name:m.job?`加工中 · 还需 ${m.job.remaining} 夜`:m.kind==='hive'?`采蜜 ${m.honeyProgress}/2 · 需周围两格成熟适季花卉`:m.kind==='sprinkler'?'下个清晨自动浇水':'闲置 · 可投料';
export function machineNodes(s:GameStateV2):DynamicNode[]{return s.facilities.machines.map(m=>({id:'machine:'+m.id,scene:'farm',x:m.x,y:m.y,kind:'machine',label:MACHINES[m.kind].name+' · '+machineStatus(m)}));}
export function craftMachine(s:GameStateV2,kind:MachineKind):Result{
  const def=MACHINES[kind];if(!def)return result(false,'没有这种设施。');
  const smith=SCENES.town.objects.find(o=>o.id==='smith')!;
  if(s.player.scene!=='town'||objectDistance(s.player.x,s.player.y,smith)>1||s.calendar.minute<480||s.calendar.minute>=1200)return result(false,'请在营业时间到石叔工坊制作。');
  if(LEVEL_THRESHOLDS.filter(x=>s.progression.xp>=x).length<def.level)return result(false,`需要 Lv.${def.level}。`);
  if(s.gold<def.gold)return result(false,'金币不足。');
  const bag=cloneBag(s.inventory);if(!def.ingredients.every(i=>remove(bag,i.id,i.count)))return result(false,'制作材料不足。');
  s.inventory=bag;s.gold-=def.gold;s.facilities.stored[kind]++;return result(true,def.name+'已放入设施收纳，回农场布置吧。');
}
export function placementError(s:GameStateV2,kind:MachineKind,x:number,y:number,movingId?:number):string{
  if(!MACHINES[kind]||s.player.scene!=='farm')return '回到农场才能布置。';
  if(!Number.isInteger(x)||!Number.isInteger(y)||!passable('farm',x,y,s.clearedObjects,s.ecology.trees))return '这里不是可布置的空地。';
  const index=plotIndex(x,y),map=SCENES.farm;
  if(index>=0&&(!isUnlockedPlot(s,x,y)||s.plots[index].crop||s.weeds.includes(index)))return '请选择已解锁、无作物且已除草的田格。';
  if(GRASS.farm.some(g=>g.x===x&&g.y===y&&s.fieldwork.clearedGrass[g.key]===undefined))return '先清理这里的草丛。';
  if(map.objects.some(o=>o.kind==='tree'?objectDistance(x,y,o)===0:objectDistance(x,y,o)===0&&!(o.kind==='rock'&&s.clearedObjects.includes(objectKey('farm',o)))))return '不能占用固定物件或树木生长位置。';
  if(map.nodes.some(n=>n.x===x&&n.y===y)||map.exits.some(e=>Math.abs(x-e.x)+Math.abs(y-e.y)<=1)||map.fishing.some(([a,b])=>Math.abs(x-a)+Math.abs(y-b)<=1))return '请留出资源、出入口和钓点位置。';
  if(y>=6&&y<8||x>=4&&x<6&&y>=7||x>=9&&x<12&&y>=7)return '这条农场道路需要保持通畅。';
  if(s.facilities.machines.some(m=>m.id!==movingId&&m.x===x&&m.y===y))return '这里已有设施。';
  if(kind!=='sprinkler'&&s.player.x===x&&s.player.y===y)return '不要把自己挡在设施里。';
  const machines=s.facilities.machines.filter(m=>m.id!==movingId);
  const blocks=(a:number,b:number)=>machines.some(m=>m.kind!=='sprinkler'&&m.x===a&&m.y===b)||(kind!=='sprinkler'&&a===x&&b===y);
  // Treat saplings as mature during route validation, so later growth cannot seal an aisle.
  const clear=s.clearedObjects.filter(key=>!map.objects.some(o=>o.kind==='tree'&&objectKey('farm',o)===key));
  const seen=new Set<string>(),queue:[[number,number]]|[number,number][]=[[s.player.x,s.player.y]];
  while(queue.length){const [a,b]=queue.shift()!,key=a+','+b;if(seen.has(key)||blocks(a,b)||!passable('farm',a,b,clear))continue;seen.add(key);queue.push([a+1,b],[a-1,b],[a,b+1],[a,b-1]);}
  const accessible=(a:number,b:number)=>[[a,b],[a+1,b],[a-1,b],[a,b+1],[a,b-1]].some(([u,v])=>seen.has(u+','+v));
  if(map.exits.some(e=>!seen.has(e.x+','+e.y))||map.objects.filter(o=>['shipping','farmchest'].includes(o.id)).some(o=>!accessible(o.x,o.y))||[...machines,{x,y}].some(m=>!accessible(m.x,m.y)))return '这个布局会堵住通路或设施操作位置。';
  return '';
}
export function placeMachine(s:GameStateV2,kind:MachineKind,x:number,y:number,movingId?:number):Result{
  const m=movingId===undefined?undefined:s.facilities.machines.find(m=>m.id===movingId);
  if(movingId!==undefined&&(!m||m.kind!==kind||machineBusy(m)))return result(false,'先领取产物，空闲后再搬动。');
  if(!m&&!(s.facilities.stored[kind]>0))return result(false,'收纳中没有这台设施。');
  const error=placementError(s,kind,x,y,movingId);if(error)return result(false,error);
  if(m){m.x=x;m.y=y;m.placedDay=s.calendar.day;}else{s.facilities.stored[kind]--;s.facilities.machines.push({id:s.facilities.nextId++,kind,x,y,placedDay:s.calendar.day,job:null,output:null,honeyProgress:0,flower:null});}
  return result(true,MACHINES[kind].name+'已摆好。');
}
export function storeMachine(s:GameStateV2,id:number):Result{
  const m=s.facilities.machines.find(m=>m.id===id);if(s.player.scene!=='farm'||!m||machineBusy(m))return result(false,'回到农场，先完成生产并领取产物后再收回。');
  s.facilities.machines=s.facilities.machines.filter(entry=>entry.id!==id);
  s.facilities.stored[m.kind]++;return result(true,'设施已收回收纳。');
}
export const nearMachine=(s:GameStateV2,m:Machine)=>s.player.scene==='farm'&&Math.abs(s.player.x-m.x)+Math.abs(s.player.y-m.y)<=1;
export function startProcessing(s:GameStateV2,id:number,recipeId:string):Result{
  const m=s.facilities.machines.find(m=>m.id===id),r=PROCESSING.find(r=>r.id===recipeId);
  if(!m||!nearMachine(s,m)||!r||r.machine!==m.kind)return result(false,'请走近对应设备选择配方。');
  if(machineBusy(m))return result(false,'设备尚未空闲。');
  if(r.owner&&s.social.people[r.owner].stage!==3)return result(false,'先完成对应村民故事。');
  const bag=cloneBag(s.inventory);if(!r.ingredients.every(i=>remove(bag,i.id,i.count)))return result(false,'原料不足。');
  s.inventory=bag;m.job={recipe:r.id,remaining:r.nights};return result(true,'已开始加工，'+r.nights+' 个夜晚后回来领取。');
}
export function collectMachine(s:GameStateV2,id:number):Result{
  const m=s.facilities.machines.find(m=>m.id===id);if(!m||!nearMachine(s,m)||!m.output)return result(false,'走到有产物的设备旁领取。');
  const item=m.output;if(!add(s.inventory,item,1))return result(false,'背包满了，产物留在设备里。');
  recordDiscovery(s,item,1);m.output=null;return result(true,'领取了'+ITEMS[item].name+'。');
}
export function recordDiscovery(s:GameStateV2,id:string,count:number){const d=s.discoveries[id]??{count:0,firstDay:s.calendar.day};d.count+=count;s.discoveries[id]=d;s.progression.xp+=count*2;}
export function settleMachines(s:GameStateV2){
  if(s.facilities.settledDay>=s.calendar.day)return;
  for(const m of s.facilities.machines){
    if(m.output)continue;
    if(m.job){m.job.remaining--;if(m.job.remaining===0){m.output=m.job.recipe;m.job=null;}continue;}
    if(m.kind!=='hive')continue;
    const flowers=s.plots.map((p,i)=>({crop:p.crop,index:i,x:FARM.x+i%12,y:FARM.y+Math.floor(i/12)})).filter(p=>p.crop&&FLOWERS.includes(p.crop.id)&&p.crop.growth>=3&&CROPS.find(c=>c.id===p.crop!.id)!.seasons.includes(season(s.calendar.day))&&Math.max(Math.abs(p.x-m.x),Math.abs(p.y-m.y))<=2).sort((a,b)=>(Math.abs(a.x-m.x)+Math.abs(a.y-m.y))-(Math.abs(b.x-m.x)+Math.abs(b.y-m.y))||a.index-b.index);
    if(!flowers.length)continue;if(m.honeyProgress===0)m.flower=flowers[0].crop!.id;
    m.honeyProgress++;if(m.honeyProgress===2){m.output='honey_'+m.flower;m.honeyProgress=0;m.flower=null;}
  }
  s.facilities.settledDay=s.calendar.day;
}
export function morningWater(s:GameStateV2){
  let watered=false;
  for(const m of s.facilities.machines)if(m.kind==='sprinkler'&&m.placedDay<s.calendar.day)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const p=s.plots[plotIndex(m.x+dx,m.y+dy)];if(!p?.crop||p.crop.watered)continue;
    const def=CROPS.find(c=>c.id===p.crop!.id)!;if(!def.seasons.includes(season(s.calendar.day))||p.crop.growth>=def.days)continue;
    p.crop.watered=true;watered=true;
  }
  if(watered&&s.social.people.shi.active&&s.social.people.shi.stage===2)s.social.people.shi.watered=true;
}
