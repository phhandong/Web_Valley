import { ITEMS } from './content';
import { PEOPLE, PERSON_IDS } from './life-content';
import { cloneBag, remove } from './inventory';
import type { DynamicNode, GameStateV2, Result, VillagerId } from './types';

const answer=(ok:boolean,message:string):Result=>({ok,message});
export function villagerNodes(s:GameStateV2):DynamicNode[]{
  const minute=s.calendar.minute;if(minute<480||minute>=1200)return [];
  return PERSON_IDS.map(id=>{
    const evening=minute>=1020&&s.calendar.weather==='sun';
    const position=id==='ahe'?(evening?{scene:'town' as const,x:16,y:13}:{scene:'town' as const,x:9,y:8}):id==='zhou'?(evening?{scene:'lake' as const,x:8,y:12}:{scene:'town' as const,x:19,y:8}):(evening?{scene:'town' as const,x:27,y:9}:{scene:'town' as const,x:28,y:8});
    return {id:'npc:'+id,kind:'villager' as const,...position,label:PEOPLE[id].name+' · 交谈'};
  });
}
export const nodeReachable=(s:GameStateV2,n:DynamicNode)=>s.player.scene===n.scene&&Math.abs(s.player.x-n.x)+Math.abs(s.player.y-n.y)<=1;
export const nearPerson=(s:GameStateV2,id:VillagerId)=>villagerNodes(s).some(n=>n.id==='npc:'+id&&nodeReachable(s,n));
export function dialogue(s:GameStateV2,id:VillagerId){
  const p=s.social.people[id],def=PEOPLE[id];
  const weather=s.calendar.weather==='rain'?'雨下起来了，先在檐下歇歇。':s.calendar.weather==='snow'?'雪落得很轻，路上慢一点。':'';
  return weather+def.daily[(s.calendar.day+PERSON_IDS.indexOf(id))%def.daily.length]+(p.stage===3?' '+({ahe:'分享摊今天又多了一篮菜，多亏了你。',zhou:'旧鱼篓放回湖边了，哪天再一起坐坐。',shi:'装置做好了，你也终于能少提几桶水。'}[id]):p.active?' '+def.stages[p.stage]+'。':'');
}
export function talk(s:GameStateV2,id:VillagerId):Result{
  if(!PEOPLE[id]||!nearPerson(s,id))return answer(false,'走到这位村民身边再交谈。');
  const p=s.social.people[id],fresh=p.talkedDay!==s.calendar.day;
  if(fresh){p.talkedDay=s.calendar.day;p.hearts=Math.min(100,p.hearts+2);}
  return answer(true,dialogue(s,id)+(fresh?' · 好感 +2':''));
}
export function likes(id:VillagerId,item:string){return id==='ahe'?ITEMS[item]?.kind==='crop'||item.startsWith('jam_')||item==='spiced_apple':id==='zhou'?ITEMS[item]?.kind==='fish'||item.startsWith('smoked_')||item.startsWith('dried_')&&item!=='dried_nuts':['stone','quartz','stardust','mushroom_soup'].includes(item);}
export function gift(s:GameStateV2,id:VillagerId,item:string):Result{
  if(!PEOPLE[id]||!nearPerson(s,id))return answer(false,'走到村民身边再赠送。');
  const p=s.social.people[id];if(p.giftedDay===s.calendar.day)return answer(false,'今天已经送过礼物了，明天再来。');
  if(!ITEMS[item]||ITEMS[item].kind==='seed'||!remove(s.inventory,item,1))return answer(false,'请选择背包里的一份非种子物品。');
  const points=likes(id,item)?10:5;p.hearts=Math.min(100,p.hearts+points);p.giftedDay=s.calendar.day;
  return answer(true,`${PEOPLE[id].name}：${points===10?'你还记得我喜欢这个，谢谢！':'谢谢你的心意。'} · 好感 +${points}`);
}
export function storyNodes(s:GameStateV2):DynamicNode[]{
  const nodes:DynamicNode[]=[],z=s.social.people.zhou,shi=s.social.people.shi;
  if(z.active&&z.stage===1&&s.calendar.minute>=1020&&s.calendar.minute<1200){
    for(const [id,x,y,label] of [['memory1',9,7,'旧系绳 · 回忆'],['memory2',8,14,'岸边刻字 · 回忆']] as const)if(!z.clues.includes(id))nodes.push({id:'story:zhou:'+id,scene:'lake',x,y,label,kind:'clue'});
  }
  if(shi.active&&shi.stage===1&&!shi.clues.includes('watermark'))nodes.push({id:'story:shi:watermark',scene:'forest',x:17,y:8,label:'引水痕迹',kind:'clue'});
  return nodes;
}
export function investigateStory(s:GameStateV2,nodeId:string):Result{
  const n=storyNodes(s).find(n=>n.id===nodeId);if(!n||!nodeReachable(s,n))return answer(false,'请走近当前故事的调查标记。');
  const [,id,clue]=nodeId.split(':');s.social.people[id as VillagerId].clues.push(clue);return answer(true,'记下了这处线索。找齐后去和'+PEOPLE[id as VillagerId].name+'聊聊。');
}
export function storyAction(s:GameStateV2,id:VillagerId):Result{
  if(!PEOPLE[id]||!nearPerson(s,id))return answer(false,'请当面与村民交谈。');
  const p=s.social.people[id];if(p.stage>=3)return answer(false,'这段故事已经收入纪念手记。');
  if(p.advancedDay===s.calendar.day)return answer(false,'今天的故事先到这里，明天再聊聊。');
  if(p.hearts<[10,30,60][p.stage])return answer(false,`这一章需要好感 ${[10,30,60][p.stage]}。`);
  if(!p.active){p.active=true;p.clues=[];p.caught=false;p.watered=false;p.cooked=false;return answer(true,'接下了这件小事：'+PEOPLE[id].stages[p.stage]);}
  const bag=cloneBag(s.inventory);let ready=false;
  if(id==='ahe')ready=p.stage===0?remove(bag,'radish',3):p.stage===1?p.cooked&&remove(bag,'salad',1):['jam_berry','jam_apple','jam_strawberry'].some(item=>remove(bag,item,1));
  if(id==='zhou')ready=p.stage===0?remove(bag,'wood',5)&&remove(bag,'fiber',5):p.stage===1?['memory1','memory2'].every(c=>p.clues.includes(c)):p.caught;
  if(id==='shi')ready=p.stage===0?remove(bag,'wood',10)&&remove(bag,'stone',5):p.stage===1?p.clues.includes('watermark'):p.watered;
  if(!ready)return answer(false,'还差一点：'+PEOPLE[id].stages[p.stage]);
  s.inventory=bag;p.stage++;p.active=false;p.advancedDay=s.calendar.day;
  return answer(true,p.stage===3?`故事完成！解锁${PEOPLE[id].reward}配方，纪念已收入手记。`:'谢谢你，事情有了新的进展。明天再来聊聊。');
}
