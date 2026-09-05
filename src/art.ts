import { HAIR_COLORS,OUTFIT_COLORS,SKINS } from './content';
import type { Appearance,Direction } from './types';
export function drawPerson(c:CanvasRenderingContext2D,x:number,y:number,a:Appearance,direction:Direction,walk=0,scale=1,action=0){
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
  const r=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
  const stride=Math.round(Math.sin(walk)*2),hair=HAIR_COLORS[a.hair],shirt=OUTFIT_COLORS[a.outfit];
  r(-7,0,14,3,'#263c3650');r(-5,-5+stride,4,6,'#354348');r(2,-5-stride,4,6,'#354348');r(-6,0+stride,5,2,'#302e29');r(2,0-stride,5,2,'#302e29');
  r(-6,-13,13,10,shirt);r(-6,-13,3,7,'#ffffff25');r(-4,-10,2,6,'#d7c8a5');r(3,-10,2,6,'#d7c8a5');
  r(-8,-12+Math.round(action),3,7,SKINS[a.skin]);r(7,-12-Math.round(action),3,7,SKINS[a.skin]);
  if(a.hair===2||a.hair===4)r(-7,-22,15,14,hair);
  r(-6,-23,13,11,SKINS[a.skin]);r(-7,-25,15,7,hair);r(-7,-21,3,8,hair);r(5,-21,3,6,hair);
  if(a.hair===1){r(-8,-24,3,4,hair);r(6,-24,3,4,hair)}
  if(a.hair===5){r(7,-18,3,13,hair);r(6,-8,5,2,'#d6b469')}
  if(direction!=='up'){const ex=direction==='left'?-5:direction==='right'?3:-3;r(ex,-17,2,2,'#343633');if(direction==='down')r(3,-17,2,2,'#343633');r(-1,-13,3,1,'#ad695a')}
  else r(-6,-22,13,10,hair);
  if(a.hat>=0){const colors=['#d1ae68','#8ba5a0','#bd7665','#6f8490','#709468','#7783af'];const color=colors[a.hat];
    r(-8,-26,17,5,color);r(-5,-31,11,6,color);r(-8,-24,17,2,'#6f5b3b');
    if(a.hat===0)r(-11,-25,23,3,color);
    if(a.hat===2)r(-2,-34,5,4,'#e7d5b0');
    if(a.hat===4){r(-6,-28,4,4,'#e8b991');r(4,-28,4,4,'#e9d47e')}
    if(a.hat===5){r(-1,-29,3,6,'#f5db83');r(-3,-27,7,2,'#f5db83')}
  }
  c.restore();
}
export function iconSVG(kind:string,color='#d8b877'){
  const shapes:Record<string,string>={
    hoe:'<path d="M7 26 21 7" stroke="#b79665" stroke-width="4"/><path d="m16 5 10 5-2 5-10-5z" fill="#a9bbb0"/>',
    seed:`<path d="M8 8h16v20H8z" fill="#e7d0a0"/><path d="M8 8h16v4H8z" fill="${color}"/><path d="m16 14 5 5-5 6-5-6z" fill="${color}"/>`,
    water:'<path d="M5 13h17v14H5zM10 8h7v5h-3v-3h-2v3h-2zM22 16l8-5v6l-8 6z" fill="#79afbb"/><path d="M7 15h3v9H7z" fill="#b6d5cf"/>',
    rod:'<path d="m7 28 12-23 7 4v16" stroke="#be9c62" stroke-width="2" fill="none"/><path d="M24 23v4h4v-4" fill="#80b7b4"/>',
    axe:'<path d="m8 28 11-22" stroke="#b88b59" stroke-width="4"/><path d="m15 6 10 4 3 7-11-4z" fill="#a7b9b0"/>',
    pick:'<path d="m9 28 12-22M10 8l12-1 6 7" stroke="#a8b9b6" stroke-width="4" fill="none"/>',
    hand:'<path d="M9 26V13h3v7h2V7h3v13h2V10h3v11h2v-6h3v10l-5 4H13z" fill="#dfbb93"/>',
    fish:`<path d="m4 16 7-6h12l5 6-5 6H11zM3 11v10l8-5z" fill="${color}"/><path d="M22 13h3v3h-3z" fill="#304849"/>`,
    crop:`<path d="M10 13h13v11h-3v4h-7v-4h-3z" fill="${color}"/><path d="M14 5h4v11h-4zM6 7h8v5H6zM18 5h8v5h-8z" fill="#68955d"/>`,
    forage:`<path d="M7 16h8v10H7zM15 13h10v11H15z" fill="${color}"/><path d="M12 7h4v10h-4zM16 6h8v6h-8z" fill="#68955d"/>`,
    meal:`<path d="M4 17h25v8H8v-3H4z" fill="#d5c6a3"/><path d="M7 14h19v7H7z" fill="${color}"/><path d="M10 4v6M20 5v5" stroke="#b7c4b4" stroke-width="2"/>`,
    material:`<path d="M6 9h21v17H6z" fill="${color}"/><path d="M10 12h14M10 17h10M10 22h12" stroke="#ffffff33" stroke-width="2"/>`
  };
  return `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">${shapes[kind]??shapes.crop}</svg>`;
}
