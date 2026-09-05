import type { SceneId, GameStateV2 } from './types';
export const TILE=24, COLS=32, ROWS=20;
export const FARM={x:12,y:8,cols:12,rows:10};
export type ObjectKind='house'|'tree'|'rock'|'water'|'shop'|'bed'|'wardrobe'|'kitchen'|'chest'|'shipping'|'board'|'lamp'|'bench';
export interface WorldObject {id:string;kind:ObjectKind;x:number;y:number;w:number;h:number;label?:string;action?:string;solid?:boolean}
export interface Exit {id:string;x:number;y:number;label:string;to:SceneId;spawn:[number,number]}
export interface Node {id:string;x:number;y:number;kind:'forage'|'wood'|'stone';index:number}
export interface SceneDefinition {id:SceneId;name:string;subtitle:string;objects:WorldObject[];exits:Exit[];nodes:Node[];thorns:[number,number][];fishing:[number,number][]}
const tree=(id:string,x:number,y:number):WorldObject=>({id,kind:'tree',x,y,w:2,h:2,solid:true});
export const SCENES:Record<SceneId,SceneDefinition>={
  farm:{id:'farm',name:'溪谷农场',subtitle:'把日子种进泥土里',objects:[
    {id:'farmhouse',kind:'house',x:3,y:2,w:5,h:4,label:'橡果小屋',solid:true},
    {id:'shipping',kind:'shipping',x:9,y:5,w:1,h:1,label:'出货箱',action:'shipping',solid:true},
    {id:'farmchest',kind:'chest',x:3,y:7,w:1,h:1,label:'储物箱',action:'chest',solid:true},
    {id:'pond',kind:'water',x:3,y:11,w:6,h:4},
    tree('f1',1,2),tree('f2',10,2),tree('f3',15,2),tree('f4',20,2),tree('f5',25,3),tree('f6',27,14),tree('f7',8,17),
    {id:'lamp',kind:'lamp',x:9,y:7,w:1,h:1}
  ],exits:[{id:'home',x:5,y:6,label:'进入小屋',to:'home',spawn:[16,16]},{id:'town',x:30,y:7,label:'小镇 →',to:'town',spawn:[2,10]},{id:'forest',x:4,y:18,label:'森林 ↓',to:'forest',spawn:[4,2]}],nodes:[0,1,2,3,4,5].map(i=>({id:`food${i}`,x:2+i,y:9,kind:'forage',index:0})),thorns:[],fishing:[[5,10],[6,10]]},
  home:{id:'home',name:'橡果小屋',subtitle:'灯亮着，家就在这里',objects:[
    {id:'bed',kind:'bed',x:7,y:5,w:3,h:3,label:'休息',action:'sleep',solid:true},
    {id:'wardrobe',kind:'wardrobe',x:12,y:4,w:2,h:3,label:'衣柜',action:'wardrobe',solid:true},
    {id:'kitchen',kind:'kitchen',x:21,y:4,w:4,h:3,label:'厨房',action:'kitchen',solid:true},
    {id:'homechest',kind:'chest',x:7,y:12,w:2,h:1,label:'储物箱',action:'chest',solid:true},
    {id:'table',kind:'bench',x:17,y:10,w:3,h:2,solid:true},
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
    {id:'pool',kind:'water',x:19,y:8,w:5,h:4}
  ],exits:[{id:'farm',x:4,y:1,label:'↑ 农场',to:'farm',spawn:[4,17]}],nodes:[
    ...[[5,6],[9,8],[13,5],[17,7],[25,7],[27,13],[6,16],[16,17]].map(([x,y],i)=>({id:`forage${i}`,x,y,kind:'forage' as const,index:i%6})),
    ...[[11,10],[7,11],[26,17],[15,10]].map(([x,y],i)=>({id:`wood${i}`,x,y,kind:'wood' as const,index:0})),
    ...[[3,16],[16,13],[26,10],[11,17]].map(([x,y],i)=>({id:`stone${i}`,x,y,kind:'stone' as const,index:0}))
  ],thorns:[[17,10],[17,11],[18,11],[25,13]],fishing:[]},
  lake:{id:'lake',name:'微光湖畔',subtitle:'把心事交给湖面，把耐心交给鱼',objects:[
    {id:'lakewater',kind:'water',x:13,y:3,w:17,h:15},
    tree('l1',3,3),tree('l2',7,2),tree('l3',4,15),tree('l4',9,16),
    {id:'seat',kind:'bench',x:6,y:12,w:2,h:1,solid:true},{id:'llamp',kind:'lamp',x:10,y:10,w:1,h:1}
  ],exits:[{id:'town',x:1,y:10,label:'← 小镇',to:'town',spawn:[29,10]}],nodes:[],thorns:[],fishing:[[12,6],[12,8],[12,10],[12,12],[12,14]]}
};
export const farmDimensions=(level:number)=>[[6,5],[9,8],[12,10]][level];
export function plotIndex(x:number,y:number){return x>=FARM.x&&x<FARM.x+12&&y>=FARM.y&&y<FARM.y+10?(y-FARM.y)*12+x-FARM.x:-1;}
export function isUnlockedPlot(state:GameStateV2,x:number,y:number){const [w,h]=farmDimensions(state.upgrades.farm);return x>=FARM.x&&y>=FARM.y&&x<FARM.x+w&&y<FARM.y+h;}
export function passable(scene:SceneId,x:number,y:number){
  if(x<1||y<1||x>=COLS-1||y>=ROWS-1)return false;
  if(scene==='home'&&(x<5||x>26||y<3||y>17))return false;
  return !SCENES[scene].objects.some(o=>(o.solid||o.kind==='water')&&x>=o.x&&y>=o.y&&x<o.x+o.w&&y<o.y+o.h);
}
export function nearby(state:GameStateV2){
  const {scene,x,y}=state.player, map=SCENES[scene];
  const exit=map.exits.find(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<=1);
  if(exit)return {kind:'exit' as const,label:exit.label,id:exit.id};
  const candidates=map.objects.filter(o=>o.action).map(o=>({o,d:Math.max(o.x-x,0,x-(o.x+o.w-1))+Math.max(o.y-y,0,y-(o.y+o.h-1))})).filter(a=>a.d<=1).sort((a,b)=>a.d-b.d);
  if(candidates.length)return {kind:'object' as const,label:candidates[0].o.label!,id:candidates[0].o.action!};
  return null;
}
