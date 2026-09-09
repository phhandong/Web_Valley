import { FISH, ITEMS } from './content';
import type { Appearance, MachineKind, Stack, VillagerId } from './types';

export const PEOPLE:Record<VillagerId,{name:string; story:string; reward:string; appearance:Appearance; daily:string[]; stages:string[]}>={
  ahe:{name:'阿禾',story:'重新摆起分享摊',reward:'苹果肉桂酱',appearance:{skin:0,hair:5,outfit:1,hat:-1},daily:['早上拆开种子袋，闻起来就像新的一季。','店里的秤有点旧，不过一颗莓果也不会少算。','小时候，大家总把多收的菜放在门前。','萝卜叶子也好看，绿得精神。','忙完了记得吃饭，别只顾着田。','我想在店门外留一张桌子，让人坐坐。'],stages:['交付萝卜 ×3','接取后在厨房制作田园沙拉，并交付 ×1','交付任意基础果酱 ×1']},
  zhou:{name:'老舟',story:'湖边的旧时光',reward:'烟熏鱼',appearance:{skin:1,hair:4,outfit:4,hat:1},daily:['鱼不咬钩时，也可以看看水。','我年轻时在这儿坐到天亮，回家被念了一整天。','湖边的风一变，鱼群也会换地方。','旧鱼篓漏了几根藤条，我一直没舍得丢。','下雨的湖面热闹，岸边倒安静。','收竿别急，线绷紧了反而容易断。'],stages:['交付木材 ×5、纤维 ×5','17:00—20:00 调查湖畔两处回忆，再回来交谈','接取后在湖畔成功收鱼入包，再回来交谈']},
  shi:{name:'石叔',story:'省下浇水的工夫',reward:'香草干菇',appearance:{skin:2,hair:1,outfit:0,hat:-1},daily:['工具用完擦干，能多陪你几年。','这块石头的纹路，像山上的溪流。','木头也有脾气，顺着纹理省力。','我在试一套引水的小装置。','省下的工夫，拿去山里走走也好。','坏掉的东西先拿来看看，不一定要换新的。'],stages:['交付木材 ×10、石料 ×5','调查森林清泉旁的引水痕迹，再回来交谈','接取后让一台洒水器实际浇水，再回来交谈']}
};
export const PERSON_IDS=Object.keys(PEOPLE) as VillagerId[];
export const MACHINES:Record<MachineKind,{name:string;level:number;gold:number;ingredients:Stack[];description:string}>={
  sprinkler:{name:'洒水器',level:2,gold:100,ingredients:[{id:'wood',count:5},{id:'stone',count:5}],description:'清晨浇灌上下左右四格。当天新播种需手动浇水；可跨越。'},
  dryer:{name:'烘干架',level:2,gold:120,ingredients:[{id:'wood',count:10},{id:'fiber',count:5}],description:'两份同类鱼或坚果，过一夜制成干货。完成后手动领取。'},
  preserver:{name:'果酱罐',level:3,gold:180,ingredients:[{id:'wood',count:10},{id:'stone',count:8}],description:'两份同类莓果、苹果或草莓，过一夜制成果酱。'},
  hive:{name:'蜂箱',level:3,gold:200,ingredients:[{id:'wood',count:15},{id:'fiber',count:10}],description:'周围两格有成熟适季花卉时，每两个有效夜晚产一份花蜜；无花暂停。'}
};
export const MACHINE_KINDS=Object.keys(MACHINES) as MachineKind[];
export interface ProcessingRecipe {id:string;machine:MachineKind;ingredients:Stack[];nights:number;owner?:VillagerId}
export const PROCESSING:ProcessingRecipe[]=[];
function recipe(id:string,name:string,machine:MachineKind,ingredients:Stack[],nights:number,multiplier:number,owner?:VillagerId){
  PROCESSING.push({id,machine,ingredients,nights,owner});
  ITEMS[id]={id,name,kind:'processed',color:machine==='preserver'?'#bd7869':'#c4a270',sell:Math.ceil(ingredients.reduce((n,i)=>n+ITEMS[i.id].sell*i.count,0)*multiplier),description:`${nights} 个夜晚加工 · 可出售、送礼或交付委托。`};
}
for(const id of ['berry','apple','strawberry'])recipe('jam_'+id,ITEMS[id].name+'果酱','preserver',[{id,count:2}],1,1.4);
for(const id of ['nuts',...FISH.map(f=>f.id)])recipe('dried_'+id,ITEMS[id].name+'干','dryer',[{id,count:2}],1,1.25);
recipe('spiced_apple','苹果肉桂酱','preserver',[{id:'apple',count:2},{id:'herb',count:1}],2,1.6,'ahe');
for(const fish of FISH)recipe('smoked_'+fish.id,'烟熏'+fish.name,'dryer',[{id:fish.id,count:2},{id:'herb',count:1}],2,1.6,'zhou');
recipe('herbal_mushroom','香草干菇','dryer',[{id:'mushroom',count:2},{id:'herb',count:1}],2,1.6,'shi');
export const FLOWERS=['marigold','snowbell'];
for(const id of FLOWERS)ITEMS['honey_'+id]={id:'honey_'+id,name:ITEMS[id].name+'蜜',kind:'processed',color:'#e8b34f',sell:60,description:'蜂箱采集花田的香气酿成，可出售或赠送。'};
ITEMS.stardust={id:'stardust',name:'星屑',kind:'material',color:'#e3dbfa',sell:60,description:'晴夜山脊的流星留下的小小光点。'};
