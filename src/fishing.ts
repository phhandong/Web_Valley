import { FISH } from './content';
import { canFish,chooseFish,random,spend } from './engine';
import type { GameStateV2,RNG } from './types';
export type FishingDifficulty='intro'|'easy'|'standard'|'challenge';
export const FISHING_DIFFICULTIES={
  intro:{name:'入门',range:.44,bite:2.8,speed:.38,amplitude:.18,jitter:.02,gain:.18,loss:.05,progress:.45},
  easy:{name:'轻松',range:.34,bite:2.2,speed:.52,amplitude:.23,jitter:.04,gain:.15,loss:.075,progress:.38},
  standard:{name:'标准',range:.26,bite:1.7,speed:.75,amplitude:.26,jitter:.06,gain:.125,loss:.11,progress:.30},
  challenge:{name:'挑战',range:.18,bite:1.25,speed:1.23,amplitude:.27,jitter:.09,gain:.105,loss:.15,progress:.28}
} as const;
export function nextFishingDifficulty(state:GameStateV2):FishingDifficulty{
  if(state.stats.caught<3)return 'intro';
  const turn=state.progression.fishingRotation%4;
  if(turn%2===0)return 'easy';
  return turn===3&&state.stats.caught>=6?'challenge':'standard';
}
export interface FishingSession {stage:'waiting'|'bite'|'reeling'|'won'|'lost';difficulty:FishingDifficulty;fish:string;timer:number;float:number;velocity:number;fishY:number;progress:number;elapsed:number;range:number;assist:boolean;seed:number}
export function startFishing(state:GameStateV2,rng:RNG=()=>random(state)):FishingSession|null{
  if(state.pendingCatch||!canFish(state)||!spend(state,5,false))return null;
  const difficulty=nextFishingDifficulty(state),config=FISHING_DIFFICULTIES[difficulty];
  if(difficulty!=='intro')state.progression.fishingRotation++;
  return {stage:'waiting',difficulty,fish:chooseFish(state,rng),timer:1.8+rng()*2.4,float:.5,velocity:0,fishY:.5,progress:config.progress,elapsed:0,range:Math.min(.70,config.range+state.upgrades.rod*.045+(state.settings.fishingAssist?.20:0)),assist:state.settings.fishingAssist,seed:rng()*6.28};
}
export function reel(session:FishingSession){if(session.stage==='bite'){session.stage='reeling';session.timer=0;return true}return false}
export function tickFishing(session:FishingSession,dt:number,held:boolean){
  if(dt<=0||!Number.isFinite(dt))return;
  const config=FISHING_DIFFICULTIES[session.difficulty];
  if(session.stage==='waiting'){session.timer-=dt;if(session.timer<=0){session.stage='bite';session.timer=Math.max(config.bite,session.assist?2.2:0)}return}
  if(session.stage==='bite'){session.timer-=dt;if(session.timer<=0)session.stage='lost';return}
  if(session.stage!=='reeling')return;
  const rarity=FISH.find(f=>f.id===session.fish)!.rarity;
  session.elapsed+=dt;const rarityBonus=session.difficulty==='intro'||session.difficulty==='easy'?0:(rarity-1)*.18;
  const speed=(config.speed+rarityBonus)*(session.assist?.42:1);
  const t=session.elapsed*speed;
  session.fishY=Math.max(.08,Math.min(.92,.5+(Math.sin(t+session.seed)*config.amplitude+Math.sin(t*2.3+session.seed)*config.jitter+Math.sin(t*.47)*.06)*Math.min(1,session.elapsed/1.2)));
  session.velocity+=(held?-2.4:1.8)*dt;session.velocity*=Math.exp(-3.5*dt);
  session.float=Math.max(session.range/2,Math.min(1-session.range/2,session.float+session.velocity*dt));
  const inside=Math.abs(session.float-session.fishY)<=session.range/2;
  session.progress=Math.max(0,Math.min(1,session.progress+dt*(inside?(session.assist?Math.max(.14,config.gain):config.gain):-(session.assist?Math.min(.09,config.loss):config.loss))));
  if(session.progress>=1)session.stage='won';
  if(session.progress<=0||session.elapsed>45)session.stage='lost';
}
