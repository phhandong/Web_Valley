import { initialState } from '../src/engine';
import { validSave } from '../src/persistence';
import { writeFileSync } from 'node:fs';
const fixtures=[['fishing','farm',5,10],['shop','town',8,7],['home','home',16,14],['wardrobe','home',12,7],['sleep','home',10,7],['coast','coast',12,9],['ridge','ridge',20,8],['hud','farm',23,5]] as const;
for(const [name,scene,x,y] of fixtures){
 const s=initialState(7);Object.assign(s.player,{scene,x,y});s.calendar.minute=600;s.gold=500;s.progression.xp=1260;s.selectedTool='rod';s.settings.fishingAssist=true;s.inventory.slots.push({id:'radish',count:5});
 if(!validSave(s))throw new Error(name);
 writeFileSync(`.qa/${name}.json`,JSON.stringify(s));
}
