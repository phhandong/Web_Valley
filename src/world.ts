import type { SceneId, GameStateV2 } from './types';
import { ECOLOGY } from './balance';
export const TILE=24, COLS=32, ROWS=20;
export const FARM={x:12,y:8,cols:12,rows:10};
// Dense, deterministic wilderness; paths and all scene entrances remain clear.
export const initialWeeds=()=>Array.from({length:120},(_,i)=>i).filter(i=>(i*7+Math.floor(i/12)*3)%10<8);
export type ObjectKind='house'|'tree'|'rock'|'water'|'shop'|'bed'|'wardrobe'|'kitchen'|'chest'|'shipping'|'board'|'lamp'|'bench';
export interface WorldObject {id:string;kind:ObjectKind;x:number;y:number;w:number;h:number;label?:string;action?:string;solid?:boolean}
export interface Exit {id:string;x:number;y:number;label:string;to:SceneId;spawn:[number,number]}
export interface Node {id:string;x:number;y:number;kind:'forage'|'wood'|'stone'|'shell'|'ore';index:number}
export interface SceneDefinition {id:SceneId;name:string;subtitle:string;objects:WorldObject[];exits:Exit[];nodes:Node[];thorns:[number,number][];fishing:[number,number][]}
const tree=(id:string,x:number,y:number):WorldObject=>({id,kind:'tree',x,y,w:2,h:2,solid:true});
export const SCENES:Record<SceneId,SceneDefinition>={
  farm:{id:'farm',name:'溪谷农场',subtitle:'把日子种进泥土里',objects:[
    {id:'farmhouse',kind:'house',x:3,y:2,w:5,h:4,label:'橡果小屋',solid:true},
    {id:'shipping',kind:'shipping',x:9,y:5,w:1,h:1,label:'出货箱',action:'shipping',solid:true},
    {id:'farmchest',kind:'chest',x:3,y:7,w:1,h:1,label:'储物箱',action:'chest',solid:true},
    {id:'pond',kind:'water',x:3,y:11,w:6,h:4},
    {id:'farmrock1',kind:'rock',x:8,y:8,w:1,h:1,solid:true},
    {id:'farmrock2',kind:'rock',x:25,y:12,w:2,h:2,solid:true},
    tree('f1',1,2),tree('f2',10,2),tree('f3',15,2),tree('f4',20,2),tree('f5',25,3),tree('f6',27,14),tree('f7',8,17),
    {id:'lamp',kind:'lamp',x:9,y:7,w:1,h:1}
  ],exits:[{id:'home',x:5,y:6,label:'进入小屋',to:'home',spawn:[16,16]},{id:'town',x:30,y:7,label:'小镇 →',to:'town',spawn:[2,10]},{id:'forest',x:4,y:18,label:'森林 ↓',to:'forest',spawn:[4,2]}],nodes:[0,1,2,3,4,5].map(i=>({id:`food${i}`,x:2+i,y:9,kind:'forage',index:0})),thorns:[],fishing:[[5,10],[6,10]]},
  home:{id:'home',name:'橡果小屋',subtitle:'灯亮着，家就在这里',objects:[
    {id:'bed',kind:'bed',x:7,y:5,w:3,h:3,label:'休息',action:'sleep',solid:true},
    {id:'wardrobe',kind:'wardrobe',x:12,y:4,w:2,h:3,label:'衣柜',action:'wardrobe',solid:true},
    {id:'kitchen',kind:'kitchen',x:21,y:4,w:4,h:3,label:'厨房',action:'kitchen',solid:true},
    {id:'homechest',kind:'chest',x:7,y:12,w:2,h:1,label:'储物箱',action:'chest',solid:true},
    {id:'table',kind:'bench',x:17,y:10,w:3,h:2,solid:true,label:'起居区'},
    {id:'homelamp',kind:'lamp',x:24,y:12,w:1,h:1}
  ],exits:[{id:'out',x:16,y:17,label:'回到农场 ↓',to:'farm',spawn:[5,7]}],nodes:[],thorns:[],fishing:[]},
  town:{id:'town',name:'溪谷小镇',subtitle:'来买点种子，也听听新的故事',objects:[
    {id:'grocer',kind:'shop',x:5,y:3,w:6,h:4,label:'阿禾 · 杂货',action:'grocer',solid:true},
    {id:'fisher',kind:'shop',x:15,y:3,w:5,h:4,label:'老舟 · 渔具',action:'fisher',solid:true},
    {id:'smith',kind:'shop',x:23,y:3,w:6,h:4,label:'石叔 · 工坊',action:'smith',solid:true},
    {id:'board',kind:'board',x:12,y:12,w:2,h:2,label:'每日订单',action:'orders',solid:true},
    {id:'fountain',kind:'water',x:20,y:13,w:4,h:3},
    tree('t1',3,14),tree('t2',7,16),tree('t3',27,15),
    {id:'lamp1',kind:'lamp',x:9,y:10,w:1,h:1},{id:'lamp2',kind:'lamp',x:24,y:10,w:1,h:1}
  ],exits:[{id:'farm',x:1,y:10,label:'← 农场',to:'farm',spawn:[29,7]},{id:'lake',x:30,y:10,label:'湖畔 →',to:'lake',spawn:[2,10]}],nodes:[],thorns:[],fishing:[]},
  forest:{id:'forest',name:'松影森林',subtitle:'沿着小径，寻找四季的馈赠',objects:[
    ...[[1,5],[7,3],[11,2],[16,3],[21,2],[27,3],[2,12],[8,14],[13,13],[18,16],[25,15],[28,10]].map(([x,y],i)=>tree(`tree${i}`,x,y)),
    {id:'pool',kind:'water',x:19,y:8,w:5,h:4},
    {id:'trail1',kind:'board',x:9,y:5,w:1,h:1,label:'足印',action:'event:trail1',solid:true},
    {id:'trail2',kind:'board',x:26,y:12,w:1,h:1,label:'羽毛',action:'event:trail2',solid:true},
    {id:'trail3',kind:'board',x:12,y:16,w:1,h:1,label:'树刻',action:'event:trail3',solid:true},
    {id:'cache',kind:'chest',x:6,y:3,w:1,h:1,label:'寻迹宝箱',action:'event:cache',solid:true},
    {id:'fox',kind:'bench',x:10,y:7,w:1,h:1,label:'小狐狸 · 莓果交换',action:'event:fox',solid:true},
    {id:'spring',kind:'rock',x:18,y:8,w:1,h:1,label:'清泉休憩',action:'event:spring',solid:true}
  ],exits:[{id:'farm',x:4,y:1,label:'↑ 农场',to:'farm',spawn:[4,17]},{id:'grove',x:30,y:6,label:'秘林 →',to:'grove',spawn:[2,10]},{id:'quarry',x:30,y:17,label:'石谷 →',to:'quarry',spawn:[2,10]}],nodes:[
    ...[[5,6],[9,8],[13,5],[17,7],[25,7],[27,13],[6,16],[16,17]].map(([x,y],i)=>({id:`forage${i}`,x,y,kind:'forage' as const,index:i%6})),
    ...[[11,10],[7,11],[26,17],[15,10]].map(([x,y],i)=>({id:`wood${i}`,x,y,kind:'wood' as const,index:0})),
    ...[[3,16],[16,13],[26,10],[11,17]].map(([x,y],i)=>({id:`stone${i}`,x,y,kind:'stone' as const,index:0}))
  ],thorns:[[17,10],[17,11],[18,11],[25,13]],fishing:[]},
  lake:{id:'lake',name:'微光湖畔',subtitle:'把心事交给湖面，把耐心交给鱼',objects:[
    {id:'lakewater',kind:'water',x:13,y:3,w:17,h:15},
    tree('l1',3,3),tree('l2',7,2),tree('l3',4,15),tree('l4',9,16),
    {id:'seat',kind:'bench',x:6,y:12,w:2,h:1,solid:true},{id:'llamp',kind:'lamp',x:10,y:10,w:1,h:1}
  ],exits:[{id:'town',x:1,y:10,label:'← 小镇',to:'town',spawn:[29,10]},{id:'coast',x:6,y:18,label:'海湾 ↓',to:'coast',spawn:[6,2]}],nodes:[],thorns:[],fishing:[[12,6],[12,8],[12,10],[12,12],[12,14]]},
  grove:{id:'grove',name:'萤火秘林',subtitle:'暮色中的光点，藏着林间的秘密',objects:[
    ...[[4,3],[9,2],[15,3],[22,2],[27,5],[4,15],[11,16],[19,15],[26,15]].map(([x,y],i)=>tree(`g${i}`,x,y)),
    {id:'grovepool',kind:'water',x:18,y:7,w:7,h:5},
    {id:'gift',kind:'chest',x:13,y:6,w:1,h:1,label:'林间补给 · 三日',action:'event:groveGift',solid:true}
  ],exits:[{id:'forest',x:1,y:10,label:'← 森林',to:'forest',spawn:[29,6]}],nodes:[
    ...[[6,6],[9,7],[12,10],[15,13],[8,13],[26,12],[28,8],[16,6]].map(([x,y],i)=>({id:`fruit${i}`,x,y,kind:'forage' as const,index:i%2?4:0})),
    ...[[8,10],[14,15],[27,11]].map(([x,y],i)=>({id:`wood${i}`,x,y,kind:'wood' as const,index:0}))
  ],thorns:[],fishing:[]},
  quarry:{id:'quarry',name:'回声石谷',subtitle:'石壁记得雨声，也记得每一次回响',objects:[
    ...[[5,3],[11,4],[18,2],[25,4],[7,15],[17,15],[26,15]].map(([x,y],i)=>({id:`rock${i}`,kind:'rock' as const,x,y,w:3,h:2,solid:true})),
    {id:'relic',kind:'board',x:21,y:9,w:2,h:2,label:'古碑矿藏 · 三日',action:'event:quarryGift',solid:true}
  ],exits:[{id:'forest',x:1,y:10,label:'← 森林',to:'forest',spawn:[29,17]},{id:'ridge',x:30,y:10,label:'山脊 →',to:'ridge',spawn:[2,10]}],nodes:[
    ...[[5,7],[9,9],[12,7],[15,11],[18,7],[25,8],[27,12],[12,14]].map(([x,y],i)=>({id:`ore${i}`,x,y,kind:'stone' as const,index:0}))
  ],thorns:[[16,8],[16,9],[24,13]],fishing:[]},
  coast:{id:'coast',name:'潮声海湾',subtitle:'沿着沙滩，等一尾远海的来客',objects:[
    {id:'sea',kind:'water',x:13,y:3,w:18,h:15},tree('c1',3,4),tree('c2',8,3),
    {id:'coastseat',kind:'bench',x:4,y:13,w:3,h:1,solid:true},
    {id:'tidal',kind:'chest',x:9,y:7,w:1,h:1,label:'潮汐漂流箱',action:'event:coastGift',solid:true},
    {id:'lighthouse',kind:'lamp',x:10,y:15,w:1,h:1},
    {id:'pier',kind:'board',x:10,y:17,w:1,h:1,label:'旧栈道 · 修复',action:'repair:pier',solid:false}
  ],exits:[{id:'lake',x:6,y:1,label:'↑ 湖畔',to:'lake',spawn:[6,17]}],nodes:[
    {id:'driftwood',x:5,y:9,kind:'wood',index:0},{id:'pebbles',x:9,y:12,kind:'stone',index:0},{id:'herbs',x:3,y:16,kind:'forage',index:5},
    {id:'shell1',x:10,y:5,kind:'shell',index:0},{id:'shell2',x:9,y:10,kind:'shell',index:0},{id:'shell3',x:9,y:16,kind:'shell',index:0}
  ],thorns:[],fishing:[[12,6],[12,9],[12,12],[12,15]]},
  ridge:{id:'ridge',name:'云杉山脊',subtitle:'越过石谷，在云影与松风间歇脚',objects:[
    ...[[5,3],[11,2],[18,3],[25,4],[6,15],[22,15]].map(([x,y],i)=>tree(`pine${i}`,x,y)),
    {id:'alpine',kind:'water',x:18,y:9,w:8,h:4},
    {id:'outlook',kind:'board',x:11,y:7,w:2,h:2,label:'云端观景台',action:'event:ridgeView',solid:true},
    {id:'ore',kind:'rock',x:27,y:15,w:2,h:2,solid:true},
    {id:'shelter',kind:'bench',x:14,y:5,w:3,h:2,label:'山间休憩亭 · 修复',action:'repair:shelter',solid:false}
  ],exits:[{id:'quarry',x:1,y:10,label:'← 石谷',to:'quarry',spawn:[29,10]}],nodes:[
    {id:'nuts',x:8,y:6,kind:'forage',index:3},{id:'herb',x:14,y:13,kind:'forage',index:5},
    {id:'stone1',x:7,y:12,kind:'stone',index:0},{id:'stone2',x:28,y:9,kind:'stone',index:0},
    {id:'quartz1',x:27,y:7,kind:'ore',index:0},{id:'quartz2',x:15,y:15,kind:'ore',index:0}
  ],thorns:[[16,15],[17,15]],fishing:[[20,8],[23,8]]},
  cave:{id:'cave',name:'潮痕洞穴',subtitle:'沿着潮水留下的纹路',objects:[
    {id:'cavepool',kind:'water',x:13,y:12,w:10,h:4},
    {id:'caverock1',kind:'rock',x:13,y:4,w:3,h:3,solid:true,action:'caveDecoration'},
    {id:'caverock2',kind:'rock',x:25,y:12,w:3,h:3,solid:true,action:'caveDecoration'}
  ],exits:[],nodes:[],thorns:[],fishing:[]}
};
export const farmDimensions=(level:number)=>[[6,5],[9,8],[12,10]][level];
export function plotIndex(x:number,y:number){return x>=FARM.x&&x<FARM.x+12&&y>=FARM.y&&y<FARM.y+10?(y-FARM.y)*12+x-FARM.x:-1;}
export function isUnlockedPlot(state:GameStateV2,x:number,y:number){const [w,h]=farmDimensions(state.upgrades.farm);return x>=FARM.x&&y>=FARM.y&&x<FARM.x+w&&y<FARM.y+h;}
export const harvestable=(o:WorldObject)=>!o.action&&(o.kind==='tree'||o.kind==='rock');
export const objectKey=(scene:SceneId,o:WorldObject)=>`${scene}:${o.id}`;
export const treeStage=(state:GameStateV2,scene:SceneId,o:WorldObject)=>{
  const age=state.ecology.trees[objectKey(scene,o)]??ECOLOGY.matureTreeDay;
  return age<ECOLOGY.smallTreeDay?'sapling':age<ECOLOGY.matureTreeDay?'young':'mature';
};
export const objectDistance=(x:number,y:number,o:WorldObject)=>Math.max(o.x-x,0,x-(o.x+o.w-1))+Math.max(o.y-y,0,y-(o.y+o.h-1));
export function resourceAt(state:GameStateV2,x:number,y:number){return SCENES[state.player.scene].objects.find(o=>harvestable(o)&&(!state.clearedObjects.includes(objectKey(state.player.scene,o))||(o.kind==='tree'&&state.ecology.trees[objectKey(state.player.scene,o)]!==undefined))&&x>=o.x&&y>=o.y&&x<o.x+o.w&&y<o.y+o.h);}
export function passable(scene:SceneId,x:number,y:number,cleared:readonly string[]=[],trees:Record<string,number>={},machines:GameStateV2['facilities']['machines']=[]){
  if(x<1||y<1||x>=COLS-1||y>=ROWS-1)return false;
  if(scene==='home'&&(x<5||x>26||y<3||y>17))return false;
  if(scene==='farm'&&machines.some(m=>m.kind!=='sprinkler'&&m.x===x&&m.y===y))return false;
  return !SCENES[scene].objects.some(o=>!(harvestable(o)&&cleared.includes(objectKey(scene,o)))&&!(o.kind==='tree'&&(trees[objectKey(scene,o)]??6)<ECOLOGY.matureTreeDay)&&(o.solid||o.kind==='water')&&x>=o.x&&y>=o.y&&x<o.x+o.w&&y<o.y+o.h);
}
export function nearby(state:GameStateV2){
  const {scene,x,y}=state.player, map=SCENES[scene];
  const exit=map.exits.find(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<=1);
  if(exit)return {kind:'exit' as const,label:exit.label,id:exit.id};
  const candidates=map.objects.filter(o=>o.action).map(o=>({o,d:Math.max(o.x-x,0,x-(o.x+o.w-1))+Math.max(o.y-y,0,y-(o.y+o.h-1))})).filter(a=>a.d<=1).sort((a,b)=>a.d-b.d);
  if(candidates.length){const o=candidates[0].o;return {kind:'object' as const,label:o.action?.startsWith('repair:')&&state.fieldwork.repairs.includes(o.action.slice(7))?o.label!.replace(' · 修复',' · 已修复'):o.label!,id:o.action!};}
  return null;
}
