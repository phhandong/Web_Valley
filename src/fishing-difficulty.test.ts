import { describe,it,expect } from 'vitest';
import { initialState,acceptCatch,dayEnd } from './engine';
import { FISHING_DIFFICULTIES,nextFishingDifficulty,startFishing,tickFishing,reel } from './fishing';
import { parseSave } from './persistence';
const fresh=()=>{const s=initialState(42);s.player.x=5;s.player.y=10;return s};
describe('progressive fishing difficulty',()=>{
  it('keeps the first three landed fish introductory, including retries',()=>{
    const s=fresh();for(let caught=0;caught<3;caught++){
      for(let retry=0;retry<3;retry++)expect(startFishing(s,()=>0)!.difficulty).toBe('intro');
      expect(s.progression.fishingRotation).toBe(0);s.pendingCatch='crucian';acceptCatch(s);
    }expect(startFishing(s,()=>0)!.difficulty).toBe('easy');
  });
  it('introduces standard rounds before challenges, alternating even when rounds fail',()=>{
    const s=fresh();s.stats.caught=3;
    expect(Array.from({length:4},()=>startFishing(s,()=>0)!.difficulty)).toEqual(['easy','standard','easy','standard']);
    s.stats.caught=6;
    expect(Array.from({length:8},()=>startFishing(s,()=>0)!.difficulty)).toEqual(['easy','standard','easy','challenge','easy','standard','easy','challenge']);
  });
  it('invalid casts never advance difficulty or spend stamina',()=>{
    const s=fresh();s.stats.caught=6;s.player.x=20;expect(startFishing(s)).toBeNull();expect(s.progression.fishingRotation).toBe(0);expect(s.player.vitals.stamina).toBe(100);s.player.x=5;s.player.vitals.stamina=0;expect(startFishing(s)).toBeNull();expect(s.progression.fishingRotation).toBe(0);
  });
  it('preserves the next easy round after a challenge through reload and sleep',()=>{
    const s=fresh();s.stats.caught=6;s.progression.fishingRotation=3;expect(startFishing(s,()=>0)!.difficulty).toBe('challenge');const restored=parseSave(JSON.stringify(s))!;expect(nextFishingDifficulty(restored)).toBe('easy');dayEnd(restored);expect(nextFishingDifficulty(restored)).toBe('easy');
  });
  it('migrates existing progression, while rejecting corrupt rotation counts',()=>{
    const s:any=fresh();delete s.progression.fishingRotation;s.stats.caught=12;expect(nextFishingDifficulty(parseSave(JSON.stringify(s))!)).toBe('easy');for(const n of [-1,1.5,null,'2']){s.progression.fishingRotation=n;expect(parseSave(JSON.stringify(s))).toBeNull()}
  });
  it('steps up speed and precision gradually, while giving more reaction time to beginners',()=>{
    const configs=Object.values(FISHING_DIFFICULTIES);for(let i=1;i<configs.length;i++){expect(configs[i].speed).toBeGreaterThan(configs[i-1].speed);expect(configs[i].range).toBeLessThan(configs[i-1].range);expect(configs[i].bite).toBeLessThan(configs[i-1].bite);expect(configs[i].loss).toBeGreaterThan(configs[i-1].loss)}
  });
  it('beginners can win with basic tracking across different fish movement seeds',()=>{
    for(const seed of [0,.2,.4,.6,.8,.99]){const s=fresh(),f=startFishing(s,()=>seed)!;tickFishing(f,5,false);expect(f.timer).toBe(2.8);reel(f);for(let i=0;i<2700&&f.stage==='reeling';i++)tickFishing(f,1/60,f.float>f.fishY);expect(f.stage,`seed ${seed}`).toBe('won')}
  });
  it('upgrades and assistance help every tier without changing its fish',()=>{
    for(const rotation of [0,1,3]){const s=fresh();s.stats.caught=6;s.progression.fishingRotation=rotation;const normal=startFishing(s,()=>.2)!;s.settings.fishingAssist=true;s.upgrades.rod=2;s.progression.fishingRotation=rotation;const assisted=startFishing(s,()=>.2)!;expect(assisted.difficulty).toBe(normal.difficulty);expect(assisted.fish).toBe(normal.fish);expect(assisted.range).toBeGreaterThan(normal.range)}
  });
});
