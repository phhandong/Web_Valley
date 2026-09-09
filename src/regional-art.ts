import type { GameStateV2 } from './types';
export function regionalArt(c:CanvasRenderingContext2D,s:GameStateV2,time:number,reduced:boolean){
  const scene=s.player.scene,t=reduced?0:time,r=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
  if(scene==='coast'){
    for(let i=0;i<7;i++){const y=92+i*46;for(let j=0;j<4;j++)r(316+j*11+Math.sin(t*1.3+i)*3,y+j*2,4,29,'#d9ebca55');}
    for(let i=0;i<9;i++){const x=334+i*43,y=156+(i*67)%230;r(x,y,3,7,'#699c83');r(x+3,y-3,2,8,'#76aa8b');}
    const fixed=s.fieldwork.repairs.includes('pier');
    r(265,432,155,25,'#655740');
    for(let i=0;i<19;i++){if(!fixed&&i>3&&i%3!==0)continue;r(267+i*8,432+(fixed?0:i%2*3),6,21,fixed?'#c8ad7c':'#978264');}
    if(fixed){r(270,427,150,3,'#e1c798');for(let x=275;x<420;x+=36)r(x,425,3,31,'#816443');}
  }
  if(scene==='ridge'){
    // The cascade stays inside the existing lake footprint; no invisible new barrier.
    r(570,216,43,43,'#657f82');r(580,216,23,62,'#b1d4d1');r(586,216,11,63,'#e0e9d5');
    for(let i=0;i<7;i++)r(581+i%3*6,217+(t*31+i*17)%57,3,10,'#f0f2df');
    for(let i=0;i<8;i++)r(566+i*7,274+Math.sin(t+i)*4,10,3,'#e5eee677');
    for(let i=0;i<15;i++)r(80+i*43+Math.sin(t+i)*9,70+(i*37+t*9)%325,3,1,'#d2c88988');
    const fixed=s.fieldwork.repairs.includes('shelter');
    for(const x of [337,402])r(x,101,4,61,'#78674d');
    if(fixed){for(let i=0;i<5;i++)r(333+i*4,94-i*4,77-i*8,5,i%2?'#8a9d87':'#6d897b');r(344,142,56,7,'#d3bc8e');}
    else {r(333,98,30,5,'#9c906e');r(380,94,28,5,'#9c906e');}
  }
  if(scene==='coast'||scene==='ridge')for(let i=0;i<3;i++){
    const x=130+(t*12+i*173)%540,y=52+i*37+Math.sin(t*.8+i)*9,wing=Math.sin(t*7+i)>0?-3:1;
    r(x,y,5,2,scene==='coast'?'#f7ebc9':'#414f53');r(x-5,y+wing,5,2,'#e2dec7');r(x+5,y+wing,5,2,'#e2dec7');
  }
}
