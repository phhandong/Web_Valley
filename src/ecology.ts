import { ECOLOGY } from './balance';
import { SCENES,objectDistance,objectKey } from './world';
import type { GameStateV2 } from './types';

export const newEcology=():GameStateV2['ecology']=>({version:1,trees:{'farm:f3':3,'farm:f6':0,'forest:tree2':1,'forest:tree8':4},nodeReady:{},eventReady:{}});
export function growWorld(state:GameStateV2){
  for(const scene of Object.values(SCENES))for(const o of scene.objects){
    const key=objectKey(scene.id,o),age=state.ecology.trees[key];
    if(o.kind!=='tree'||age===undefined||age>=ECOLOGY.matureTreeDay)continue;
    // Never grow a solid trunk under a player who is standing on the sapling.
    if(age===ECOLOGY.matureTreeDay-1&&state.player.scene===scene.id&&objectDistance(state.player.x,state.player.y,o)===0)continue;
    state.ecology.trees[key]=age+1;
    if(age+1===ECOLOGY.matureTreeDay)state.clearedObjects=state.clearedObjects.filter(k=>k!==key);
  }
  for(const key of Object.keys(state.ecology.nodeReady))if(state.ecology.nodeReady[key]<=state.calendar.day)delete state.ecology.nodeReady[key];
  for(const key of Object.keys(state.ecology.eventReady))if(state.ecology.eventReady[key]<=state.calendar.day)delete state.ecology.eventReady[key];
}
