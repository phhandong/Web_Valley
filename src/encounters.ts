import { CROPS, FISH, FORAGE, ITEMS, RECIPES, SEASONS } from './content';
import { PROCESSING } from './life-content';
import { add, cloneBag, quantity } from './inventory';
import { areaOpen } from './progression';
import { recordDiscovery } from './facilities';
import { nodeReachable } from './villagers';
import type { DynamicNode, EncounterId, GameStateV2, Result, RNG, Stack, Weather } from './types';

export const ENCOUNTERS:Record<EncounterId,{name:string;scene:DynamicNode['scene'];hint:string;points:[number,number,string][];reward:Stack[]}>= {
  mushrooms:{name:'雨后蘑菇',scene:'forest',hint:'雨后，森林西侧出现湿脚印。今天全天可调查。',points:[[6,7,'湿脚印'],[8,9,'菌丝'],[10,9,'雨后菌丛']],reward:[{id:'mushroom',count:3},{id:'herb',count:1}]},
  tide:{name:'退潮洞穴',scene:'cave',hint:'海湾北端岩隙在 12:00—18:00 退潮时开放。',points:[[10,8,'浅色潮痕'],[20,10,'贝壳划痕'],[24,7,'潮汐贝箱']],reward:[{id:'shell',count:3},{id:'quartz',count:1}]},
  meteor:{name:'山脊流星',scene:'ridge',hint:'今晚 20:00—24:00，山脊观景台西侧可以寻找星光。',points:[[9,9,'西侧星光'],[13,10,'松间星光'],[15,9,'流星落点']],reward:[{id:'stardust',count:1}]},
  fox:{name:'狐狸寻宝',scene:'forest',hint:'熟悉的小狐狸正在森林入口等你，今天全天可寻宝。',points:[[7,7,'小狐狸 · 跟着足印'],[9,9,'第一串足印'],[13,9,'第二串足印'],[16,9,'第三串足印'],[17,12,'狐狸的藏物']],reward:[{id:'apple',count:2},{id:'wood',count:4}]}
};
export function generateEncounters(s:GameStateV2,previous:Weather,rng:RNG){
  if(s.encounters.day===s.calendar.day)return;
  const oldFox=s.encounters.daily.find(e=>e.id==='fox');
  if(oldFox&&!oldFox.claimed)s.encounters.foxReady=s.calendar.day+2;
  const ids:EncounterId[]=[];
  if(previous==='rain')ids.push('mushrooms');
  if(areaOpen(s,'coast')&&s.calendar.day%3===0)ids.push('tide');
  if(areaOpen(s,'ridge')&&s.calendar.weather==='sun'&&rng()<.25)ids.push('meteor');
  if(s.encounters.foxTrades>=3&&s.encounters.foxReady<=s.calendar.day)ids.push('fox');
  s.encounters.day=s.calendar.day;s.encounters.previousWeather=previous;s.encounters.caveSession=false;
  s.encounters.daily=ids.map(id=>({id,clues:[],claimed:false,started:false}));
}
export const tideOpen=(s:GameStateV2)=>areaOpen(s,'coast')&&s.encounters.daily.some(e=>e.id==='tide'&&!e.claimed)&&s.calendar.minute>=720&&s.calendar.minute<1080;
export function encounterActive(s:GameStateV2,id:EncounterId){
  if(id==='meteor')return areaOpen(s,'ridge')&&s.calendar.minute>=1200&&s.calendar.minute<1440;
  if(id==='tide')return s.encounters.caveSession&&s.player.scene==='cave';
  return true;
}
export function encounterNodes(s:GameStateV2):DynamicNode[]{
  const nodes:DynamicNode[]=[];
  if(tideOpen(s))nodes.push({id:'adventure:enter',scene:'coast',x:10,y:2,label:'退潮岩隙 · 进入洞穴',kind:'entrance'});
  if(s.player.scene==='cave')nodes.push({id:'adventure:leave',scene:'cave',x:6,y:16,label:'返回海湾',kind:'entrance'});
  for(const event of s.encounters.daily){
    if(event.claimed||!encounterActive(s,event.id))continue;
    const def=ENCOUNTERS[event.id],index=event.clues.length,point=def.points[index];if(!point)continue;
    nodes.push({id:`adventure:${event.id}:${index}`,scene:def.scene,x:point[0],y:point[1],label:point[2],kind:index===def.points.length-1?'reward':'clue'});
  }
  return nodes;
}
export function investigateEncounter(s:GameStateV2,id:string):Result{
  const node=encounterNodes(s).find(n=>n.id===id);
  if(!node||!nodeReachable(s,node))return {ok:false,message:'请在有效时段走近探索标记。'};
  if(id==='adventure:enter'){s.encounters.caveSession=true;s.player.scene='cave';s.player.x=6;s.player.y=15;return {ok:true,message:'潮水退去了，沿着潮痕往里看看。涨潮后仍可从原路退出。'};}
  if(id==='adventure:leave'){
    if(s.calendar.minute>=1080){const tide=s.encounters.daily.find(e=>e.id==='tide');if(tide)tide.claimed=true;}
    s.encounters.caveSession=false;s.player.scene='coast';s.player.x=10;s.player.y=3;return {ok:true,message:'回到海湾。'};
  }
  const [,type,index]=id.split(':'),event=s.encounters.daily.find(e=>e.id===type)!,def=ENCOUNTERS[event.id];
  if(Number(index)===def.points.length-1){
    const bag=cloneBag(s.inventory);if(!def.reward.every(i=>add(bag,i.id,i.count)))return {ok:false,message:'背包空间不足，奖励保留，整理后再来。'};
    s.inventory=bag;event.claimed=true;for(const i of def.reward)recordDiscovery(s,i.id,i.count);
    if(event.id==='fox')s.encounters.foxReady=s.calendar.day+3;
    return {ok:true,message:'找到'+def.reward.map(i=>`${ITEMS[i.id].name} ×${i.count}`).join('、')+'！',effect:'harvest'};
  }
  event.started=true;event.clues.push(index);return {ok:true,message:`记下线索 ${event.clues.length}/${def.points.length-1}，附近出现了下一处痕迹。`};
}
export const todayHints=(s:GameStateV2)=>s.encounters.daily.filter(e=>!e.claimed&&(e.id!=='meteor'||areaOpen(s,'ridge'))&&(e.id!=='tide'||areaOpen(s,'coast'))).map(e=>ENCOUNTERS[e.id].hint);

