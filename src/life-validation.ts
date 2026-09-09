import { MACHINE_KINDS, PERSON_IDS, PROCESSING, FLOWERS } from './life-content';
import { ENCOUNTERS } from './encounters';
import { placementError } from './facilities';
import type { GameStateV2 } from './types';
const object=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const integer=(v:unknown,min=0,max=1e12):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const exactKeys=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export function validLife(s:GameStateV2):boolean{
  const {social,facilities:f,encounters:e}=s,day=s.calendar.day;
  if(!object(social)||social.version!==1||!object(social.people)||!exactKeys(social.people,PERSON_IDS))return false;
  for(const id of PERSON_IDS){
    const p=social.people[id];if(!object(p)||!integer(p.hearts,0,100)||!integer(p.stage,0,3)||!(['talkedDay','giftedDay','advancedDay'] as const).every(k=>integer(p[k],0,day))||!(['active','caught','watered','cooked'] as const).every(k=>typeof p[k]==='boolean')||p.stage===3&&p.active)return false;
    const allowed=id==='zhou'?['memory1','memory2']:id==='shi'?['watermark']:[];
    if(!Array.isArray(p.clues)||p.clues.some((c:unknown)=>typeof c!=='string'||!allowed.includes(c))||new Set(p.clues).size!==p.clues.length)return false;
  }
  if(!object(f)||f.version!==1||!object(f.stored)||!exactKeys(f.stored,MACHINE_KINDS)||!MACHINE_KINDS.every(k=>integer(f.stored[k],0,10000))||!integer(f.nextId,1)||!integer(f.settledDay,0,day)||!Array.isArray(f.machines)||f.machines.length>540)return false;
  const ids=new Set<number>(),tiles=new Set<string>();
  for(const m of f.machines){
    if(!object(m)||!integer(m.id,1,f.nextId-1)||!MACHINE_KINDS.includes(m.kind)||!integer(m.x,1,30)||!integer(m.y,1,18)||!integer(m.placedDay,1,day)||ids.has(m.id)||tiles.has(m.x+','+m.y)||!integer(m.honeyProgress,0,1))return false;
    ids.add(m.id);tiles.add(m.x+','+m.y);
    if(m.job!==null){const job=m.job,recipe=object(job)&&PROCESSING.find(r=>r.id===job.recipe);if(!recipe||recipe.machine!==m.kind||!integer(job.remaining,1,recipe.nights)||m.output!==null||recipe.owner&&social.people[recipe.owner].stage!==3)return false;}
    if(m.output!==null){if(typeof m.output!=='string'||!(m.kind==='hive'?FLOWERS.some(id=>m.output==='honey_'+id):PROCESSING.some(r=>r.id===m.output&&r.machine===m.kind)))return false;}
    if(m.kind==='hive'){if(m.job!==null||m.honeyProgress>0&&(m.flower===null||!FLOWERS.includes(m.flower)||m.output!==null)||m.honeyProgress===0&&m.flower!==null)return false;}
    else if(m.honeyProgress!==0||m.flower!==null)return false;
  }
  for(const m of f.machines){const farm={...s,player:{...s.player,scene:'farm' as const,x:10,y:9}};if(placementError(farm,m.kind,m.x,m.y,m.id))return false;}
  if(!object(e)||e.version!==1||!integer(e.day,1,day)||!['sun','rain','snow'].includes(e.previousWeather)||!integer(e.foxTrades)||!integer(e.foxReady)||typeof e.caveSession!=='boolean'||!Array.isArray(e.daily)||e.daily.length>4)return false;
  const events=new Set<string>();
  for(const event of e.daily){
    if(!object(event)||!Object.hasOwn(ENCOUNTERS,event.id)||events.has(event.id)||typeof event.claimed!=='boolean'||typeof event.started!=='boolean'||!Array.isArray(event.clues))return false;
    events.add(event.id);const def=ENCOUNTERS[event.id as keyof typeof ENCOUNTERS];
    if(event.clues.length>def.points.length-1||event.clues.some((c:unknown,i:number)=>c!==String(i)))return false;
  }
  if(e.caveSession!==(s.player.scene==='cave')||e.caveSession&&!events.has('tide'))return false;
  if(s.orders.some(o=>o.villager!==undefined&&!PERSON_IDS.includes(o.villager)))return false;
  return true;
}
