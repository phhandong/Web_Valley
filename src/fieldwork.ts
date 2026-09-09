import { SCENES,objectKey,objectDistance,resourceAt,treeStage,plotIndex,passable,type Node } from './world';
import { RESOURCE_YIELDS } from './content';
import type { GameStateV2,SceneId } from './types';

export const newFieldwork=():GameStateV2['fieldwork']=>({version:1,clearedGrass:{},damage:{},repairs:[],restDay:0});
export const REPAIRS={
  pier:{scene:'coast',name:'海湾旧栈道',gold:100,ingredients:[{id:'wood',count:20},{id:'fiber',count:10}],description:'修复岸边木栈道，永久开放南端两个海钓位置。'},
  shelter:{scene:'ridge',name:'山间休憩亭',gold:150,ingredients:[{id:'wood',count:15},{id:'stone',count:20}],description:'修好遮雨顶棚和座椅，每天可休憩一次，恢复 15 点体力。'}
} as const;
export const fishingSpots=(s:GameStateV2)=>s.player.scene==='coast'&&s.fieldwork.repairs.includes('pier')?[...SCENES.coast.fishing,[14,18],[16,18]]:SCENES[s.player.scene].fishing;
export const nodeItem=(n:Node)=>n.kind==='shell'?'shell':n.kind==='ore'?'quartz':n.kind;
export const labourNode=(n:Node)=>['wood','stone','ore'].includes(n.kind);
// Grass is authored once from deterministic tile coordinates; cleared records never depend on render randomness.
const paths:Partial<Record<SceneId,number[][]>>={farm:[[1,6,30,2],[4,7,2,12],[9,7,3,12]],town:[[1,9,30,3],[7,7,2,9],[16,7,2,10],[25,7,2,10]],forest:[[3,1,3,17],[5,8,22,2],[13,9,3,9],[27,5,4,2],[26,16,5,2]],grove:[[1,9,16,3],[12,5,3,11]],lake:[[1,9,12,2],[11,5,2,11]],ridge:[[1,9,15,3],[10,7,3,10]]};
export const GRASS=Object.fromEntries(Object.values(SCENES).map(scene=>[scene.id,Array.from({length:30*18},(_,i)=>({x:1+i%30,y:1+Math.floor(i/30)})).filter(({x,y})=>{
  if(['home','quarry','coast','cave'].includes(scene.id)||(x*17+y*23)%13>1)return false;
  if(!passable(scene.id,x,y)||scene.id==='farm'&&plotIndex(x,y)>=0)return false;
  if(paths[scene.id]?.some(([a,b,w,h])=>x>=a&&x<a+w&&y>=b&&y<b+h))return false;
  return !scene.objects.some(o=>objectDistance(x,y,o)<=1)&&!scene.nodes.some(n=>Math.abs(n.x-x)+Math.abs(n.y-y)<=1)&&!scene.thorns.some(([a,b])=>a===x&&b===y)&&![...scene.exits,...scene.fishing.map(([x,y])=>({x,y}))].some(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<=2);
}).map(p=>({...p,key:`${scene.id}:grass:${p.x}:${p.y}`}))])) as Record<SceneId,{x:number;y:number;key:string}[]>;
export const grassAt=(s:GameStateV2,x:number,y:number)=>GRASS[s.player.scene].find(p=>p.x===x&&p.y===y&&(s.fieldwork.clearedGrass[p.key]===undefined||s.fieldwork.clearedGrass[p.key]>0&&s.fieldwork.clearedGrass[p.key]<=s.calendar.day));
export interface WorkTarget {key:string;scene:SceneId;x:number;y:number;kind:'tree'|'rock'|'wood'|'stone'|'ore';tool:'axe'|'pick';item:string;count:number;power:number;node?:Node;objectId?:string}
export function workTarget(s:GameStateV2,x:number,y:number):WorkTarget|null{
  const o=resourceAt(s,x,y),scene=s.player.scene;
  if(o){const tree=o.kind==='tree',rule=RESOURCE_YIELDS[tree?'tree':'rock'];return{key:objectKey(scene,o),scene,x,y,kind:tree?'tree':'rock',tool:rule.tool,item:rule.item,count:rule.count+s.upgrades.tools*2,power:(tree?[2,3,4]:[3,4,6])[s.upgrades.tools],objectId:o.id};}
  const n=SCENES[scene].nodes.find(n=>n.x===x&&n.y===y&&labourNode(n)),key=`${scene}:${n?.id}`;
  if(!n||s.gathered.includes(key)||(s.ecology.nodeReady[key]??0)>s.calendar.day)return null;
  return{key,scene,x,y,kind:n.kind as 'wood'|'stone'|'ore',tool:n.kind==='wood'?'axe':'pick',item:nodeItem(n),count:n.kind==='ore'?1:3+s.upgrades.tools,power:6,node:n};
}
export function workError(s:GameStateV2,t:WorkTarget):string{
  if(t.scene!==s.player.scene)return '已经离开这个采集点';
  const o=t.objectId?SCENES[t.scene].objects.find(o=>o.id===t.objectId):undefined;
  if((o?objectDistance(s.player.x,s.player.y,o):Math.abs(t.x-s.player.x)+Math.abs(t.y-s.player.y))>1)return '走近目标再使用工具';
  if(o?.kind==='tree'&&treeStage(s,t.scene,o)!=='mature')return '这棵树还在生长，长成大树后才能砍伐';
  if(s.selectedTool!==t.tool)return t.tool==='axe'?'切换到斧头（6）砍伐':'切换到石镐（7）开采';
  if(s.player.vitals.stamina<(s.player.vitals.hunger<20?2:1))return '体力不足，打开背包吃点东西再来';
  return '';
}