// Orders require enough stock obtainable today; multi-night recipes are not treated as instant supply.
export function obtainableToday(s:GameStateV2,id:string):boolean{
  if(quantity(s.inventory,id)+quantity(s.chest,id)>0)return true;
  const current=SEASONS[(2+Math.floor((s.calendar.day-1)/14))%4];
  const crop=CROPS.find(c=>c.id===id);if(crop)return crop.seasons.includes(current)&&s.plots.some(p=>p.crop?.id===id&&p.crop.growth>=crop.days);
  const fish=FISH.find(f=>f.id===id);if(fish)return fish.seasons.includes(current)&&fish.weather.includes(s.calendar.weather)&&fish.hours[1]*60>s.calendar.minute&&fish.scenes.some(scene=>areaOpen(s,scene));
  const forage=FORAGE.find(f=>f.id===id);if(forage)return forage.seasons.includes(current);
  const meal=RECIPES.find(r=>r.id===id);if(meal)return meal.ingredients.every(i=>quantity(s.inventory,i.id)+quantity(s.chest,i.id)>=i.count);
  if(PROCESSING.some(r=>r.id===id)||id.startsWith('honey_'))return s.facilities.machines.some(m=>m.output===id);
  if(id==='shell')return areaOpen(s,'coast');if(id==='quartz')return areaOpen(s,'ridge');
  if(id==='stardust')return s.calendar.minute<1440&&s.encounters.daily.some(e=>e.id==='meteor'&&!e.claimed);
  return false;
}
