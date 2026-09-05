import { FISH } from './content';
import { canFish,chooseFish,random,spend } from './engine';
import type { GameStateV2,RNG } from './types';
export interface FishingSession {stage:'waiting'|'bite'|'reeling'|'won'|'lost';fish:string;timer:number;float:number;velocity:number;fishY:number;progress:number;elapsed:number;range:number;assist:boolean;seed:number}
export function startFishing(state:GameStateV2,rng:RNG=()=>random(state)):FishingSession|null{
  if(state.pendingCatch||!canFish(state)||!spend(state,5))return null;
  return {stage:'waiting',fish:chooseFish(state,rng),timer:1.8+rng()*2.4,float:.5,velocity:0,fishY:.5,progress:.35,elapsed:0,range:.25+state.upgrades.rod*.07+(state.settings.fishingAssist?.18:0),assist:state.settings.fishingAssist,seed:rng()*6.28};
}
export function reel(session:FishingSession){if(session.stage==='bite'){session.stage='reeling';session.timer=0;return true}return false}
export function tickFishing(session:FishingSession,dt:number,held:boolean){
  if(dt<=0||!Number.isFinite(dt))return;
  if(session.stage==='waiting'){session.timer-=dt;if(session.timer<=0){session.stage='bite';session.timer=2.2}return}
  if(session.stage==='bite'){session.timer-=dt;if(session.timer<=0)session.stage='lost';return}
  if(session.stage!=='reeling')return;
  const rarity=FISH.find(f=>f.id===session.fish)!.rarity;
  session.elapsed+=dt;const speed=(.65+rarity*.3)*(session.assist?.5:1);
  session.fishY=.5+Math.sin(session.elapsed*speed+session.seed)*.3+Math.sin(session.elapsed*speed*.47)*.08;
  session.velocity+=(held?-2.4:1.8)*dt;session.velocity*=Math.exp(-3.5*dt);
  session.float=Math.max(session.range/2,Math.min(1-session.range/2,session.float+session.velocity*dt));
  const inside=Math.abs(session.float-session.fishY)<=session.range/2;
  session.progress=Math.max(0,Math.min(1,session.progress+dt*(inside?.16:-.095)));
  if(session.progress>=1)session.stage='won';
  if(session.progress<=0||session.elapsed>45)session.stage='lost';
}
