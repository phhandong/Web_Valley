export interface Box {x:number;y:number;width:number;height:number}
const overlap=(a:Box,b:Box)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
export function fishingPanelPosition(anchor:{x:number;y:number},frame:{width:number;height:number},panel:{width:number;height:number},obstacles:Box[]){
  const candidates=[{x:anchor.x+22,y:anchor.y-panel.height/2},{x:anchor.x-panel.width-22,y:anchor.y-panel.height/2},{x:anchor.x-panel.width/2,y:anchor.y+24},{x:anchor.x-panel.width/2,y:anchor.y-panel.height-24}];
  return candidates.map(p=>({...panel,x:Math.max(8,Math.min(frame.width-panel.width-8,p.x)),y:Math.max(8,Math.min(frame.height-panel.height-8,p.y))})).sort((a,b)=>{
    const score=(p:Box)=>obstacles.reduce((n,o)=>n+overlap(p,o)*10,0)+overlap(p,{x:anchor.x-12,y:anchor.y-16,width:24,height:32})*30+Math.hypot(p.x+panel.width/2-anchor.x,p.y+panel.height/2-anchor.y);
    return score(a)-score(b);
  })[0];
}
export function hudOnLeft(wasLeft:boolean,player:{x:number;y:number},frame:{width:number;height:number},hud:{width:number;height:number}){
  const margin=wasLeft?130:85;
  return player.x>frame.width-hud.width-margin&&player.y<hud.height+margin;
}
