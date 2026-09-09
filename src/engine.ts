import { newFieldwork,grassAt,workTarget,workError,labourNode,nodeItem,REPAIRS,fishingSpots } from './fieldwork';
import { CROPS,FISH,FORAGE,ITEMS,RECIPES,RESOURCE_YIELDS,SEASONS,UPGRADE_COSTS } from './content';
import { add,cloneBag,exchange,quantity,remove,transfer } from './inventory';
import { SCENES,initialWeeds,isUnlockedPlot,nearby,passable,plotIndex,resourceAt,objectDistance,objectKey } from './world';
import { areaOpen,AREAS,gainXP } from './progression';
import type { Appearance,GameStateV2,Result,RNG,Season } from './types';
import { newEcology,growWorld } from './ecology';
import { ECOLOGY } from './balance';
import { treeStage } from './world';
import { newSocial,newFacilities,newEncounters } from './life-state';
import { morningWater,settleMachines,machineAt } from './facilities';
import { generateEncounters,obtainableToday,todayHints } from './encounters';
import { PERSON_IDS } from './life-content';
export const seasonOf=(day:number):Season=>SEASONS[(2+Math.floor((day-1)/14))%4];
export const seasonDay=(day:number)=>(day-1)%14+1;
export const yearOf=(day:number)=>Math.floor((day-1)/56)+1;
export const clockText=(minute:number)=>`${String(Math.floor(minute/60)%24).padStart(2,'0')}:${String(Math.floor(minute%60/10)*10).padStart(2,'0')}`;
export function random(state:GameStateV2):number{state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;return state.rng/4294967296;}
export function initialState(seed=(Date.now()>>>0)):GameStateV2 {
  const state:GameStateV2={version:2,fieldwork:newFieldwork(),ecology:newEcology(),weeds:initialWeeds(),clearedObjects:[],rng:seed,calendar:{day:1,minute:360,weather:'sun'},player:{scene:'farm',x:10,y:9,direction:'right',appearance:{skin:0,hair:0,outfit:0,hat:0},vitals:{health:100,stamina:100,hunger:100}},gold:50,
    inventory:{capacity:24,slots:[{id:'seed_radish',count:5},{id:'ration',count:3}]},chest:{capacity:120,slots:[]},shipping:[],legacyPending:0,plots:Array.from({length:120},()=>({tilled:false,crop:null})),selectedTool:'hoe',selectedSeed:'radish',upgrades:{farm:0,tools:0,rod:0,bag:0},
    stats:{planted:0,harvested:0,shipped:0,cooked:0,caught:0,orders:0,revenue:0,reputation:0,boughtAfterShipping:false},discoveries:{},gathered:[],orders:[],unlocked:{outfits:[0,1,2],hats:[0]},settings:{fishingAssist:false,sound:true,music:true,volume:35,hud:false,hudWidth:260},progression:{xp:0,areas:[],forestEvents:[],fishingRotation:0},pendingCatch:null,lastSettlement:0,social:newSocial(),facilities:newFacilities(),encounters:newEncounters()};
  state.orders=generateOrders(state);return state;
}
export const result=(ok:boolean,message:string,effect?:Result['effect']):Result=>({ok,message,effect});
export function discover(state:GameStateV2,id:string,count=1){
  gainXP(state,count*(ITEMS[id]?.kind==='fish'?12:ITEMS[id]?.kind==='meal'?10:ITEMS[id]?.kind==='crop'?6:2));
  const entry=state.discoveries[id]??{count:0,firstDay:state.calendar.day};entry.count+=count;state.discoveries[id]=entry;
  const unlock=(list:number[],value:number)=>{if(!list.includes(value))list.push(value)};
  if(state.stats.harvested>=20)unlock(state.unlocked.outfits,3);
  if(state.stats.caught>=10)unlock(state.unlocked.outfits,4);
  if(state.stats.cooked>=8)unlock(state.unlocked.hats,4);
  if(state.stats.orders>=10)unlock(state.unlocked.outfits,7);
  if(FISH.filter(f=>state.discoveries[f.id]).length>=12)unlock(state.unlocked.hats,5);
}
export function availableForage(state:GameStateV2,scene=state.player.scene){return SCENES[scene].nodes.filter(n=>(state.ecology.nodeReady[`${scene}:${n.id}`]??0)<=state.calendar.day&&(n.kind!=='forage'||FORAGE[n.index].seasons.includes(seasonOf(state.calendar.day))));}
export function generateOrders(state:GameStateV2,rng:RNG=()=>random(state)){
  const season=seasonOf(state.calendar.day);
  const eligible=['berry','herb',...Object.keys(state.discoveries).filter(id=>(['crop','fish','forage','meal','processed'].includes(ITEMS[id]?.kind)||['shell','quartz','stardust'].includes(id))&&obtainableToday(state,id))];
  const pool=[...new Set(eligible)];
  return Array.from({length:3},(_,i)=>{const item=pool.splice(Math.floor(rng()*pool.length),1)[0]??'berry';const count=ITEMS[item].kind==='processed'||item==='stardust'?1:1+Math.floor(rng()*3);return{id:`${state.calendar.day}-${i}`,item,count,reward:Math.ceil(ITEMS[item].sell*count*1.5)+15,done:false,villager:PERSON_IDS[i]}});
}
export const toolCost=(state:GameStateV2,base:number)=>Math.max(1,base-state.upgrades.tools)*(state.player.vitals.hunger<20?2:1);
export function spend(state:GameStateV2,base:number,labour=true){const cost=labour?toolCost(state,base):base*(state.player.vitals.hunger<20?2:1);if(state.player.vitals.stamina<cost)return false;state.player.vitals.stamina-=cost;return true;}
export function dayEnd(state:GameStateV2,rescue=false,rng:RNG=()=>random(state)):Result {
  const day=state.calendar.day;
  if(state.lastSettlement>=day)return result(false,'今天已经结算');
  state.lastSettlement=day;
  const fee=rescue?Math.min(100,Math.floor(state.gold*.1)):0;
  const income=state.shipping.reduce((sum,s)=>sum+ITEMS[s.id].sell*s.count,0)+state.legacyPending;
  const oldSeason=seasonOf(day),previousWeather=state.calendar.weather;
  for(const plot of state.plots)if(plot.crop){const definition=CROPS.find(c=>c.id===plot.crop!.id)!;if(plot.crop.watered&&definition.seasons.includes(oldSeason))plot.crop.growth=Math.min(definition.days,plot.crop.growth+1);plot.crop.watered=false;}
  settleMachines(state);
  state.gold+=income-fee;state.stats.revenue+=income;state.shipping=[];state.legacyPending=0;state.gathered=[];state.pendingCatch=null;
  state.calendar.day++;state.calendar.minute=360;
  state.progression.forestEvents=[];
  state.calendar.weather=rng()<.32?(seasonOf(state.calendar.day)==='winter'?'snow':'rain'):'sun';
  if(state.calendar.weather==='rain')for(const plot of state.plots)if(plot.crop)plot.crop.watered=true;
  morningWater(state);
  const v=state.player.vitals;
  if(rescue){v.health=Math.max(v.health,50);v.stamina=Math.max(v.stamina,50);v.hunger=Math.max(v.hunger,30)}
  else {v.health=Math.min(100,v.health+30);v.stamina=100;v.hunger=Math.max(0,v.hunger-10)}
  state.player.scene='home';state.player.x=10;state.player.y=8;state.player.direction='down';
  growWorld(state);
  generateEncounters(state,previousWeather,()=>random(state));state.orders=generateOrders(state,rng);
  return {ok:true,dayEnded:true,message:(rescue?`被送回了小屋 · 救援费 ${fee} G · 出货收入 ${income} G`:`新的一天 · 出货收入 ${income} G`)+(todayHints(state).length?' · 今日见闻已记入手记':'')};
}
export function advanceTime(state:GameStateV2,seconds:number,rng?:RNG):Result|null {
  if(!Number.isFinite(seconds)||seconds<=0)return null;
  if(state.player.vitals.health<=0)return dayEnd(state,true,rng);
  const before=state.calendar.minute, after=Math.min(1560,before+seconds*1200/720);
  for(let h=Math.floor(before/60)+1;h<=Math.floor(after/60);h++){
    const v=state.player.vitals;v.hunger=Math.max(0,v.hunger-4);if(v.hunger===0)v.health=Math.max(0,v.health-5);
    if(v.health===0){state.calendar.minute=h*60;return dayEnd(state,true,rng)}
  }
  state.calendar.minute=after;
  if(after>=1560)return dayEnd(state,true,rng);
  if(before<1440&&after>=1440)return result(true,'已经午夜了，记得回家休息。');
  return null;
}
export function targetTile(state:GameStateV2){
  const p=state.player,[dx,dy]=({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[p.direction],front={x:p.x+dx,y:p.y+dy};
  if(['axe','pick'].includes(state.selectedTool)&&workTarget(state,front.x,front.y))return front;
  if(state.selectedTool==='hoe'&&grassAt(state,p.x,p.y))return{x:p.x,y:p.y};
  if(p.scene==='farm'&&isUnlockedPlot(state,p.x,p.y))return{x:p.x,y:p.y};
  return front;
}
export function harvestResource(state:GameStateV2,x:number,y:number):Result{
  const t=workTarget(state,x,y);if(!t)return result(false,'这里没有可采集的木石资源');
  const error=workError(state,t);if(error)return result(false,error);
  const damage=(state.fieldwork.damage[t.key]??0)+t.power,done=damage>=12,bag=cloneBag(state.inventory);
  if(done&&!add(bag,t.item,t.count))return result(false,'背包满了，进度已保留，腾出空间后完成最后一击');
  state.player.vitals.stamina-=state.player.vitals.hunger<20?2:1;
  if(!done){state.fieldwork.damage[t.key]=damage;return result(true,'');}
  delete state.fieldwork.damage[t.key];state.inventory=bag;discover(state,t.item,t.count);
  if(t.node){state.gathered.push(t.key);state.ecology.nodeReady[t.key]=state.calendar.day+5;}
  else {state.clearedObjects.push(t.key);if(t.kind==='tree')state.ecology.trees[t.key]=0;}
  return result(true,(t.kind==='tree'?'树倒下了':t.tool==='pick'?'矿石碎开了':'木材收好了')+' · '+ITEMS[t.item].name+' +'+t.count,'harvest');
}
export function clearGrass(state:GameStateV2,x:number,y:number):Result{
  const grass=grassAt(state,x,y);if(!grass)return result(false,'这里没有需要清理的草丛');
  if(Math.abs(x-state.player.x)+Math.abs(y-state.player.y)>1)return result(false,'走近草丛再清理');
  if(state.selectedTool!=='hoe')return result(false,'使用锄头（1）清理草丛');
  const bag=cloneBag(state.inventory);if(!add(bag,'fiber',1))return result(false,'背包满了，先腾出纤维的位置');
  if(!spend(state,2))return result(false,'体力不足，先吃点东西');
  state.inventory=bag;state.fieldwork.clearedGrass[grass.key]=state.player.scene==='farm'?0:state.calendar.day+5;discover(state,'fiber');
  return result(true,'清理了草丛 · 植物纤维 +1','harvest');
}
export function repairFacility(state:GameStateV2,id:string):Result{
  const def=REPAIRS[id as keyof typeof REPAIRS];
  if(!def||nearby(state)?.id!=='repair:'+id)return result(false,'走到设施旁再修复');
  if(state.fieldwork.repairs.includes(id))return result(false,'这处设施已经修好了');
  if(state.gold<def.gold||!def.ingredients.every(i=>quantity(state.inventory,i.id)>=i.count))return result(false,'金币或材料不足');
  for(const i of def.ingredients)remove(state.inventory,i.id,i.count);
  state.gold-=def.gold;state.fieldwork.repairs.push(id);return result(true,def.name+'修复完成！','harvest');
}
export function restAtShelter(state:GameStateV2):Result{
  if(nearby(state)?.id!=='repair:shelter'||!state.fieldwork.repairs.includes('shelter'))return result(false,'先修复山间休憩亭');
  if(state.fieldwork.restDay===state.calendar.day)return result(false,'今天已经休憩过了，明天再来');
  if(state.player.vitals.stamina>=100)return result(false,'现在精神很好，累了再来歇脚');
  state.player.vitals.stamina=Math.min(100,state.player.vitals.stamina+15);state.fieldwork.restDay=state.calendar.day;
  return result(true,'听着松风休憩 · 体力 +15','food');
}
export function farmAction(state:GameStateV2,x:number,y:number):Result{
  if(machineAt(state,x,y))return result(false,'这里摆着设施，按 E 操作或在布置中搬动。');
  if(state.player.scene!=='farm'||!isUnlockedPlot(state,x,y))return result(false,'请在已解锁的农田使用工具');
  if(Math.abs(x-state.player.x)+Math.abs(y-state.player.y)>1)return result(false,'走近一点，再照料这块地');
  const index=plotIndex(x,y),plot=state.plots[index],tool=state.selectedTool;
  if(state.weeds.includes(index)){
    if(tool!=='hoe')return result(false,'这里长满杂草，先用锄头（1）清理');
    const bag=cloneBag(state.inventory);
    if(!add(bag,'fiber',1))return result(false,'背包满了，先到储物箱腾出空间再除草');
    if(!spend(state,2))return result(false,'体力不足，打开背包吃点口粮再来');
    state.inventory=bag;state.weeds=state.weeds.filter(i=>i!==index);discover(state,'fiber');
    return result(true,'清除了杂草 · 纤维 +1 · 再用锄头松土即可播种','harvest');
  }
  if(tool==='hoe'){
    if(plot.tilled)return result(false,'这块地已经松过土了');
    if(!spend(state,2))return result(false,'体力不足，吃点东西再来吧');
    plot.tilled=true;return result(true,'泥土松软了，可以播种','soil');
  }
  if(tool==='seed'){
    const crop=CROPS.find(c=>c.id===state.selectedSeed)!;
    if(!plot.tilled)return result(false,'先用锄头松土');
    if(plot.crop)return result(false,'这里已经有作物了');
    if(!crop.seasons.includes(seasonOf(state.calendar.day)))return result(false,`${crop.name}不适合在这个季节播种`);
    if(quantity(state.inventory,`seed_${crop.id}`)<1)return result(false,'种子用完了，到小镇补充吧');
    if(!spend(state,1))return result(false,'体力不足，先吃点东西');
    remove(state.inventory,`seed_${crop.id}`,1);plot.crop={id:crop.id,growth:0,watered:state.calendar.weather==='rain'};state.stats.planted++;gainXP(state,2);return result(true,`种下了${crop.name}`,'soil');
  }
  if(tool==='water'){
    if(!plot.crop)return result(false,'先种下一颗种子吧');
    if(plot.crop.watered)return result(false,'今天已经浇过水了');
    const crop=CROPS.find(c=>c.id===plot.crop!.id)!;
    if(!crop.seasons.includes(seasonOf(state.calendar.day)))return result(false,'作物正在休眠，适宜季节会恢复生长');
    if(plot.crop.growth>=crop.days)return result(false,'已经成熟，可以采收了');
    if(!spend(state,1))return result(false,'体力不足，先吃点东西');
    plot.crop.watered=true;return result(true,'今天的水，浇好了','water');
  }
  if(tool==='hand'){
    if(!plot.crop)return result(false,'这里还没有可以收获的作物');
    const crop=CROPS.find(c=>c.id===plot.crop!.id)!;
    if(!crop.seasons.includes(seasonOf(state.calendar.day)))return result(false,'作物正在休眠，适宜季节会恢复生长');
    if(plot.crop.growth<crop.days)return result(false,`还需要 ${crop.days-plot.crop.growth} 个浇水日成熟`);
    const draft=cloneBag(state.inventory);if(!add(draft,crop.id,1))return result(false,'背包已满，先整理一下');
    if(!spend(state,1))return result(false,'体力不足，先吃点东西');
    state.inventory=draft;state.stats.harvested++;discover(state,crop.id);
    if(crop.regrow){plot.crop.growth=crop.days-crop.regrow;plot.crop.watered=false}else plot.crop=null;
    return result(true,`收获了${crop.name}！`,'harvest');
  }
  return result(false,'换上适合的工具吧');
}
export function gather(state:GameStateV2,x:number,y:number):Result{
  if(Math.abs(x-state.player.x)+Math.abs(y-state.player.y)>1)return result(false,'走近一些才能采集');
  const node=availableForage(state).find(n=>n.x===x&&n.y===y),key=`${state.player.scene}:${node?.id}`;
  if(!node||state.gathered.includes(key))return result(false,'这里暂时没有可采集的东西');
  if(labourNode(node))return harvestResource(state,x,y);
  const id=node.kind==='forage'?FORAGE[node.index].id:nodeItem(node),count=1;
  const draft=cloneBag(state.inventory);if(!add(draft,id,count))return result(false,'背包满了，先整理一下');
  state.inventory=draft;state.gathered.push(key);state.ecology.nodeReady[key]=state.calendar.day+(state.player.scene==='farm'?1:['forage','shell'].includes(node.kind)?ECOLOGY.forageDays:ECOLOGY.materialDays);discover(state,id,count);return result(true,`获得 ${ITEMS[id].name} × ${count}`,'harvest');
}
export function eat(state:GameStateV2,id:string):Result{
  const food=ITEMS[id]?.food;if(!food||quantity(state.inventory,id)<1)return result(false,'这个物品不能食用');
  if(Object.values(state.player.vitals).every(v=>v>=100))return result(false,'现在状态很好，留到需要的时候吧');
  remove(state.inventory,id,1);for(const key of ['health','stamina','hunger'] as const)state.player.vitals[key]=Math.min(100,state.player.vitals[key]+food[key]);return result(true,`吃了${ITEMS[id].name}，感觉好多了`,'food');
}
export function cook(state:GameStateV2,id:string):Result{
  if(state.player.scene!=='home'||nearby(state)?.id!=='kitchen')return result(false,'请到厨房烹饪');
  const recipe=RECIPES.find(r=>r.id===id);if(!recipe)return result(false,'没有这份食谱');
  if(!exchange(state.inventory,recipe.ingredients,[{id,count:1}]))return result(false,'材料不足，或背包放不下料理');
  state.stats.cooked++;discover(state,id);if(id==='salad'&&state.social.people.ahe.stage===1&&state.social.people.ahe.active)state.social.people.ahe.cooked=true;return result(true,`${recipe.name}做好了`,'food');
}
export const shopOpen=(state:GameStateV2)=>state.calendar.minute>=480&&state.calendar.minute<1200;
export function buy(state:GameStateV2,id:string,count:number):Result{
  if(state.player.scene!=='town'||!shopOpen(state)||nearby(state)?.id!=='grocer')return result(false,'请在营业时间到杂货店购买');
  const item=ITEMS[id];if(!item?.buy||!Number.isSafeInteger(count)||count<1||count>99)return result(false,'购买数量不正确');
  const crop=CROPS.find(c=>`seed_${c.id}`===id);if(crop&&!crop.seasons.includes(seasonOf(state.calendar.day)))return result(false,'这个季节不出售这种种子');
  if(state.gold<item.buy*count)return result(false,'金币不足');
  if(!add(state.inventory,id,count))return result(false,'背包已满');
  state.gold-=item.buy*count;if(item.kind==='seed'&&state.stats.shipped>=5)state.stats.boughtAfterShipping=true;return result(true,`买到了 ${item.name} × ${count}`);
}
export function sell(state:GameStateV2,id:string,count:number,shipping=false):Result{
  const access=nearby(state)?.id;
  if(shipping?access!=='shipping':state.player.scene!=='town'||!shopOpen(state)||!['grocer','fisher'].includes(access??''))return result(false,'请到出货箱或营业中的商店交易');
  if(!ITEMS[id]||!Number.isSafeInteger(count)||count<1||!remove(state.inventory,id,count))return result(false,'没有足够物品');
  const value=ITEMS[id].sell*count;
  if(shipping){const stack=state.shipping.find(s=>s.id===id);if(stack)stack.count+=count;else state.shipping.push({id,count})}
  else{state.gold+=value;state.stats.revenue+=value}
  state.stats.shipped+=count;return result(true,shipping?`已装箱，明日入账 ${value} G`:`已售出，收入 ${value} G`);
}
export function submitOrder(state:GameStateV2,id:string):Result{
  if(nearby(state)?.id!=='orders')return result(false,'请到小镇公告板交付');
  const order=state.orders.find(o=>o.id===id);if(!order||order.done)return result(false,'这份订单已完成');
  if(!remove(state.inventory,order.item,order.count))return result(false,'背包中的物品还不够');
  if(order.villager){const p=state.social.people[order.villager];p.hearts=Math.min(100,p.hearts+3);}
  order.done=true;state.gold+=order.reward;state.stats.reputation+=10;state.stats.orders++;state.stats.revenue+=order.reward;gainXP(state,25);discover(state,order.item,0);return result(true,`订单完成！+${order.reward} G，声望 +10，经验 +25`);
}
export function upgrade(state:GameStateV2,type:keyof typeof UPGRADE_COSTS):Result{
  const access=nearby(state)?.id;if(!shopOpen(state)||state.player.scene!=='town'||(type==='rod'?access!=='fisher':access!=='smith'))return result(false,'请到营业中的对应工坊升级');
  const level=state.upgrades[type],cost=UPGRADE_COSTS[type]?.[level];if(!cost)return result(false,'已经升到最高级了');
  if(state.gold<cost.gold||quantity(state.inventory,'wood')<cost.wood||quantity(state.inventory,'stone')<cost.stone)return result(false,'金币或材料不足');
  state.gold-=cost.gold;if(cost.wood)remove(state.inventory,'wood',cost.wood);if(cost.stone)remove(state.inventory,'stone',cost.stone);state.upgrades[type]++;
  if(type==='bag')state.inventory.capacity=24+12*state.upgrades.bag;
  return result(true,'升级完成，试试新的变化吧！');
}
export function unlockAppearance(state:GameStateV2,type:'outfits'|'hats',id:number):Result{
  if(nearby(state)?.id!=='wardrobe')return result(false,'请到小屋衣柜更换外观');
  if(!Number.isInteger(id)||id<0||id>=(type==='outfits'?8:6))return result(false,'没有这个外观');
  if(state.unlocked[type].includes(id))return result(false,'已拥有这个外观');
  const cost=type==='outfits'?150+id*35:100+id*25;if(state.gold<cost)return result(false,'金币不足');
  state.gold-=cost;state.unlocked[type].push(id);return result(true,'新外观已加入衣柜');
}
export function setAppearance(state:GameStateV2,value:Appearance):Result{
  if(nearby(state)?.id!=='wardrobe')return result(false,'请到小屋衣柜更换外观');
  if(!Number.isInteger(value.skin)||value.skin<0||value.skin>5||!Number.isInteger(value.hair)||value.hair<0||value.hair>5||!state.unlocked.outfits.includes(value.outfit)||(value.hat!==-1&&!state.unlocked.hats.includes(value.hat)))return result(false,'请先解锁选择的衣服或帽子');
  state.player.appearance={...value};return result(true,'换上新衣服，出门走走吧');
}
export function chestTransfer(state:GameStateV2,id:string,count:number,deposit:boolean):Result{
  if(nearby(state)?.id!=='chest')return result(false,'请到储物箱旁整理物品');
  return transfer(deposit?state.inventory:state.chest,deposit?state.chest:state.inventory,id,count)?result(true,'物品已转移'):result(false,'物品不足或目标空间已满');
}
export function travel(state:GameStateV2,id:string):Result{
  const exit=SCENES[state.player.scene].exits.find(e=>e.id===id);if(!exit||Math.abs(exit.x-state.player.x)+Math.abs(exit.y-state.player.y)>1)return result(false,'先走到出口旁');
  if(!areaOpen(state,exit.to)){const area=AREAS.find(a=>a.id===exit.to)!;return result(false,`${area.name}需要 Lv.${area.level}，或购买 ${area.price} G 通行证`)}
  if(!passable(exit.to,...exit.spawn,state.clearedObjects,state.ecology.trees,state.facilities.machines))return result(false,'这条路暂时无法通行');
  state.player.scene=exit.to;[state.player.x,state.player.y]=exit.spawn;return result(true,`来到${SCENES[exit.to].name}`);
}
export function step(state:GameStateV2,direction:GameStateV2['player']['direction']):Result{
  const p=state.player;p.direction=direction;const [dx,dy]=({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[direction];
  if(!passable(p.scene,p.x+dx,p.y+dy,state.clearedObjects,state.ecology.trees,state.facilities.machines))return result(false,'');p.x+=dx;p.y+=dy;
  if(SCENES[p.scene].thorns.some(([x,y])=>x===p.x&&y===p.y)){p.vitals.health=Math.max(0,p.vitals.health-5);if(p.vitals.health===0)return dayEnd(state,true);return result(true,'荆棘划伤了你 · 生命 -5')}
  return result(true,'');
}
export function eligibleFish(state:GameStateV2){const hour=state.calendar.minute/60;return FISH.filter(f=>f.scenes.includes(state.player.scene)&&f.seasons.includes(seasonOf(state.calendar.day))&&f.weather.includes(state.calendar.weather)&&hour>=f.hours[0]&&hour<f.hours[1]);}
export function chooseFish(state:GameStateV2,rng:RNG=()=>random(state)){
  const fish=eligibleFish(state);const total=fish.reduce((n,f)=>n+1/f.rarity**2,0);let roll=rng()*total;
  for(const f of fish){roll-=1/f.rarity**2;if(roll<=0)return f.id}return fish[0]?.id??'crucian';
}
export function canFish(state:GameStateV2){return fishingSpots(state).some(([x,y])=>Math.abs(x-state.player.x)+Math.abs(y-state.player.y)<=1);}
export function acceptCatch(state:GameStateV2,replace=-1):Result{
  const id=state.pendingCatch;if(!id)return result(false,'没有待领取的渔获');
  const draft=cloneBag(state.inventory);
  if(replace>=0){if(!Number.isInteger(replace)||replace>=draft.slots.length)return result(false,'没有这个背包格');draft.slots.splice(replace,1)}
  if(!add(draft,id,1))return result(false,'背包满了，可以替换一组物品或放生');
  state.inventory=draft;state.pendingCatch=null;state.stats.caught++;discover(state,id);if(state.player.scene==='lake'&&state.social.people.zhou.active&&state.social.people.zhou.stage===2)state.social.people.zhou.caught=true;return result(true,`钓到了${ITEMS[id].name}！`,'harvest');
}
