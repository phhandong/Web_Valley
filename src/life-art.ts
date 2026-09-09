import { drawPerson } from './art';
import { PEOPLE } from './life-content';
import { dynamicNodes } from './interactions';
import type { GameStateV2, MachineKind, VillagerId } from './types';

export interface PlacementDraft {kind:MachineKind;x:number;y:number;movingId?:number;error:string}
export function drawMachine(c:CanvasRenderingContext2D,kind:MachineKind,x:number,y:number,ready=false){
  c.save();c.translate(x*24,y*24);const r=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  r(2,19,21,4,'#263d3540');
  if(kind==='sprinkler'){r(10,8,5,13,'#769e9e');r(3,7,19,4,'#b9d2c8');r(4,5,3,4,'#66838d');r(18,5,3,4,'#66838d');r(8,19,9,3,'#516b69');r(11,6,3,3,'#e4ecce');}
  if(kind==='preserver'){r(4,6,16,15,'#b07754');r(3,3,18,5,'#6e6e51');r(6,9,12,9,'#b96561');r(8,10,4,6,'#e5ad88');r(5,21,3,3,'#65563f');r(17,21,3,3,'#65563f');}
  if(kind==='dryer'){r(3,3,3,21,'#715a3c');r(18,3,3,21,'#715a3c');r(2,4,20,3,'#c6a16b');r(2,12,20,3,'#c6a16b');for(let i=0;i<3;i++){r(7+i*4,7,2,6,'#c1af87');r(7+i*4,16,2,4,'#b88b61');}}
  if(kind==='hive'){r(3,7,18,15,'#a3763f');r(1,5,22,3,'#755a35');r(6,2,13,4,'#d5b36b');r(5,9,14,3,'#dfbc76');r(5,15,14,3,'#dfbc76');r(10,19,5,3,'#53472f');}
  if(ready){r(17,-3,7,7,'#fbe292');r(19,-1,3,3,'#71995b');}c.restore();
}
export function lifeDrawables(c:CanvasRenderingContext2D,s:GameStateV2,label:(text:string,x:number,y:number)=>void){
  const objects:{y:number;draw:()=>void}[]=[];
  for(const n of dynamicNodes(s).filter(n=>n.scene===s.player.scene))objects.push({y:n.y+1,draw:()=>{
    if(n.kind==='villager'){const id=n.id.slice(4) as VillagerId;drawPerson(c,n.x*24+12,n.y*24+21,PEOPLE[id].appearance,'down');label(PEOPLE[id].name,n.x*24+12,n.y*24-11);return;}
    if(n.kind==='machine'){const m=s.facilities.machines.find(m=>m.id===Number(n.id.slice(8)))!;drawMachine(c,m.kind,m.x,m.y,!!m.output);return;}
    c.fillStyle=n.kind==='reward'?'#c99457':n.kind==='entrance'?'#46534e':'#f0d689';
    if(n.kind==='entrance'){c.fillRect(n.x*24+2,n.y*24,20,24);c.fillStyle='#d5c19b';c.fillRect(n.x*24+1,n.y*24,22,4);}
    else if(n.kind==='reward'){c.fillRect(n.x*24+4,n.y*24+10,16,11);c.fillStyle='#f3d89a';c.fillRect(n.x*24+10,n.y*24+12,4,5);}
    else {c.fillRect(n.x*24+9,n.y*24+5,6,8);c.fillRect(n.x*24+10,n.y*24+16,4,3);}
    label(n.label,n.x*24+12,n.y*24-4);
  }});
  if(s.social.people.ahe.stage===3&&s.player.scene==='town')objects.push({y:9,draw:()=>{c.fillStyle='#a17c50';c.fillRect(10*24,8*24+5,36,10);c.fillRect(10*24+3,8*24+15,4,10);c.fillRect(10*24+29,8*24+15,4,10);c.fillStyle='#94ac65';c.fillRect(10*24+8,8*24,20,7);label('阿禾的分享摊',10*24+18,8*24-6);}});
  if(s.social.people.zhou.stage===3&&s.player.scene==='lake')objects.push({y:14,draw:()=>{c.fillStyle='#b99762';c.fillRect(7*24,13*24+9,18,13);c.strokeStyle='#705a3c';c.strokeRect(7*24+3,13*24+11,12,9);label('旧鱼篓',7*24+9,13*24-2);}});
  if(s.social.people.shi.stage===3&&s.player.scene==='town')objects.push({y:10,draw:()=>{drawMachine(c,'sprinkler',29,9);label('石叔的试制模型',29*24,9*24-7);}});
  return objects;
}
export function drawPlacement(c:CanvasRenderingContext2D,draft:PlacementDraft){
  c.save();c.strokeStyle='#ffedb03f';c.lineWidth=1;for(let x=1;x<32;x++){c.beginPath();c.moveTo(x*24,24);c.lineTo(x*24,456);c.stroke();}for(let y=1;y<20;y++){c.beginPath();c.moveTo(24,y*24);c.lineTo(744,y*24);c.stroke();}
  c.fillStyle=draft.kind==='hive'?'#f2cc6445':'#85d0da55';
  if(draft.kind==='hive')c.fillRect((draft.x-2)*24,(draft.y-2)*24,120,120);
  if(draft.kind==='sprinkler')for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])c.fillRect((draft.x+dx)*24,(draft.y+dy)*24,24,24);
  c.fillStyle=draft.error?'#c8575b88':'#a7d69188';c.fillRect(draft.x*24,draft.y*24,24,24);c.globalAlpha=.8;drawMachine(c,draft.kind,draft.x,draft.y);c.restore();
}
