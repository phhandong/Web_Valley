import type { GameStateV2,Result,SceneId } from './types';
import { add,cloneBag,quantity,remove } from './inventory';
import { nearby } from './world';
import { LEVEL_THRESHOLDS,ECOLOGY } from './balance';

export const LEVEL_XP=LEVEL_THRESHOLDS;
export const AREAS=[
  {id:'grove',name:'萤火秘林',level:3,price:180,description:'成片野果、暮色萤火与林间补给。'},
  {id:'quarry',name:'回声石谷',level:5,price:400,description:'密集矿石、古老石碑与矿藏。'},
  {id:'coast',name:'潮声海湾',level:4,price:350,description:'从湖畔南端出发，寻找海鱼、漂流木与潮汐宝箱。'},
  {id:'ridge',name:'云杉山脊',level:6,price:650,description:'从石谷东侧出发，发现高山湖、草药与观景台。'}
] as const;
export const levelOf=(s:GameStateV2)=>LEVEL_XP.filter(x=>s.progression.xp>=x).length;
export const areaOpen=(s:GameStateV2,id:SceneId)=>!AREAS.some(a=>a.id===id)||s.progression.areas.includes(id)||AREAS.some(a=>a.id===id&&levelOf(s)>=a.level);
export function gainXP(s:GameStateV2,amount:number){s.progression.xp+=amount;}
export function purchaseArea(s:GameStateV2,id:string):Result{
  const a=AREAS.find(a=>a.id===id);
  if(!a||nearby(s)?.kind!=='exit'||nearby(s)?.id!==id)return{ok:false,message:'请走到对应区域的入口路牌旁办理通行。'};
  if(areaOpen(s,a.id))return{ok:false,message:'这片区域已经开放。'};
  if(s.gold<a.price)return{ok:false,message:`还需要 ${a.price-s.gold} G，也可以提升到 Lv.${a.level} 免费进入。`};
  s.gold-=a.price;s.progression.areas.push(id);return{ok:true,message:`${a.name}永久开放！在路牌旁按 E 进入。`};
}
export const TRAILS=[
  {id:'trail1',x:9,y:5,label:'足印 · 林间北坡'},
  {id:'trail2',x:26,y:12,label:'羽毛 · 东侧池塘'},
  {id:'trail3',x:12,y:16,label:'树刻 · 南方小径'}
];
export function forestEvent(s:GameStateV2,id:string):Result{
  if(nearby(s)?.id!==`event:${id}`)return{ok:false,message:'走近森林标记，再按 E。'};
  const done=s.progression.forestEvents;
  if(done.includes(id))return{ok:false,message:'今天已经探索过这里，明天再来看看。'};
  const ready=s.ecology.eventReady[id]??0;
  if(ready>s.calendar.day)return{ok:false,message:`这里需要恢复，再过 ${ready-s.calendar.day} 天来看看。`};
  let message='';
  if(id.startsWith('trail')){gainXP(s,8);message=`发现线索！${done.filter(k=>k.startsWith('trail')).length+1}/3 · 经验 +8`;}
  else if(id==='cache'){
    if(!TRAILS.every(t=>done.includes(t.id)))return{ok:false,message:'箱子上有三个符号。先找齐北坡足印、池塘羽毛与南径树刻。'};
    s.gold+=60;s.stats.revenue+=60;gainXP(s,30);message='解开林间宝箱！金币 +60 · 经验 +30';
  }else if(id==='fox'){
    if(quantity(s.inventory,'berry')<2)return{ok:false,message:'小狐狸嗅了嗅你的行囊：用 2 颗莓果换它找到的 25 G。'};
    remove(s.inventory,'berry',2);s.gold+=25;s.stats.revenue+=25;gainXP(s,15);s.encounters.foxTrades++;message='小狐狸留下亮闪闪的钱币。金币 +25 · 经验 +15';
  }else if(id==='spring'){
    s.player.vitals.health=Math.min(100,s.player.vitals.health+20);s.player.vitals.stamina=Math.min(100,s.player.vitals.stamina+25);message='在清泉旁歇了片刻。生命 +20 · 体力 +25';
  }else if(id==='groveGift'||id==='quarryGift'){
    const item=id==='groveGift'?'apple':'stone',count=id==='groveGift'?3:8,draft=cloneBag(s.inventory);
    if(!add(draft,item,count))return{ok:false,message:'背包已满，整理后再来领取。'};
    s.inventory=draft;gainXP(s,20);message=`找到${id==='groveGift'?'野苹果 ×3':'石料 ×8'} · 经验 +20`;
  }else if(id==='coastGift'){
    const bag=cloneBag(s.inventory);if(!add(bag,'wood',4)||!add(bag,'herb',1))return{ok:false,message:'背包空间不足，整理后再打开漂流箱。'};
    s.inventory=bag;gainXP(s,12);message='潮水送来了木材 ×4、草药 ×1 · 经验 +12';
  }else if(id==='ridgeView'){
    s.player.vitals.stamina=Math.min(100,s.player.vitals.stamina+15);gainXP(s,12);message='云海在脚下舒展 · 体力 +15 · 经验 +12';
  }else return{ok:false,message:'这里暂时没有新的发现。'};
  if(!id.startsWith('trail')&&id!=='spring')s.ecology.eventReady[id]=s.calendar.day+ECOLOGY.eventDays;
  done.push(id);return{ok:true,message,effect:'harvest'};
}
