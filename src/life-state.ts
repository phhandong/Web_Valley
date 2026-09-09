import type { GameStateV2, Relationship } from './types';
const relationship=():Relationship=>({hearts:0,talkedDay:0,giftedDay:0,stage:0,active:false,advancedDay:0,clues:[],caught:false,watered:false,cooked:false});
export const newSocial=():GameStateV2['social']=>({version:1,people:{ahe:relationship(),zhou:relationship(),shi:relationship()}});
export const newFacilities=():GameStateV2['facilities']=>({version:1,stored:{sprinkler:0,dryer:0,preserver:0,hive:0},nextId:1,machines:[],settledDay:0});
export const newEncounters=(day=1):GameStateV2['encounters']=>({version:1,day,previousWeather:'sun',daily:[],foxTrades:0,foxReady:0,caveSession:false});
