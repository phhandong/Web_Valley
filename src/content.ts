import type { CropDefinition, FishDefinition, ItemDefinition, Recipe, Season, Tool } from './types';

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_NAMES = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
export const WEATHER_NAMES = { sun: '晴', rain: '雨', snow: '雪' };
export const ALL_SEASONS: Season[] = [...SEASONS];
export const CROPS: CropDefinition[] = [
  { id: 'radish', name: '萝卜', seasons: ALL_SEASONS, days: 2, regrow: 0, seedPrice: 10, sell: 25, color: '#edb3a0' },
  { id: 'potato', name: '土豆', seasons: ['spring', 'summer'], days: 3, regrow: 0, seedPrice: 18, sell: 55, color: '#bd934e' },
  { id: 'strawberry', name: '草莓', seasons: ['spring'], days: 4, regrow: 2, seedPrice: 65, sell: 38, color: '#df5f62' },
  { id: 'tomato', name: '番茄', seasons: ['summer', 'autumn'], days: 4, regrow: 2, seedPrice: 50, sell: 32, color: '#e76c49' },
  { id: 'corn', name: '玉米', seasons: ['summer', 'autumn'], days: 5, regrow: 2, seedPrice: 60, sell: 42, color: '#efc455' },
  { id: 'pumpkin', name: '南瓜', seasons: ['autumn'], days: 5, regrow: 0, seedPrice: 65, sell: 190, color: '#db903d' },
  { id: 'wheat', name: '小麦', seasons: ['spring', 'summer', 'autumn'], days: 3, regrow: 0, seedPrice: 15, sell: 40, color: '#dac070' },
  { id: 'cabbage', name: '冬白菜', seasons: ['winter'], days: 3, regrow: 0, seedPrice: 20, sell: 65, color: '#b9d59b' }
];
export const FISH: FishDefinition[] = [
  { id:'crucian',name:'鲫鱼',rarity:1,seasons:ALL_SEASONS,weather:['sun','rain','snow'],hours:[6,26],scenes:['farm','lake'],sell:30,color:'#b1bdae' },
  { id:'carp',name:'鲤鱼',rarity:1,seasons:ALL_SEASONS,weather:['sun','rain','snow'],hours:[6,26],scenes:['lake'],sell:40,color:'#d8a568' },
  { id:'perch',name:'河鲈',rarity:1,seasons:['spring','autumn'],weather:['sun','rain'],hours:[6,18],scenes:['lake'],sell:45,color:'#93af74' },
  { id:'catfish',name:'鲶鱼',rarity:2,seasons:['spring','summer','autumn'],weather:['rain'],hours:[6,26],scenes:['lake'],sell:100,color:'#7e96ab' },
  { id:'trout',name:'虹鳟',rarity:2,seasons:['spring','summer'],weather:['sun','rain'],hours:[6,18],scenes:['lake'],sell:85,color:'#c7a2b0' },
  { id:'eel',name:'鳗鱼',rarity:2,seasons:['spring','autumn'],weather:['rain'],hours:[18,26],scenes:['lake'],sell:120,color:'#a3b38b' },
  { id:'sunfish',name:'太阳鱼',rarity:1,seasons:['spring','summer'],weather:['sun'],hours:[6,18],scenes:['farm','lake'],sell:50,color:'#edc262' },
  { id:'koi',name:'锦鲤',rarity:2,seasons:['summer','autumn'],weather:['sun','rain'],hours:[6,26],scenes:['farm'],sell:110,color:'#e99877' },
  { id:'salmon',name:'秋鲑',rarity:2,seasons:['autumn'],weather:['sun','rain'],hours:[6,18],scenes:['lake'],sell:95,color:'#e0a195' },
  { id:'icefish',name:'银冰鱼',rarity:2,seasons:['winter'],weather:['sun','snow'],hours:[6,26],scenes:['lake'],sell:90,color:'#c7e3ec' },
  { id:'moonfish',name:'月光鱼',rarity:3,seasons:ALL_SEASONS,weather:['sun','rain','snow'],hours:[20,26],scenes:['lake'],sell:230,color:'#aab7ed' },
  { id:'goldfish',name:'金鳞鱼',rarity:3,seasons:['summer'],weather:['sun'],hours:[12,18],scenes:['lake'],sell:260,color:'#efd37e' }
];
export const FORAGE = [
  { id:'berry',name:'莓果',color:'#b75c76',sell:8,food:{health:0,stamina:15,hunger:20},seasons:ALL_SEASONS },
  { id:'mushroom',name:'蘑菇',color:'#c8a27c',sell:14,food:{health:3,stamina:12,hunger:12},seasons:['spring','autumn'] as Season[] },
  { id:'greens',name:'野菜',color:'#87ab5e',sell:10,food:{health:2,stamina:12,hunger:15},seasons:['spring','summer'] as Season[] },
  { id:'nuts',name:'坚果',color:'#bd8b59',sell:12,food:{health:0,stamina:20,hunger:22},seasons:['autumn','winter'] as Season[] },
  { id:'apple',name:'野苹果',color:'#de8b61',sell:15,food:{health:5,stamina:18,hunger:25},seasons:['summer','autumn'] as Season[] },
  { id:'herb',name:'草药',color:'#80b399',sell:16,food:{health:20,stamina:3,hunger:3},seasons:ALL_SEASONS }
];
export const RECIPES: Recipe[] = [
  {id:'salad',name:'田园沙拉',ingredients:[{id:'radish',count:1},{id:'berry',count:1}],food:{health:12,stamina:35,hunger:40},sell:50},
  {id:'berry_bowl',name:'莓果果碗',ingredients:[{id:'berry',count:3}],food:{health:10,stamina:50,hunger:65},sell:35},
  {id:'grilled_fish',name:'香烤鲜鱼',ingredients:[{id:'crucian',count:1},{id:'herb',count:1}],food:{health:25,stamina:55,hunger:55},sell:70},
  {id:'mushroom_soup',name:'菌菇汤',ingredients:[{id:'mushroom',count:2},{id:'herb',count:1}],food:{health:35,stamina:40,hunger:45},sell:65},
  {id:'bread',name:'坚果面包',ingredients:[{id:'wheat',count:2},{id:'nuts',count:1}],food:{health:10,stamina:65,hunger:80},sell:120},
  {id:'pumpkin_soup',name:'南瓜浓汤',ingredients:[{id:'pumpkin',count:1},{id:'corn',count:1}],food:{health:45,stamina:80,hunger:85},sell:290},
  {id:'fruit_pie',name:'野果派',ingredients:[{id:'apple',count:1},{id:'strawberry',count:1},{id:'wheat',count:1}],food:{health:30,stamina:70,hunger:70},sell:130},
  {id:'winter_stew',name:'冬日炖菜',ingredients:[{id:'cabbage',count:1},{id:'potato',count:1},{id:'tomato',count:1}],food:{health:60,stamina:90,hunger:90},sell:210}
];
export const ITEMS: Record<string, ItemDefinition> = {};
for (const crop of CROPS) {
  ITEMS[crop.id] = {id:crop.id,name:crop.name,kind:'crop',sell:crop.sell,color:crop.color,food:{health:3,stamina:10,hunger:15},description:'新鲜收获的农产品，可食用、烹饪或出售。'};
  ITEMS[`seed_${crop.id}`] = {id:`seed_${crop.id}`,name:`${crop.name}种子`,kind:'seed',buy:crop.seedPrice,sell:Math.floor(crop.seedPrice*.4),color:crop.color,description:`${crop.seasons.map(s=>SEASON_NAMES[s]).join('／')}季 · ${crop.days} 个浇水日成熟${crop.regrow?` · 每 ${crop.regrow} 日再收获`:''} · 售价 ${crop.sell} G`};
}
for (const fish of FISH) ITEMS[fish.id]={id:fish.id,name:fish.name,kind:'fish',sell:fish.sell,color:fish.color,description:`${['','常见','少见','稀有'][fish.rarity]}鱼 · ${fish.scenes.includes('farm')?'农场池塘／':''}湖畔 · ${fish.seasons.map(s=>SEASON_NAMES[s]).join('／')} · ${fish.hours[0]}:00–${fish.hours[1]}:00 · ${fish.weather.map(w=>WEATHER_NAMES[w]).join('／')}`};
for (const item of FORAGE) ITEMS[item.id]={...item,kind:'forage',description:'可免费采集，食用恢复状态；也是厨房的好食材。'};
for (const meal of RECIPES) ITEMS[meal.id]={id:meal.id,name:meal.name,kind:'meal',sell:meal.sell,color:'#e6b975',food:meal.food,description:'在自家厨房制作的温暖料理。'};
ITEMS.ration={id:'ration',name:'便携口粮',kind:'meal',buy:35,sell:10,color:'#d8b077',food:{health:5,stamina:35,hunger:45},description:'随身带上一份，忙碌时也记得好好吃饭。'};
ITEMS.wood={id:'wood',name:'木材',kind:'material',sell:5,color:'#a77b4c',description:'森林中获取，用于工具升级和农场扩建。'};
ITEMS.stone={id:'stone',name:'石料',kind:'material',sell:6,color:'#a0aaa4',description:'用镐采集，用于工具升级和农场扩建。'};
export const TOOLS: {id:Tool; name:string; key:string; mark:string}[]=[{id:'hoe',name:'锄头',key:'1',mark:'hoe'},{id:'seed',name:'播种',key:'2',mark:'seed'},{id:'water',name:'水壶',key:'3',mark:'water'},{id:'hand',name:'采收',key:'4',mark:'hand'},{id:'rod',name:'鱼竿',key:'5',mark:'rod'},{id:'axe',name:'斧头',key:'6',mark:'axe'},{id:'pick',name:'石镐',key:'7',mark:'pick'}];
export const SKINS=['#f3c99e','#dfb083','#c68d65','#a66d4e','#82533d','#603f34'];
export const HAIRS=['栗色短发','深棕卷发','乌黑长发','浅金短发','银灰长发','酒红辫发'];
export const HAIR_COLORS=['#734a30','#553827','#302d2a','#d7b16a','#b8bcb4','#8f4a49'];
export const OUTFITS=['苔绿工装','奶油围裙','蓝莓衬衫','枫叶斗篷','湖蓝钓装','麦穗礼服','冬日大衣','星夜长衫'];
export const OUTFIT_COLORS=['#4c7960','#e4cf9c','#628baf','#b6684a','#589eaa','#d2a353','#9bafb0','#777fa5'];
export const HATS=['草编帽','渔夫帽','毛线帽','贝雷帽','花环','星星帽'];
export const UPGRADE_COSTS={farm:[{gold:250,wood:10,stone:5},{gold:900,wood:30,stone:20}],tools:[{gold:150,wood:5,stone:5},{gold:500,wood:15,stone:15}],rod:[{gold:120,wood:5,stone:0},{gold:450,wood:15,stone:5}],bag:[{gold:180,wood:0,stone:0},{gold:600,wood:0,stone:0}]};
