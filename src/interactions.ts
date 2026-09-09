import { nearby } from './world';
import { machineNodes } from './facilities';
import { storyNodes, villagerNodes, nodeReachable } from './villagers';
import { encounterNodes } from './encounters';
import type { GameStateV2 } from './types';
export const dynamicNodes=(s:GameStateV2)=>[...villagerNodes(s),...machineNodes(s),...storyNodes(s),...encounterNodes(s)];
export function nearbyInteraction(s:GameStateV2){
  const p=s.player,delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[p.direction];
  const nodes=dynamicNodes(s).filter(n=>nodeReachable(s,n)).sort((a,b)=>{
    const score=(n:typeof a)=>(n.x===p.x+delta[0]&&n.y===p.y+delta[1]?-2:0)+Math.abs(n.x-p.x)+Math.abs(n.y-p.y);
    return score(a)-score(b);
  });
  // Static doors and shops stay usable unless deliberately facing a dynamic target.
  const fixed=nearby(s),first=nodes[0];
  if(first&&(!fixed||first.x===p.x+delta[0]&&first.y===p.y+delta[1]||first.x===p.x&&first.y===p.y))return {kind:'dynamic' as const,id:first.id,label:first.label};
  return fixed??(first?{kind:'dynamic' as const,id:first.id,label:first.label}:null);
}
