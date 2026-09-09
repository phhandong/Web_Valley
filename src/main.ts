import { WorkController } from './work-session';
import { grassAt,workTarget,labourNode } from './fieldwork';
import { clearGrass,repairFacility,restAtShelter } from './engine';
import './style.css';
import { CROPS,ITEMS,TOOLS } from './content';
import { UI } from './ui';
import { SceneRenderer } from './scene-renderer';
import { acceptCatch,advanceTime,availableForage,buy,canFish,chestTransfer,cook,dayEnd,eat,farmAction,gather,initialState,result,sell,setAppearance,shopOpen,step,submitOrder,targetTile,travel,unlockAppearance,upgrade } from './engine';
import { loadGame,parseSave,saveGame } from './persistence';
import { reel,startFishing,tickFishing,RecastGuard,type FishingSession } from './fishing';
import { SCENES,TILE,nearby } from './world';
import type { Direction,GameStateV2,Result,Tool } from './types';
import { areaOpen,forestEvent,levelOf,purchaseArea } from './progression';
import { ValleyMusic } from './music';
import { sortInventory } from './inventory';
import { harvestResource } from './engine';
import { resourceAt } from './world';
import { nearbyInteraction,dynamicNodes } from './interactions';
import { talk,gift,storyAction,investigateStory,nodeReachable } from './villagers';
import { investigateEncounter } from './encounters';
import { craftMachine,placeMachine,storeMachine,startProcessing,collectMachine,placementError,machineBusy } from './facilities';
import { MACHINES } from './life-content';
import { drawPlacement,type PlacementDraft } from './life-art';
import type { MachineKind,VillagerId } from './types';

