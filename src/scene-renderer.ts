import { CROPS,FORAGE,ITEMS } from './content';
import { availableForage,seasonOf,targetTile } from './engine';
import { drawPerson } from './art';
import { FARM,SCENES,TILE,COLS,ROWS,farmDimensions,isUnlockedPlot,type WorldObject } from './world';
import type { Appearance,GameStateV2,SceneId } from './types';
import type { FishingSession } from './fishing';
import { areaOpen } from './progression';
import { objectKey,treeStage } from './world';

type Particle={x:number;y:number;vx:number;vy:number;life:number;color:string};
export class SceneRenderer {
  private c:CanvasRenderingContext2D;
  private terrain=document.createElement('canvas');
  private cacheKey=''; private time=0; private px=0;private py=0;private lastScene='';private walk=0;private reduced=false;
  private particles:Particle[]=[];
  private labels=document.createElement('canvas');
  private labelContext:CanvasRenderingContext2D;
  actionAge=0;
  constructor(public canvas:HTMLCanvasElement){canvas.width=COLS*TILE;canvas.height=ROWS*TILE;this.c=canvas.getContext('2d')!;this.terrain.width=canvas.width;this.terrain.height=canvas.height;this.c.imageSmoothingEnabled=false;this.labels.className='map-labels';this.labels.setAttribute('aria-hidden','true');canvas.after(this.labels);this.labelContext=this.labels.getContext('2d')!;const mq=matchMedia('(prefers-reduced-motion: reduce)');this.reduced=mq.matches;mq.addEventListener('change',e=>this.reduced=e.matches);}
  burst(x:number,y:number,effect:string){this.actionAge=.35;const count=this.reduced?3:12;for(let i=0;i<count;i++)this.particles.push({x:(x+.5)*TILE,y:(y+.6)*TILE,vx:Math.cos(i*2.4)*25,vy:-25-i*2,life:.5+i*.018,color:effect==='water'?'#b6e4e2':effect==='soil'?'#c89a69':effect==='food'?'#a4d5a3':'#f4d38b'});}
  private rect(x:number,y:number,w:number,h:number,color:string){this.c.fillStyle=color;this.c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
  private background(state:GameStateV2){
    const scene=state.player.scene,season=seasonOf(state.calendar.day),key=`${scene}-${season}`;
    if(key===this.cacheKey)return;this.cacheKey=key;
    const original=this.c;this.c=this.terrain.getContext('2d')!;
    const colors={spring:['#80a46a','#93b979','#719658'],summer:['#829c5a','#96af68','#6e8d50'],autumn:['#9b9d63','#afb074','#8a8d54'],winter:['#d4ded5','#e4e8de','#bacbbf']}[season];
    const r=(x:number,y:number,w:number,h:number,color:string)=>this.rect(x,y,w,h,color);
    r(0,0,768,480,scene==='home'?'#334d46':colors[0]);
    if(scene==='home'){
      r(4*TILE,2*TILE,24*TILE,17*TILE,'#473f32');r(5*TILE,3*TILE,22*TILE,15*TILE,'#b29c72');
      for(let y=3;y<18;y++)for(let x=5;x<27;x++){r(x*TILE,y*TILE,23,23,(x+y)%3?'#b69b70':'#c0a77f');r(x*TILE+3,y*TILE+4,16,1,'#a58965')}
      r(4*TILE,2*TILE,24*TILE,2*TILE,'#ddc69c');r(4*TILE,4*TILE,24*TILE,5,'#6a664a');
      r(15*TILE,12*TILE,6*TILE,3*TILE,'#74877e');r(15*TILE+5,12*TILE+5,6*TILE-10,3*TILE-10,'#899c90');
      r(17*TILE,2*TILE+7,3*TILE,27,'#755f42');r(17*TILE+4,2*TILE+11,3*TILE-8,19,'#9ac5bf');
    } else {
      for(let y=0;y<480;y+=6)for(let x=0;x<768;x+=6){const v=(x*19+y*37+Math.floor(x*y/13))%83;if(v<16)r(x,y,2,v%3+1,colors[1]);else if(v>73)r(x,y,1,3,colors[2]);}
      const path=(x:number,y:number,w:number,h:number)=>{r(x*TILE,y*TILE,w*TILE,h*TILE,'#b29c6a');r(x*TILE+2,y*TILE+2,w*TILE-4,h*TILE-4,'#c9b783');for(let i=0;i<w*h*3;i++){const px=x*TILE+(i*37)%(w*TILE-4),py=y*TILE+(i*29)%(h*TILE-4);r(px+2,py+2,3,1,'#ac9669')}};
      if(scene==='farm'){path(1,6,30,2);path(4,7,2,12);path(9,7,3,12)}
      if(scene==='town'){path(1,9,30,3);path(7,7,2,9);path(16,7,2,10);path(25,7,2,10);r(9*TILE,12*TILE,8*TILE,5*TILE,'#b6ac8c');for(let y=12;y<17;y++)for(let x=9;x<17;x++)r(x*TILE+1,y*TILE+1,22,22,'#c8bea0')}
      if(scene==='forest'){path(3,1,3,17);path(5,8,22,2);path(13,9,3,9);path(27,5,4,2);path(26,16,5,2)}
      if(scene==='grove'){path(1,9,16,3);path(12,5,3,11)}
      if(scene==='quarry'){r(0,0,768,480,'#8a9388');for(let i=0;i<380;i++)r(i*137%768,i*71%480,5,2,i%2?'#a9b0a2':'#727f7a');path(1,9,28,3)}
      if(scene==='lake'){path(1,9,11,2);r(11*TILE,5*TILE,2*TILE,11*TILE,'#a48a61');for(let y=5*TILE;y<16*TILE;y+=8){r(11*TILE+2,y+1,2*TILE-4,6,'#c0a675');r(11*TILE+5,y+2,2,2,'#6f654a')}}
      if(scene==='coast'){r(0,0,768,480,season==='winter'?'#d9d8c4':'#d8c493');for(let i=0;i<240;i++)r(i*113%768,i*67%480,3,1,'#b5a376');path(5,1,3,17);r(11*TILE,4*TILE,2*TILE,13*TILE,'#b19468');for(let y=100;y<400;y+=8)r(11*TILE+2,y,44,2,'#e7cf99');}
      if(scene==='ridge'){r(0,0,768,480,'#8b9d93');for(let i=0;i<12;i++){r(i*70-20,4,60,35+i%3*12,'#bbc9c0');r(i*70,10,30,12,'#e0e4d5')}path(1,9,15,3);path(10,7,3,10);}
      // Flowers, stepping stones and border vegetation are deterministic local artwork.
      for(let i=0;i<55;i++){const x=(i*173+31)%758,y=(i*97+11)%472;if(i%3){r(x,y,2,5,'#5c7751');r(x-1,y-2,4,3,season==='winter'?'#f0f1e8':i%2?'#ddc280':'#d8d5b2')}}
      for(let x=0;x<32;x++){r(x*TILE,0,24,4,'#668064');r(x*TILE,476,24,4,'#667a59')}
    }
    this.c=original;
  }
  draw(state:GameStateV2,dt:number,fishing:FishingSession|null,preview?:Appearance){
    this.time+=dt;this.actionAge=Math.max(0,this.actionAge-dt);this.background(state);const c=this.c;
    const bounds=this.canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,lw=Math.round(bounds.width*dpr),lh=Math.round(bounds.height*dpr);
    if(this.labels.width!==lw||this.labels.height!==lh){this.labels.width=lw;this.labels.height=lh}
    this.labelContext.setTransform(1,0,0,1,0,0);this.labelContext.clearRect(0,0,lw,lh);this.labelContext.setTransform(lw/768,0,0,lh/480,0,0);
    c.clearRect(0,0,768,480);c.drawImage(this.terrain,0,0);
    const scene=SCENES[state.player.scene];
    for(const object of scene.objects)if(object.kind==='water')this.water(object);
    if(scene.id==='farm')this.plots(state);
    if(scene.id==='farm')for(const index of state.weeds){
      const x=(FARM.x+index%12)*TILE,y=(FARM.y+Math.floor(index/12))*TILE;
      const sway=this.reduced?0:Math.round(Math.sin(this.time*1.7+index)*1);
      this.rect(x+3,y+17,19,5,'#40563155');
      for(let blade=0;blade<5;blade++){
        const bx=x+4+blade*4,h=8+(index+blade*3)%9;
        this.rect(bx,y+20-h,2,h,blade%2?'#587740':'#6c8844');
        this.rect(bx-2+sway,y+19-h,4,4,blade%2?'#a8ad5d':'#879e50');
        this.rect(bx+2,y+13,3,2,'#b1b76b');
      }
    }
    for(const [x,y] of scene.thorns){this.rect(x*TILE+3,y*TILE+4,18,15,'#676c48');for(let i=0;i<3;i++){this.rect(x*TILE+i*6+3,y*TILE+1,2,21,'#ad6d56');this.rect(x*TILE+i*6,y*TILE+7,7,2,'#ad6d56')}}
    for(const node of availableForage(state)){
      if(state.gathered.includes(`${scene.id}:${node.id}`))continue;
      const x=node.x*TILE,y=node.y*TILE;
      if(node.kind==='wood'){this.rect(x+3,y+12,18,8,'#805d3f');this.rect(x+3,y+12,5,8,'#b39361');this.rect(x+10,y+13,10,2,'#a07c4d')}
      else if(node.kind==='stone'){this.rect(x+5,y+8,15,12,'#7d8c86');this.rect(x+8,y+5,10,7,'#a7b3a3');this.rect(x+6,y+10,4,6,'#c2caba')}
      else {const color=FORAGE[node.index].color;this.rect(x+6,y+12,13,8,'#557954');this.rect(x+3,y+9,7,8,'#769456');this.rect(x+8,y+8,5,5,color);this.rect(x+14,y+12,5,5,color);this.rect(x+10,y+5,2,3,'#dfd39a');}
    }
    for(const exit of scene.exits){const x=exit.x*TILE,y=exit.y*TILE;this.rect(x+2,y+5,20,14,'#5a6650');this.rect(x+4,y+6,16,10,'#d4c18d');this.label((areaOpen(state,exit.to)?'':'◇ ')+exit.label,x+12,y-4,'#fff0c6');}
    for(const [x,y] of scene.fishing){c.strokeStyle='#ddce9855';c.strokeRect(x*TILE+4,y*TILE+5,16,14);this.rect(x*TILE+10,y*TILE+9,3,5,'#f0dfaf')}
    if(this.lastScene!==scene.id){this.lastScene=scene.id;this.px=state.player.x;this.py=state.player.y;this.particles=[]}
    const moving=Math.abs(this.px-state.player.x)+Math.abs(this.py-state.player.y)>.015;
    const factor=dt>0?Math.min(1,dt*20):0;this.px+=(state.player.x-this.px)*factor;this.py+=(state.player.y-this.py)*factor;
    if(moving)this.walk+=dt*22;else this.walk=0;
    const objects=scene.objects.filter(o=>o.kind!=='water'&&(!state.clearedObjects.includes(objectKey(scene.id,o))||(o.kind==='tree'&&state.ecology.trees[objectKey(scene.id,o)]!==undefined))).map(o=>({y:o.y+o.h,draw:()=>this.object(o,state)}));
    objects.push({y:this.py+1,draw:()=>drawPerson(c,this.px*TILE+12,this.py*TILE+21,preview??state.player.appearance,state.player.direction,this.walk,1,this.reduced?0:Math.sin(this.actionAge*35)*this.actionAge*8)});
    objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
    const target=targetTile(state);if(target.x>=0&&target.y>=0&&target.x<32&&target.y<20){c.strokeStyle=`rgba(247,229,173,${this.reduced?0.8:0.55+Math.sin(this.time*4)*0.3})`;c.lineWidth=1;const tx=target.x*TILE,ty=target.y*TILE;for(const [x,y,dx,dy] of [[tx+2,ty+7,0,-5],[tx+2,ty+2,5,0],[tx+22,ty+17,0,5],[tx+22,ty+22,-5,0]]){c.beginPath();c.moveTo(x,y);c.lineTo(x+dx,y+dy);c.stroke();}}
    if(fishing){
      const x=this.px*TILE+12,y=this.py*TILE+8,bx=fishing.anchor.x*TILE,by=fishing.anchor.y*TILE+(this.reduced?0:Math.sin(this.time*3)*1.5),bite=fishing.stage==='bite';
      const direction=bx>x?1:-1;c.strokeStyle='#ecd5a2';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x+direction*12,y-24);c.stroke();c.lineWidth=1;c.strokeStyle='#fff1c5b0';c.beginPath();c.moveTo(x+direction*12,y-24);c.quadraticCurveTo((x+bx)/2,by-15,bx,by);c.stroke();
      c.strokeStyle=bite?'#fff0ae':'#d7ece088';c.beginPath();c.ellipse(bx,by+4,bite?10+(this.reduced?0:Math.sin(this.time*10)*3):7,3,0,0,Math.PI*2);c.stroke();
      this.rect(bx-3,by-5,6,5,'#fff0c5');this.rect(bx-3,by,6,5,bite?'#f26b42':'#cc6953');this.rect(bx-1,by-10,2,5,'#f8e4a5');
      if(bite){this.rect(bx-2,by-34,4,12,'#ffdb62');this.rect(bx-2,by-19,4,4,'#ffdb62');this.label('咬钩！空格提竿',bx,by-42,'#ffdf75');}
    }
    for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=110*dt;c.globalAlpha=Math.min(1,p.life*3);this.rect(p.x,p.y,2,3,p.color)}c.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
    this.light(state);
    if(state.player.scene!=='home'&&state.calendar.weather!=='sun')this.weather(state.calendar.weather);
    if(['forest','grove'].includes(scene.id)){
      for(let i=0;i<(scene.id==='grove'?32:10);i++){const x=(i*137+Math.sin(this.time*.7+i)*14+35)%740,y=(i*73+Math.cos(this.time*.4+i)*12+60)%455;this.rect(x,y,2,2,`rgba(255,237,143,${.35+Math.sin(this.time*2+i)*.25})`)}
      for(const o of scene.objects.filter(o=>o.action?.startsWith('event:')&&!state.progression.forestEvents.includes(o.action.slice(6))))this.rect((o.x+.5)*TILE,o.y*TILE-11,3,3,'#ffdf7f');
    }
  }
  private label(text:string,x:number,y:number,color='#fff3d7',background=true){const c=this.labelContext,scale=this.canvas.clientWidth/768,size=Math.max(11,13/scale);c.font=`600 ${size}px "Microsoft YaHei", sans-serif`;c.textAlign='center';const w=c.measureText(text).width;x=Math.max(w/2+6,Math.min(762-w/2,x));y=Math.max(size+4,y);if(background){c.fillStyle='#203e32ed';c.fillRect(x-w/2-5,y-size-2,w+10,size+7)}c.fillStyle=color;c.fillText(text,x,y);}
  private water(o:WorldObject){const x=o.x*TILE,y=o.y*TILE,w=o.w*TILE,h=o.h*TILE;this.rect(x-3,y-3,w+6,h+6,'#7c9272');this.rect(x,y,w,h,'#497f86');this.rect(x+3,y+3,w-6,h-6,'#619c9e');this.rect(x+8,y+8,w-16,h-16,'#73aeb0');const shimmer=this.reduced?0:Math.floor(this.time*4);for(let i=0;i<o.w*o.h/2;i++){const px=x+10+(i*57+shimmer)%(w-30),py=y+11+(i*43)%(h-20);this.rect(px,py,9+i%9,1,'#b6d1bd88')}
    for(let i=0;i<o.w;i+=2){this.rect(x+i*TILE,y-5,2,9,'#6a8457');this.rect(x+i*TILE+4,y-8,2,11,'#93a267');}
  }
  private object(o:WorldObject,state:GameStateV2){const x=o.x*TILE,y=o.y*TILE,w=o.w*TILE,h=o.h*TILE,r=(a:number,b:number,d:number,e:number,f:string)=>this.rect(a,b,d,e,f);
    if(o.id==='fox'){r(x+3,y+10,19,10,'#c78145');r(x+13,y+4,10,10,'#db9b58');r(x+14,y+1,3,7,'#a96937');r(x+20,y+1,3,7,'#a96937');r(x+17,y+9,7,5,'#f6dfae');r(x+19,y+7,2,2,'#263e33');r(x-3,y+13,10,5,'#eac792');if(o.label)this.label(o.label,x+w/2,y-7);return;}
    if(o.kind==='rock'){r(x+2,y+8,w-4,h-9,'#576d70');r(x+7,y+2,w-14,h-8,'#91a3a0');r(x+10,y+5,Math.max(4,w/3),5,'#bdccc0');r(x+w-10,y+h-10,5,4,'#d6c798');}
    if(o.kind==='tree'){
      const stage=treeStage(state,state.player.scene,o);
      if(stage!=='mature'){
        const cx=x+w/2,base=y+h-5,young=stage==='young';r(cx-9,base,18,4,'#354b3640');r(cx-2,base-(young?27:13),4,young?27:13,'#876540');
        if(young){r(cx-14,base-35,28,17,'#547b52');r(cx-10,base-44,20,18,'#87a368');r(cx-7,base-40,9,6,'#b3bc7b');}else{r(cx-9,base-15,9,5,'#79a164');r(cx+1,base-21,9,6,'#acc17b');}
        return;
      }
      const season=seasonOf(state.calendar.day);const colors={spring:['#587b52','#779657','#92ad6c'],summer:['#456f4f','#648b56','#87a35e'],autumn:['#87754a','#ae9958','#c4ae70'],winter:['#738c82','#9eb4a3','#c5d2c4']}[season];
      r(x+2,y+h-7,w,10,'#394f3640');r(x+18,y+8,11,h-9,'#70573e');r(x+20,y+8,3,h-12,'#a58553');
      r(x-4,y-16,55,34,colors[0]);r(x+4,y-30,39,42,colors[1]);r(x+12,y-36,24,34,colors[1]);r(x-9,y-6,64,23,colors[0]);r(x+4,y-22,17,9,colors[2]);r(x+26,y-9,20,8,colors[2]);r(x-3,y+3,10,6,colors[1]);
      for(let i=0;i<9;i++)r(x+(i*13)%43,y-25+(i*19)%37,5,2,'#ead79325');return;
    }
    if(o.kind==='house'||o.kind==='shop'){
      r(x+4,y+h,w+5,6,'#3c473742');r(x,y+15,w,h-15,'#665b44');r(x+4,y+18,w-8,h-21,'#d7c092');
      for(let py=y+25;py<y+h-6;py+=10)r(x+4,py,w-8,1,'#ac91654f');
      if(o.kind==='house'){
        for(let row=0;row<8;row++)r(x-8+row*7,y+18-row*5,w+16-row*14,5,row%2?'#9f6b52':'#ad7b58');
        r(x+w-25,y-15,11,23,'#8e866f');r(x+w-27,y-17,15,4,'#b3a48a');
        if(!this.reduced)for(let i=0;i<3;i++){const sy=y-27-((this.time*7+i*13)%36);r(x+w-24+i*2,sy,7+i*2,5,'#e4dfc440')}
      }else{
        r(x-5,y+4,w+10,17,'#68907e');for(let i=0;i<w+10;i+=16)r(x-5+i,y+4,8,17,'#dac39a');r(x-5,y+20,w+10,3,'#405e50');
      }
      const doorX=x+Math.floor(w/2)-10;r(doorX,y+h-34,20,34,'#68523c');r(doorX+3,y+h-29,14,24,'#85664b');r(doorX+15,y+h-17,2,3,'#dfc88d');
      for(const wx of [x+12,x+w-34]){r(wx,y+29,23,24,'#8a7755');r(wx+3,y+32,17,18,'#8eafac');r(wx+10,y+32,2,18,'#e2d5b0');r(wx+3,y+40,17,2,'#e2d5b0');r(wx-2,y+54,28,3,'#8a7755');}
      if(o.label)this.label(o.label,x+w/2,y+2);return;
    }
    if(o.kind==='shipping'||o.kind==='chest'){r(x+1,y+7,w-2,h-7,'#69553e');r(x+3,y+9,w-6,h-12,'#b19360');r(x,y+4,w,7,'#c6ad79');r(x+4,y+13,w-8,2,'#866a46');r(x+w/2-2,y+10,4,7,'#e0ce9a');if(o.kind==='shipping')r(x+5,y+12,w-10,3,'#5c4c37');}
    if(o.kind==='bed'){r(x+3,y+3,w-6,h-6,'#715c42');r(x+7,y+7,w-14,h-15,'#ece1bf');r(x+8,y+25,w-16,h-33,'#7b9d94');r(x+9,y+9,w-18,12,'#f5ebd4');r(x+10,y+31,w-20,3,'#bdc6a6');}
    if(o.kind==='wardrobe'){r(x+3,y,w-6,h,'#6e634a');r(x+6,y+4,w-12,h-8,'#ae9767');r(x+w/2,y+5,2,h-9,'#6e634a');r(x+w/2-6,y+h/2,3,5,'#e9d290');r(x+w/2+6,y+h/2,3,5,'#e9d290')}
    if(o.kind==='kitchen'){r(x,y+14,w,h-14,'#a08c67');r(x-2,y+12,w+4,8,'#e0d6b8');for(let i=0;i<3;i++)r(x+5+i*30,y+27,23,h-35,'#c0ac80');r(x+5,y+2,27,11,'#606b62');r(x+8,y+1,21,3,'#d1cbb1');r(x+50,y+4,23,8,'#6f8b85');r(x+55,y-4,4,13,'#adbab0')}
    if(o.kind==='board'){r(x+2,y+2,w-4,h-8,'#725d3f');r(x+5,y+5,w-10,h-15,'#b19769');for(let i=0;i<3;i++){r(x+8+i*10,y+9+i%2*8,8,17,'#eadbb4');r(x+10+i*10,y+12+i%2*8,4,1,'#a29472')}r(x+5,y+h-9,4,12,'#725d3f');r(x+w-9,y+h-9,4,12,'#725d3f')}
    if(o.id==='table'&&state.player.scene==='home'){
      // All furniture pieces stay inside their declared footprint, so nothing is clipped.
      r(x+2,y+3,w-4,h-7,'#4a6560');r(x+5,y+5,w-10,17,'#83a59a');r(x+8,y+23,w-16,h-30,'#a5bdb0');
      r(x+3,y+16,7,h-20,'#698d81');r(x+w-10,y+16,7,h-20,'#698d81');r(x+w/2,y+6,2,h-16,'#62887a');r(x+12,y+10,12,12,'#e4c895');r(x+w-25,y+12,12,10,'#c79078');r(x+7,y+h-6,4,6,'#705639');r(x+w-11,y+h-6,4,6,'#705639');
    }else if(o.kind==='bench'){r(x+2,y+3,w-4,Math.max(7,h-11),'#ad9468');r(x+4,y+h-8,4,8,'#796649');r(x+w-8,y+h-8,4,8,'#796649');}
    if(o.kind==='lamp'){r(x+11,y-12,3,36,'#606b56');r(x+6,y-16,13,12,'#c8b97d');r(x+8,y-13,9,7,'#f2df9a');r(x+5,y-18,15,3,'#63715b');}
    if(o.label)this.label(o.label,x+w/2,y-4);
  }
  private plots(state:GameStateV2){const [w,h]=farmDimensions(state.upgrades.farm);const r=(a:number,b:number,d:number,e:number,f:string)=>this.rect(a,b,d,e,f);
    r(FARM.x*TILE-4,FARM.y*TILE-4,w*TILE+8,h*TILE+8,'#a38e63');
    for(let y=0;y<10;y++)for(let x=0;x<12;x++){
      const px=(FARM.x+x)*TILE,py=(FARM.y+y)*TILE,plot=state.plots[y*12+x];
      if(!isUnlockedPlot(state,FARM.x+x,FARM.y+y)){if((x+y)%5===0){r(px+8,py+12,3,7,'#949264');r(px+12,py+9,2,9,'#888655')}continue}
      r(px,py,23,23,plot.tilled?(plot.crop?.watered?'#776a4c':'#9b7953'):'#aea072');
      for(let i=0;i<3;i++)r(px+3,py+5+i*6,17,1,plot.tilled?(plot.crop?.watered?'#9e8b60':'#b69768'):'#c0af7d');
      if(plot.crop){const def=CROPS.find(c=>c.id===plot.crop!.id)!,g=plot.crop.growth,ready=g>=def.days,dormant=!def.seasons.includes(seasonOf(state.calendar.day));
        r(px+10,py+11,3,8,dormant?'#958d67':'#557d49');r(px+5,py+9,7,4,dormant?'#ab9c72':'#7fa45c');r(px+13,py+6,7,5,dormant?'#ab9c72':'#81aa63');
        if(g>0)r(px+7,py+14,10,5,ready?def.color:'#83a267');if(ready){r(px+8,py+16,9,5,def.color);const glow=this.reduced?0.33:0.33+Math.sin(this.time*3+(x+y)*0.7)*0.2;r(px+10,py+12,4,3,`rgba(255,255,255,${glow})`)}
        if(plot.crop.watered)r(px+3,py+18,3,2,'#8cbdba');if(dormant){r(px+17,py+2,3,3,'#d4d5c6')}
      }
    }
    this.label('耕作区',FARM.x*TILE+w*TILE/2,FARM.y*TILE-9,'#e5d6aa');
    // A low fence marks the current expansion boundary without blocking the field entrance.
    for(let x=FARM.x;x<FARM.x+w;x++){r(x*TILE,FARM.y*TILE-22,22,3,'#a59369');r(x*TILE+2,FARM.y*TILE-27,3,17,'#907b55')}
  }
  private light(state:GameStateV2){const minute=state.calendar.minute,indoor=state.player.scene==='home';
    const darkness=minute<480?(480-minute)/120*.15:minute<1020?0:Math.min(.48,(minute-1020)/240*.48);
    if(darkness){this.c.fillStyle=`rgba(20,35,60,${indoor?darkness*.5:darkness})`;this.c.fillRect(0,0,768,480)}
    if(darkness>.08||indoor){for(const o of SCENES[state.player.scene].objects.filter(o=>['lamp','house','shop','kitchen'].includes(o.kind))){const x=(o.x+o.w/2)*TILE,y=(o.y+o.h*.7)*TILE;const glow=this.c.createRadialGradient(x,y,2,x,y,55);glow.addColorStop(0,'#f4d78a35');glow.addColorStop(1,'#f4d78a00');this.c.fillStyle=glow;this.c.fillRect(x-55,y-55,110,110)}
      const px=this.px*TILE+12,py=this.py*TILE+12,g=this.c.createRadialGradient(px,py,3,px,py,65);g.addColorStop(0,'#f1de9a26');g.addColorStop(1,'#f1de9a00');this.c.fillStyle=g;this.c.fillRect(px-65,py-65,130,130);}
  }
  private weather(weather:'rain'|'snow'){if(this.reduced){this.c.fillStyle=weather==='rain'?'#b9d4ca12':'#eef1e912';this.c.fillRect(0,0,768,480);return}for(let i=0;i<75;i++){const x=(i*131+this.time*(weather==='rain'?-25:5)+10000)%768,y=(i*67+this.time*(weather==='rain'?210:23))%480;this.rect(x,y,weather==='rain'?1:2,weather==='rain'?7:2,weather==='rain'?'#b9d4ca65':'#eef1e9bb')}}
}