const loaded=loadGame(localStorage);
let state=loaded.state,saveBlocked=loaded.blocked;
let fishing: FishingSession|null=null;
let placement:PlacementDraft|null=null;
const recast=new RecastGuard();
const work=new WorkController();
let sleepPending=false;
let heldFish=false,transitionTime=0,focused=document.hasFocus();
let saveElapsed=0,lastTime=performance.now(),accumulator=0,moveTimer=0;
const keys=new Set<string>();
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const ui=new UI(()=>state,handleAction);
const canvas=$<HTMLCanvasElement>('game');
const renderer=new SceneRenderer(canvas);
let previousLevel=levelOf(state);
const music=new ValleyMusic();
window.addEventListener('pointerdown',()=>music.unlock(),{passive:true});
window.addEventListener('keydown',()=>music.unlock());
let audio:AudioContext|null=null;
function tone(kind:string){
  if(!state.settings.sound)return;
  try {
    audio??=new AudioContext();if(audio.state==='suspended')void audio.resume();
    const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';
    const now=audio.currentTime;oscillator.frequency.setValueAtTime(kind==='water'?640:kind==='harvest'?850:400,now);oscillator.frequency.exponentialRampToValueAtTime(kind==='water'?310:620,now+.12);
    gain.gain.setValueAtTime(.025,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(now+.18);
  }catch{/* Sound is optional when the browser has no audio output. */}
}
function save(){
  if(saveBlocked)return;
  try{saveGame(localStorage,state);$('saveStatus').textContent='进度已保存 · 本机';saveElapsed=0}
  catch{saveBlocked=true;$('saveStatus').textContent='保存不可用 · 请导出';ui.showToast('自动保存暂不可用，请在设置中导出进度。')}
}
function dayTransition(message:string){
  work.cancel();recast.finish();sleepPending=false;
  fishing=null;heldFish=false;keys.clear();ui.forceClose();ui.fishing(null);
  transitionTime=2.3;$('transition').hidden=false;$('transition').dataset.phase='night';$('transition').querySelector('h2')!.textContent='第 '+state.calendar.day+' 天';
  $('transition').querySelector('p')!.textContent=message;
}
function report(res:Result,x=state.player.x,y=state.player.y){
  const level=levelOf(state),levelMessage=level>previousLevel?` · 升至 Lv.${level}！在地图中查看新的区域资格`:'';previousLevel=level;
  if(res.message||levelMessage)ui.showToast(res.message+levelMessage);
  if(res.ok){if(res.effect){renderer.burst(x,y,res.effect);tone(res.effect)}if(res.dayEnded)dayTransition(res.message);save();ui.hud(true)}
}
function interact(){
  if(ui.panel||transitionTime||fishing)return;
  work.cancel();
  const near=nearbyInteraction(state);
  if(near?.kind==='dynamic'){interactDynamic(near.id);return;}
  if(near?.kind==='exit'){const exit=SCENES[state.player.scene].exits.find(e=>e.id===near.id)!;if(!areaOpen(state,exit.to)){ui.open('regions');keys.clear();return}report(travel(state,near.id));return}
  if(near?.kind==='object'){
    if(near.id.startsWith('event:')){report(forestEvent(state,near.id.slice(6)));return}
    if(['grocer','fisher','smith'].includes(near.id)&&!shopOpen(state)){ui.showToast('还没营业呢。每天 08:00—20:00 开门，先去逛逛吧。');return}
    ui.open(near.id);keys.clear();return;
  }
  const n=availableForage(state).filter(n=>!state.gathered.includes(state.player.scene+':'+n.id)).find(n=>Math.abs(n.x-state.player.x)+Math.abs(n.y-state.player.y)<=1);
  if(n){if(labourNode(n))beginWork(n.x,n.y);else report(gather(state,n.x,n.y),n.x,n.y);return}
  const target=targetTile(state);
  if(workTarget(state,target.x,target.y)){beginWork(target.x,target.y);return}
  if(canFish(state)){beginFishing();return}
  ui.showToast('走到房门、路牌、采集物或商店旁，再按 E。');
}
function interactDynamic(id:string){
  work.cancel();keys.clear();
  if(id.startsWith('npc:')||id.startsWith('machine:')){ui.open(id);return;}
  report(id.startsWith('story:')?investigateStory(state,id):investigateEncounter(state,id));
}
function cancelPlacement(){placement=null;$('placementPanel').hidden=true;keys.clear();canvas.focus({preventScroll:true});}
function previewPlacement(){
  if(!placement)return;
  const error=placementError(state,placement.kind,placement.x,placement.y,placement.movingId);
  placement.error=error;$('placementTitle').textContent=(placement.movingId?'搬动 · ':'布置 · ')+MACHINES[placement.kind].name;
  $('placementHint').textContent=error||`格子 ${placement.x}, ${placement.y} 可以摆放${placement.kind==='hive'?' · 金色区域为两格采蜜范围':placement.kind==='sprinkler'?' · 蓝色区域为四格浇水范围':''}`;
  $('placementPanel').dataset.valid=String(!error);$('placementPanel').querySelector<HTMLButtonElement>('[data-action="placeConfirm"]')!.disabled=!!error;
}
function beginWork(x:number,y:number){const res=work.start(state,x,y);keys.clear();if(res.message)ui.showToast(res.message);}
function beginFishing(){
  work.cancel();
  if(!recast.ready)return;
  const session=startFishing(state);
  if(!session){ui.showToast(canFish(state)?'体力不足，先吃点东西吧。':'走到池塘或湖畔有标记的钓点旁。');return}
  fishing=session;keys.clear();heldFish=false;save();ui.hud(true);ui.fishing(fishing);
}
function useAt(x:number,y:number){
  if(ui.panel||transitionTime||fishing)return;
  const dynamic=dynamicNodes(state).find(n=>n.scene===state.player.scene&&n.x===x&&n.y===y&&nodeReachable(state,n));if(dynamic){interactDynamic(dynamic.id);return;}
  if(state.selectedTool==='rod'){beginFishing();return}
  if(workTarget(state,x,y)){beginWork(x,y);return}
  if(grassAt(state,x,y)){report(clearGrass(state,x,y),x,y);return}
  const n=availableForage(state).find(n=>n.x===x&&n.y===y&&!state.gathered.includes(state.player.scene+':'+n.id));
  if(n){report(gather(state,x,y),x,y);return}
  report(farmAction(state,x,y),x,y);
}
function handleAction(action:string,id:string,value:string){
  if(action==='placeCancel'){cancelPlacement();return;}
  if(action==='placeConfirm'){if(placement){const res=placeMachine(state,placement.kind,placement.x,placement.y,placement.movingId);report(res);if(res.ok)cancelPlacement();else previewPlacement();}return;}
  if(placement){if(action==='close')cancelPlacement();return;}
  if(action==='placeStart'||action==='moveMachine'){
    if(fishing||transitionTime||state.player.scene!=='farm'){ui.showToast('回到农场，结束当前动作后再布置。');return;}
    const m=action==='moveMachine'?state.facilities.machines.find(m=>m.id===Number(id)):undefined;
    if(action==='moveMachine'&&(!m||machineBusy(m))){ui.showToast('先完成生产并领取产物，再搬动。');return;}
    const kind=m?.kind??id as MachineKind;if(!MACHINES[kind]||!m&&!state.facilities.stored[kind])return;
    work.cancel();keys.clear();ui.forceClose();placement={kind,x:m?.x??state.player.x,y:m?.y??state.player.y,movingId:m?.id,error:''};$('placementPanel').hidden=false;previewPlacement();canvas.focus({preventScroll:true});return;
  }
  if(action==='cancelFishing'){recast.finish();fishing=null;heldFish=false;ui.fishing(null);ui.showToast('收起了鱼竿，稍等片刻再抛竿。');save();return}
  if(action==='reel'){if(fishing)reel(fishing);return}
  if(transitionTime>0)return;
  if(action==='close'){ui.close();keys.clear();return}
  if(action==='open'){if(fishing)return;work.cancel();ui.open(id);keys.clear();return}
  if(action==='tool'){if(ui.panel||fishing)return;work.cancel();state.selectedTool=id as Tool;ui.hud(true);save();return}
  if(action==='selectSeed'){state.selectedSeed=id.slice(5);state.selectedTool='seed';report(result(true,'已选择'+ITEMS[id].name));ui.close();return}
  let res:Result|null=null;const count=Number(value);
  switch(action){
    case 'talk':res=talk(state,id as VillagerId);break;
    case 'gift':res=gift(state,id as VillagerId,value);if(res.ok)ui.open('npc:'+id);break;
    case 'story':res=storyAction(state,id as VillagerId);break;
    case 'craftMachine':res=craftMachine(state,id as MachineKind);break;
    case 'storeMachine':res=storeMachine(state,Number(id));if(res.ok)ui.open('facilities');break;
    case 'process':res=startProcessing(state,Number(id),value);break;
    case 'collectMachine':res=collectMachine(state,Number(id));break;
    case 'repair':res=repairFacility(state,id);break;
    case 'rest':res=restAtShelter(state);break;
    case 'sortBag':res=result(sortInventory(state.inventory),'背包已整理，同类物品已合并');break;
    case 'resizeHud':state.settings.hudWidth=Math.max(220,Math.min(360,state.settings.hudWidth+count));res=result(true,'');break;
    case 'purchaseArea':res=purchaseArea(state,id);break;
    case 'toggleHud':state.settings.hud=!state.settings.hud;res=result(true,'');break;
    case 'setting':if(id==='volume')state.settings.volume=Math.max(0,Math.min(100,Math.round(count)));if(id==='hudWidth')state.settings.hudWidth=Math.max(220,Math.min(360,Math.round(count)));res=result(true,'');break;
    case 'music':state.settings.music=!state.settings.music;res=result(true,'背景音乐'+(state.settings.music?'已开启':'已关闭'));break;
    case 'eat':res=eat(state,id);break;
    case 'cook':res=cook(state,id);break;
    case 'buy':res=buy(state,id,count);break;
    case 'sell':res=sell(state,id,count);break;
    case 'ship':res=sell(state,id,count,true);break;
    case 'deposit':res=chestTransfer(state,id,count,true);break;
    case 'withdraw':res=chestTransfer(state,id,count,false);break;
    case 'upgrade':res=upgrade(state,id as keyof GameStateV2['upgrades']);break;
    case 'order':res=submitOrder(state,id);break;
    case 'unlockOutfit':res=unlockAppearance(state,'outfits',Number(id));break;
    case 'unlockHat':res=unlockAppearance(state,'hats',Number(id));break;
    case 'wear':if(ui.draft){res=setAppearance(state,ui.draft);if(res.ok)ui.close()}break;
    case 'assist':state.settings.fishingAssist=!state.settings.fishingAssist;res=result(true,'钓鱼辅助'+(state.settings.fishingAssist?'已开启':'已关闭'));break;
    case 'sound':state.settings.sound=!state.settings.sound;res=result(true,'音效'+(state.settings.sound?'已开启':'已关闭'));break;
    case 'sleep':if(nearby(state)?.id==='sleep'){ui.forceClose();keys.clear();sleepPending=true;transitionTime=.65;$('transition').dataset.phase='dusk';$('transition').hidden=false;$('transition').querySelector('h2')!.textContent='晚安，溪谷';$('transition').querySelector('p')!.textContent='收好一天的忙碌，让星光陪你入梦。';}break;
    case 'acceptCatch':res=acceptCatch(state);if(res.ok)ui.forceClose();break;
    case 'replaceCatch':res=acceptCatch(state,Number(id));if(res.ok)ui.forceClose();break;
    case 'releaseCatch':state.pendingCatch=null;ui.forceClose();res=result(true,'鱼儿游回了湖里。');break;
    case 'export':{
      const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='溪谷农场-第'+state.calendar.day+'天.json';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);ui.showToast('已导出农场存档。');return;
    }
    case 'importFile':$<HTMLInputElement>('importFile').click();return;
    case 'confirmImport':if(ui.importDraft){save();state=ui.importDraft;saveBlocked=false;ui.forceClose();res=result(true,'农场存档已导入');if(state.pendingCatch)ui.open('catch')}break;
    case 'reset':save();state=initialState();saveBlocked=false;fishing=null;keys.clear();ui.forceClose();res=result(true,'一座新的农场，等待你书写。');break;
  }
  if(res){report(res);if(ui.panel)ui.renderPanel()}
}
$<HTMLInputElement>('importFile').addEventListener('change',async event=>{
  const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
  if(file.size>2_000_000){ui.showToast('存档文件过大，请选择 2 MB 以内的 JSON。');input.value='';return}
  const parsed=parseSave(await file.text());input.value='';
  if(!parsed){ui.showToast('存档格式或内容无效，当前进度未改变。');return}
  ui.importDraft=parsed;ui.open('import');
});
const directions:Record<string,Direction>={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right'};
function move(direction:Direction){work.cancel();const res=step(state,direction);if(res.dayEnded||res.message)report(res);ui.hud();moveTimer=.15}
window.addEventListener('keydown',event=>{
  const key=event.key.toLowerCase();
  if(placement){
    if(['escape','enter',' ',...Object.keys(directions)].includes(key))event.preventDefault();
    if(key==='escape')cancelPlacement();else if(key==='enter'&&!event.repeat)handleAction('placeConfirm','','');
    else if(directions[key]){const [dx,dy]={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[directions[key]];placement.x=Math.max(1,Math.min(30,placement.x+dx));placement.y=Math.max(1,Math.min(18,placement.y+dy));previewPlacement();}
    return;
  }
  if(key===' '||key==='e')recast.input(key,true);
  if(key===' ')work.input('key',true);
  if(key==='escape'){
    event.preventDefault();work.cancel();keys.clear();
    if(fishing){handleAction('cancelFishing','','');return}
    if(ui.panel)ui.close();else if(!transitionTime)ui.open('settings');return;
  }
  if(key==='b'&&ui.panel==='bag'&&!(event.target instanceof HTMLInputElement)){event.preventDefault();if(!event.repeat)ui.close();keys.clear();return;}
  if(ui.panel||transitionTime)return;
  if([' ','e','b','m','c','j',...Object.keys(directions),...TOOLS.map(t=>t.key)].includes(key))event.preventDefault();
  if(fishing){if(key===' '&&!event.repeat){heldFish=true;reel(fishing)}return}
  if(event.repeat)return;
  if(directions[key]){keys.add(key);move(directions[key]);return}
  const tool=TOOLS.find(t=>t.key===key);if(tool){work.cancel();state.selectedTool=tool.id;ui.hud();save();return}
  if(key==='e'){interact();return}
  if(key===' '){const target=targetTile(state);useAt(target.x,target.y);return}
  const panels:Record<string,string>={b:'bag',m:'map',c:'catalog',j:'journal'};if(panels[key]){work.cancel();ui.open(panels[key]);keys.clear()}
});
window.addEventListener('keyup',event=>{const key=event.key.toLowerCase();keys.delete(key);recast.input(key,false);if(key===' '){heldFish=false;work.input('key',false)}});
window.addEventListener('blur',()=>{focused=false;keys.clear();heldFish=false;recast.releaseAll();work.releaseAll();save();lastTime=performance.now();accumulator=0});
window.addEventListener('focus',()=>{focused=true;lastTime=performance.now();accumulator=0});
document.addEventListener('visibilitychange',()=>{keys.clear();heldFish=false;recast.releaseAll();work.releaseAll();save();lastTime=performance.now();accumulator=0});
window.addEventListener('pagehide',save);
document.addEventListener('pointerdown',event=>{if(event.button===0)recast.input('pointer',true);if(fishing&&event.button===0&&(event.target as Element).closest('#fishingPanel,#game')){heldFish=true;reel(fishing)}});
window.addEventListener('pointerup',()=>{heldFish=false;recast.input('pointer',false);work.input('pointer',false)});
window.addEventListener('pointercancel',()=>{work.releaseAll();work.cancel();heldFish=false;recast.releaseAll()});
let suppressWorkClick=false;
canvas.addEventListener('pointerdown',event=>{
  suppressWorkClick=false;if(event.button!==0||ui.panel||transitionTime||fishing||placement)return;
  const rect=canvas.getBoundingClientRect(),x=Math.floor((event.clientX-rect.left)/rect.width*32),y=Math.floor((event.clientY-rect.top)/rect.height*20);
  if(state.selectedTool!=='rod'&&workTarget(state,x,y)){suppressWorkClick=true;work.input('pointer',true);beginWork(x,y);canvas.focus({preventScroll:true});}
});
canvas.addEventListener('click',event=>{
  if(suppressWorkClick){suppressWorkClick=false;return;}
  if(fishing)return;
  const rect=canvas.getBoundingClientRect(),x=Math.floor((event.clientX-rect.left)/rect.width*32),y=Math.floor((event.clientY-rect.top)/rect.height*20);
  if(placement){placement.x=x;placement.y=y;previewPlacement();return;}
  useAt(x,y);canvas.focus({preventScroll:true});
});
function simulate(dt:number){
  recast.tick(dt);
  if(transitionTime>0){transitionTime=Math.max(0,transitionTime-dt);if(!sleepPending)$('transition').dataset.phase=transitionTime<.7?'dawn':'night';if(!transitionTime){if(sleepPending){sleepPending=false;report(dayEnd(state));}else $('transition').hidden=true;}return}
  if(ui.panel||placement)return;
  const timeResult=advanceTime(state,dt);if(timeResult){report(timeResult);if(timeResult.dayEnded)return}
  const impact=work.tick(state,dt);
  if(impact){if(impact.result.ok){renderer.workImpact(impact);tone(impact.target.tool==='axe'?'wood':'stone');}report({...impact.result,effect:undefined},impact.target.x,impact.target.y);}
  if(fishing){
    const previousStage=fishing.stage;
    tickFishing(fishing,dt,heldFish);
    if(previousStage!=='bite'&&fishing.stage==='bite')tone('harvest');
    if(fishing.stage==='won'){recast.finish();state.pendingCatch=fishing.fish;fishing=null;heldFish=false;const res=acceptCatch(state);if(!res.ok){save();ui.open('catch')}else report(res)}
    else if(fishing.stage==='lost'){recast.finish();fishing=null;heldFish=false;ui.showToast('鱼游走了，收好线再试一次。');save()}
  }else{
    moveTimer-=dt;const direction=Array.from(keys).at(-1);if(direction&&moveTimer<=0)move(directions[direction]);
  }
}
function frame(now:number){
  const dt=Math.min(.1,Math.max(0,(now-lastTime)/1000));lastTime=now;
  const paused=document.hidden||!focused;$('pauseBadge').hidden=!paused||!!ui.panel||transitionTime>0;
  music.update(state,!paused);
  if(!paused){accumulator+=dt;while(accumulator>=1/60){simulate(1/60);accumulator-=1/60}saveElapsed+=dt;if(saveElapsed>=15)save()}
  else accumulator=0;
  renderer.draw(state,paused?0:dt,fishing,undefined,work.session);
  if(placement)drawPlacement(canvas.getContext('2d')!,placement);
  ui.fishing(fishing);ui.hud();requestAnimationFrame(frame);
}
ui.hud(true);ui.showToast(loaded.message);
if(saveBlocked)$('saveStatus').textContent='存档待处理 · 打开设置';
if(state.pendingCatch)ui.open('catch');
requestAnimationFrame(frame);
