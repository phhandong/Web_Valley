import { CROPS,FISH,FORAGE,HAIRS,HATS,ITEMS,OUTFITS,OUTFIT_COLORS,RECIPES,SEASON_NAMES,SKINS,TOOLS,UPGRADE_COSTS,WEATHER_NAMES } from './content';
import { clockText,seasonDay,seasonOf,shopOpen,targetTile,yearOf } from './engine';
import { quantity } from './inventory';
import { SCENES,farmDimensions,nearby,plotIndex,isUnlockedPlot } from './world';
import { drawPerson,iconSVG } from './art';
import { AREAS,LEVEL_XP,areaOpen,levelOf } from './progression';
import type { Appearance,GameStateV2,Inventory } from './types';
import type { FishingSession } from './fishing';
import { FISHING_DIFFICULTIES } from './fishing';
import { hudIcon } from './hud-icons';
import { resourceAt,treeStage,objectKey } from './world';
import { fishingPanelPosition,hudOnLeft } from './overlays';

export const layout=`
<div class="app-frame">
  <header class="masthead"><a class="brand" href="#" aria-label="溪谷小农场"><span class="brand-art">${iconSVG('crop','#e9b77f')}</span><span><small>CREEKSIDE · VALLEY LIFE</small><strong>溪谷小农场<span>四季生活</span></strong></span></a><nav aria-label="农场菜单"><button data-action="open" data-id="bag">背包 <kbd>B</kbd></button><button data-action="open" data-id="map">地图 <kbd>M</kbd></button><button data-action="open" data-id="catalog">图鉴 <kbd>C</kbd></button><button data-action="open" data-id="settings" class="settings-button" aria-label="设置与帮助">☷</button></nav></header>
  <div class="game-layout">
    <section class="world-section">
      <div class="world-topline"><div><span class="live-dot"></span><b id="sceneName">溪谷农场</b><small id="sceneTagline"></small></div><span id="saveStatus" class="save-status">本地自动保存</span></div>
      <div class="canvas-wrap"><canvas id="game" aria-label="溪谷农场游戏画面" tabindex="0"></canvas><div class="frame-corners" aria-hidden="true"></div><div class="scene-caption"><small id="seasonCaption"></small></div><div id="worldPrompt" class="world-prompt" aria-hidden="true"></div><div id="toast" class="toast" role="status" aria-live="polite" hidden></div><div id="transition" class="transition" hidden><small>灯火可亲，明天见</small><h2></h2><p></p></div><div id="pauseBadge" class="pause-badge" hidden>已暂停 · 回来时继续</div>
        <section id="fishingPanel" class="fishing-panel" hidden aria-label="钓鱼小游戏"><div class="fishing-title"><b>湖上的片刻</b><button data-action="cancelFishing" aria-label="收起鱼竿">×</button></div><p id="fishStatus"></p><div id="fishingTrack" class="fishing-track"><div id="floatZone" class="float-zone"></div><div id="fishMarker" class="fish-marker">${iconSVG('fish','#f1ca82')}</div></div><div class="catch-progress"><i id="catchProgress"></i></div><button data-action="reel" id="reelButton">提竿 / 按住上升</button><small>按住空格或鼠标上升，松开下降</small></section>
      </div>
      <div class="toolbar-row"><div class="toolbar" id="toolbar" aria-label="工具栏">${TOOLS.map(t=>`<button data-action="tool" data-id="${t.id}" title="${t.key} · ${t.name}" aria-label="${t.name}"><kbd>${t.key}</kbd>${iconSVG(t.mark)}<small>${t.name}</small></button>`).join('')}</div><button class="seed-picker" data-action="open" data-id="bag"><span id="selectedSeedIcon">${iconSVG('seed')}</span><span><small>当前种子</small><b id="selectedSeedName">萝卜</b></span><strong id="seedCount">5</strong></button></div>
      <footer class="world-footer"><span><kbd>WASD</kbd> 移动　<kbd>空格</kbd> 使用　<kbd>E</kbd> 互动</span><span>让日子，慢一点。<i>✧</i></span></footer>
    </section>
    <aside class="almanac-dock" aria-label="农场状态">
      <div class="almanac-controls"><span id="yearText"></span><button data-action="resizeHud" data-value="-20" aria-label="缩小状态框" title="缩小">−</button><button data-action="resizeHud" data-value="20" aria-label="放大状态框" title="放大">＋</button><button id="hudToggle" data-action="toggleHud" aria-controls="statusDetails" aria-expanded="false" title="展开状态详情">▾</button></div>
      <section class="almanac-frame">
        <div class="almanac-face">
          <div id="dayDial" class="day-dial" role="img" aria-label="昼夜时段"><span class="dial-moon">${hudIcon('moon')}</span><span class="dial-sun">${hudIcon('sun')}</span><i id="sunPosition" class="dial-hand"></i><span class="dial-pivot"></span></div>
          <div class="almanac-date"><b id="seasonName">秋月</b><strong id="dayNumber">01</strong><span>日</span></div>
          <div class="almanac-legends"><span class="weather-legend"><i id="weatherSymbol">${hudIcon('sun')}</i><b id="weatherName">晴</b></span><span class="season-legend" id="seasonSymbol" title="当前季节">${hudIcon('leaf')}</span><button data-action="open" data-id="journal" title="等级与成长手记">${hudIcon('star')}<b id="levelText">1</b></button></div>
          <div class="almanac-clock"><strong id="clock">06:00</strong><span id="dayPeriod">清晨</span></div>
        </div>
        <div class="almanac-gold" title="当前金币">${hudIcon('coin')}<strong id="gold">50</strong><span>G</span></div>
        <div id="statusDetails" class="almanac-details" hidden><div class="almanac-pending"><span>明日入账</span><b id="pendingGold">0 G</b></div></div>
        <div class="almanac-vitals">${[['health','生命'],['stamina','体力'],['hunger','饱食']].map(([id,label])=>`<div class="vital ${id}" title="${label}"><span class="vital-icon">${hudIcon(id)}</span><span class="vital-name">${label}</span><div><i id="${id}Bar"></i></div><b id="${id}Value">100</b></div>`).join('')}</div>
        <button class="almanac-journal" data-action="open" data-id="journal">农场手记 <kbd>J</kbd> ↗</button>
      </section>
    </aside>
  </div>
</div>
<div id="modalBackdrop" class="modal-backdrop" hidden><section id="modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><button data-action="close" class="close-button" aria-label="关闭窗口">×</button><div id="modalContent"></div></section></div>
<input type="file" id="importFile" accept=".json,application/json" hidden />`;

const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const itemIcon=(id:string)=>iconSVG(ITEMS[id]?.kind??'crop',ITEMS[id]?.color);
const button=(text:string,action:string,id='',value='',disabled=false)=>`<button class="action-button" data-action="${action}" data-id="${id}" data-value="${value}" ${disabled?'disabled':''}>${text}</button>`;
export class UI {
  panel:string|null=null;
  selectedItem=''; category='all'; draft:Appearance|null=null; importDraft:GameStateV2|null=null;
  private toastTimer=0; private hudSignature='';private previousFocus:HTMLElement|null=null;
  constructor(private state:()=>GameStateV2,private onAction:(action:string,id:string,value:string)=>void){
    document.querySelector('#app')!.innerHTML=layout;
    // Keep notifications outside the canvas stacking context and its clipping area.
    document.querySelector('#app')!.append($('toast'));
    const mapFrame=document.querySelector('.canvas-wrap')!;
    mapFrame.append(document.querySelector('.almanac-dock')!,document.querySelector('.toolbar-row')!);
    document.querySelector('.toolbar-row')!.insertAdjacentHTML('beforeend',`<button class="bag-toggle" data-action="open" data-id="bag" aria-label="打开背包" aria-controls="modal" aria-expanded="false">${iconSVG('bag')}<span>背包 <kbd>B</kbd></span><small id="bagCapacity">2 / 24</small></button>`);
    new ResizeObserver(()=>this.hud(true)).observe(mapFrame);
    $('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))this.onAction('close','','')});
    document.addEventListener('change',e=>{const el=e.target as HTMLInputElement;if(el.dataset.setting)this.onAction('setting',el.dataset.setting,el.value)});
    document.addEventListener('input',e=>{if((e.target as HTMLElement).id==='quantityInput')this.updateTradeQuote();});
    document.addEventListener('click',event=>{
      const element=(event.target as Element).closest<HTMLButtonElement>('[data-action]');if(!element||element.disabled)return;
      const action=element.dataset.action!,id=element.dataset.id??'',value=element.dataset.value??'';
      if(action==='selectItem'){this.selectedItem=id;this.renderPanel();return}
      if(action==='category'){this.category=id;this.selectedItem='';this.renderPanel();return}
      if(action==='appearance'){if(this.draft)(this.draft as any)[id]=Number(value);this.renderPanel();return}
      this.onAction(action,id,value==='quantity'?String(($<HTMLInputElement>('quantityInput')?.value??1)):value);
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Tab'&&this.panel){const nodes=Array.from($('modal').querySelectorAll<HTMLElement>('button:not(:disabled),input,select,a[href]')).filter(el=>el.getClientRects().length);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
    });
    $('modalBackdrop').addEventListener('animationend',e=>{if(e.animationName==='modal-out'){$('modalBackdrop').classList.remove('closing');$('modalBackdrop').hidden=true;}});
  }
  showToast(message:string){if(!message)return;clearTimeout(this.toastTimer);const t=$('toast');t.textContent=message;t.classList.remove('leaving');t.hidden=false;this.toastTimer=window.setTimeout(()=>{t.classList.add('leaving');this.toastTimer=window.setTimeout(()=>{t.hidden=true;t.classList.remove('leaving')},200)},3000);}
  open(panel:string){if(!this.panel)this.previousFocus=document.activeElement as HTMLElement;this.panel=panel;this.category=panel==='grocer'?'buy':'all';this.selectedItem='';if(panel==='wardrobe')this.draft={...this.state().player.appearance};const b=$('modalBackdrop');b.classList.remove('closing');b.hidden=false;this.renderPanel();$('modal').querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();}
  close(){if(!this.panel||this.panel==='catch')return;this.forceClose();this.previousFocus?.focus();}
  forceClose(){this.panel=null;this.draft=null;const b=$('modalBackdrop');b.classList.remove('closing');b.hidden=true;document.querySelector('.bag-toggle')?.setAttribute('aria-expanded','false');}
  hud(force=false){
    const s=this.state(),p=s.player,season=seasonOf(s.calendar.day),v=p.vitals;
    const signature=JSON.stringify([p.scene,p.x,p.y,p.direction,s.calendar.day,Math.floor(s.calendar.minute/10),s.calendar.weather,s.gold,s.shipping,s.legacyPending,v,s.selectedTool,s.selectedSeed,s.inventory.slots,s.stats,s.settings,s.progression]);
    if(!force&&signature===this.hudSignature)return;this.hudSignature=signature;
    const app=document.getElementById('app')!;app.dataset.scene=p.scene;app.dataset.x=String(p.x);app.dataset.y=String(p.y);app.dataset.minute=String(Math.floor(s.calendar.minute));
    app.classList.toggle('hud-collapsed',!s.settings.hud);app.style.setProperty('--hud-width',`${s.settings.hudWidth}px`);app.style.setProperty('--hud-scale',String(s.settings.hudWidth/260));
    $('hudToggle').textContent=s.settings.hud?'▴':'▾';$('hudToggle').setAttribute('aria-expanded',String(s.settings.hud));$('hudToggle').setAttribute('aria-label',s.settings.hud?'收起状态详情':'展开状态详情');$('statusDetails').hidden=!s.settings.hud;
    document.querySelectorAll<HTMLButtonElement>('[data-action="resizeHud"]').forEach(b=>b.disabled=Number(b.dataset.value)<0?s.settings.hudWidth<=220:s.settings.hudWidth>=360);
    const mapFrame=document.querySelector<HTMLElement>('.canvas-wrap')!,dock=document.querySelector<HTMLElement>('.almanac-dock')!;
    mapFrame.classList.toggle('toolbar-at-top',p.y>=16);
    // Keep the player and nearby terrain accessible when walking beneath an overlay.
    mapFrame.classList.toggle('hud-at-left',hudOnLeft(mapFrame.classList.contains('hud-at-left'),{x:(p.x+.5)/32*mapFrame.clientWidth,y:(p.y+.5)/20*mapFrame.clientHeight},{width:mapFrame.clientWidth,height:mapFrame.clientHeight},{width:dock.offsetWidth,height:dock.offsetHeight}));
    $('levelText').textContent=String(levelOf(s));$('levelText').parentElement!.setAttribute('aria-label',`等级 ${levelOf(s)}，打开成长手记`);
    $('sceneName').textContent=SCENES[p.scene].name;$('sceneTagline').textContent=SCENES[p.scene].subtitle;$('yearText').textContent=`第 ${yearOf(s.calendar.day)} 年`;
    const night=s.calendar.minute>=1080;
    $('dayNumber').textContent=String(seasonDay(s.calendar.day)).padStart(2,'0');$('seasonName').textContent=`${SEASON_NAMES[season]}月`;$('weatherName').textContent=WEATHER_NAMES[s.calendar.weather];$('weatherSymbol').innerHTML=hudIcon(s.calendar.weather==='sun'?(night?'moon':'sun'):s.calendar.weather);
    $('seasonSymbol').innerHTML=hudIcon(season==='winter'?'snow':season==='summer'?'sun':'leaf');$('seasonSymbol').title=`当前季节：${SEASON_NAMES[season]}`;
    $('clock').textContent=clockText(s.calendar.minute);$('dayPeriod').textContent=s.calendar.minute<600?'清晨':s.calendar.minute<1020?'白昼':s.calendar.minute<1080?'黄昏':s.calendar.minute<1440?'夜晚':'深夜';$('dayDial').classList.toggle('night',night);$('dayDial').setAttribute('aria-label',`昼夜时段：${$('dayPeriod').textContent}`);$('sunPosition').style.transform=`rotate(${-150+(s.calendar.minute-360)/1200*300}deg)`;
    $('gold').textContent=s.gold.toLocaleString();$('gold').style.fontSize=`${s.gold>=1e9?'11':s.gold>=1e6?'13':'18'}px`;$('pendingGold').textContent=`${s.shipping.reduce((n,i)=>n+ITEMS[i.id].sell*i.count,0)+s.legacyPending} G`;
    $('seasonCaption').textContent=`${SEASON_NAMES[season]}月 ${seasonDay(s.calendar.day)} 日 · ${s.calendar.weather==='rain'?'雨落在泥土上':s.calendar.weather==='snow'?'雪落无声':s.calendar.minute>=1080?'晚风与灯火':'今日宜慢生活'}`;
    for(const k of ['health','stamina','hunger'] as const){$(`${k}Value`).textContent=String(Math.ceil(v[k]));$(`${k}Bar`).style.width=`${v[k]}%`;$(`${k}Bar`).closest('.vital')?.classList.toggle('low',v[k]<20);}
    document.querySelectorAll<HTMLElement>('[data-action="tool"]').forEach(b=>{b.classList.toggle('active',b.dataset.id===s.selectedTool);b.setAttribute('aria-pressed',String(b.dataset.id===s.selectedTool))});
    $('selectedSeedName').textContent=ITEMS[`seed_${s.selectedSeed}`].name;$('selectedSeedIcon').innerHTML=itemIcon(`seed_${s.selectedSeed}`);$('seedCount').textContent=String(quantity(s.inventory,`seed_${s.selectedSeed}`));
    $('bagCapacity').textContent=`${s.inventory.slots.length} / ${s.inventory.capacity}`;
    document.querySelector('.bag-toggle')!.classList.toggle('bag-full',s.inventory.slots.length>=s.inventory.capacity);
    const near=nearby(s);const prompt=$('worldPrompt');prompt.classList.toggle('visible',!!near);prompt.setAttribute('aria-hidden',String(!near));if(near)prompt.innerHTML=`<kbd>E</kbd> ${esc(near.label)}`;
    const target=targetTile(s);
    const resource=resourceAt(s,target.x,target.y);
    if(!near&&resource){prompt.classList.add('visible');prompt.setAttribute('aria-hidden','false');prompt.innerHTML=resource.kind==='tree'?'<kbd>6</kbd> 斧头 · <kbd>空格</kbd> 砍树，获得木材':'<kbd>7</kbd> 石镐 · <kbd>空格</kbd> 挖石，获得石料';}
    if(!near&&resource?.kind==='tree'&&treeStage(s,p.scene,resource)!=='mature')prompt.textContent=`${treeStage(s,p.scene,resource)==='sapling'?'树苗':'小树'} · 还需 ${6-s.ecology.trees[objectKey(p.scene,resource)]} 天长成大树`;
    if(!near&&p.scene==='farm'&&isUnlockedPlot(s,target.x,target.y)&&s.weeds.includes(plotIndex(target.x,target.y))){prompt.classList.add('visible');prompt.setAttribute('aria-hidden','false');prompt.innerHTML='<kbd>1</kbd> 锄头 · <kbd>空格</kbd> 除草，再松土播种';}
  }
  renderPanel(){
    document.querySelector('.bag-toggle')?.setAttribute('aria-expanded',String(this.panel==='bag'));
    if(!this.panel)return;const s=this.state(),panel=this.panel,content=$('modalContent');const scroll=content.scrollTop;
    const titles:Record<string,[string,string]>={bag:['随身行囊','留一点食物给自己，也留一点空间给惊喜。'],chest:['小屋储物箱','把四季的收获，妥善收藏。'],shipping:['今日出货','亲自选择要出售的物品，清晨统一结算。'],grocer:['阿禾的杂货铺','08:00 — 20:00 · 应季的种子，刚刚到货。'],fisher:['老舟的渔具铺','08:00 — 20:00 · 好鱼竿，也需要一点耐心。'],smith:['石叔的工坊','08:00 — 20:00 · 让每一份耕耘，更轻松一些。'],kitchen:['小屋厨房','一顿热饭，是给自己的小小奖励。'],wardrobe:['我的衣柜','穿上喜欢的颜色，走进新的日子。'],map:['溪谷漫游','走到路牌旁按 E，下一段风景就在前面。'],journal:['农场手记','没有终点的生活，也有值得记住的进步。'],catalog:['四季收藏册','发现过的东西，都会在这里留下名字。'],settings:['设置与帮助','休息一下。打开面板时，溪谷的时间也会停下来。'],sleep:['晚安，溪谷','浇过水的作物会继续生长，出货收入将在清晨到账。'],catch:['一份湖上的礼物','背包满了。请选择接下来如何处理这条鱼。'],reset:['重新开始农场？','当前农场会替换为新的进度，上一份有效记录仍保留为备份。'],import:['导入这份农场？','当前进度先保存为备份，再打开所选记录。']};
    const [title,subtitle]=titles[panel]??['溪谷',''];
    let html=`<div class="modal-eyebrow">CREEKSIDE JOURNAL</div><h2 id="modalTitle">${title}</h2><p class="modal-subtitle">${subtitle}</p>`;
    if(['bag','chest','shipping','grocer','fisher'].includes(panel))html+=this.inventoryPanel(s,panel);
    if(panel==='smith'||panel==='fisher'){
      html+=`<div class="section-title">${panel==='fisher'?'鱼竿升级':'让农场长大一点'}</div><div class="card-grid">${(panel==='fisher'?['rod']:['tools','bag','farm']).map(type=>{const k=type as keyof typeof UPGRADE_COSTS,cost=UPGRADE_COSTS[k][s.upgrades[k]],names={tools:'劳作工具',bag:'背包扩容',farm:'耕地扩建',rod:'鱼竿'};return `<article class="content-card"><h3>${names[k]} · ${s.upgrades[k]+1} 阶</h3><p>${k==='farm'?`当前 ${farmDimensions(s.upgrades.farm).join(' × ')} 格` : k==='bag'?`当前 ${s.inventory.capacity} 格`:k==='rod'?'浮标更宽，更容易留住鱼':'采集产量提高，耗力逐渐减少'}</p>${cost?`<p>${cost.gold} G　木材 ${cost.wood}　石料 ${cost.stone}</p>${button('升级','upgrade',type,'',!shopOpen(s))}`:'<span class="completed">已升至最高阶</span>'}</article>`}).join('')}</div>`;
    }
    if(panel==='kitchen')html+=`<div class="card-grid recipes">${RECIPES.map(r=>`<article class="content-card"><div class="card-icon">${itemIcon(r.id)}</div><h3>${r.name}</h3><p>${r.ingredients.map(i=>`${ITEMS[i.id].name} ${quantity(s.inventory,i.id)}/${i.count}`).join(' · ')}</p><small>生命 +${r.food.health}　体力 +${r.food.stamina}　饱食 +${r.food.hunger}</small>${button('做一份','cook',r.id,'',!r.ingredients.every(i=>quantity(s.inventory,i.id)>=i.count))}</article>`).join('')}</div>`;
    if(panel==='wardrobe')html+=this.wardrobe(s);
    if(panel==='map')html+=`<div class="map-diagram"><div class="map-place ${s.player.scene==='home'?'current':''}">⌂ 橡果小屋</div><span class="map-line">│</span><div class="map-route">${['forest','farm','town','lake'].map((id,i)=>`${i?'<span>↔</span>':''}<div class="map-place ${s.player.scene===id?'current':''}">${SCENES[id as keyof typeof SCENES].name}</div>`).join('')}</div><p>森林 ↔ 萤火秘林 · 森林 ↔ 回声石谷 ↔ 云杉山脊</p><p>湖畔 ↔ 潮声海湾</p></div><div class="card-grid">${Object.values(SCENES).map(scene=>`<article class="content-card"><h3>${scene.name}${s.player.scene===scene.id?' · 你在这里':''}</h3><p>${scene.subtitle}</p><small>${scene.exits.map(e=>e.label).join('　')}</small></article>`).join('')}</div>`;
    if(panel==='journal')html+=`<div class="stats-grid">${[['收获',s.stats.harvested],['垂钓',s.stats.caught],['烹饪',s.stats.cooked],['订单',s.stats.orders],['声望',s.stats.reputation],['累计收入',`${s.stats.revenue} G`]].map(([k,v])=>`<div><strong>${v}</strong><small>${k}</small></div>`).join('')}</div><div class="section-title">值得期待的小目标</div><div class="milestones">${[['收获 20 份作物','枫叶斗篷',s.stats.harvested>=20],['钓到 10 条鱼','湖蓝钓装',s.stats.caught>=10],['制作 8 份料理','花环',s.stats.cooked>=8],['完成 10 份订单','星夜长衫',s.stats.orders>=10],['收集 12 种鱼','星星帽',FISH.filter(f=>s.discoveries[f.id]).length>=12]].map(([a,b,done])=>`<p class="${done?'completed':''}">${done?'✓':'○'} ${a}<span>${b}</span></p>`).join('')}</div><p class="info-note">完成目标后仍可继续游玩。每日订单在小镇公告板提交，换季会带来新的作物与鱼群。</p>`;
    if(panel==='orders')html=`<div class="modal-eyebrow">NEIGHBOURHOOD REQUESTS</div><h2 id="modalTitle">邻里的小委托</h2><p class="modal-subtitle">今天的三张便笺。每天清晨更新，交付获得金币与声望。</p><div class="card-grid">${s.orders.map(o=>`<article class="content-card"><div class="card-icon">${itemIcon(o.item)}</div><h3>${ITEMS[o.item].name} × ${o.count}</h3><p>背包中 ${quantity(s.inventory,o.item)} 份</p><p>报酬 ${o.reward} G · 声望 +10</p>${button(o.done?'已完成':'交付物品','order',o.id,'',o.done||quantity(s.inventory,o.item)<o.count)}</article>`).join('')}</div>`;
    if(panel==='catalog'){
      const ids=[...CROPS.map(c=>c.id),...FISH.map(f=>f.id),...FORAGE.map(f=>f.id),...RECIPES.map(r=>r.id)];
      html+=`<p class="collection-count">已发现 ${ids.filter(id=>s.discoveries[id]).length} / ${ids.length}</p><div class="card-grid collection">${ids.map(id=>{const found=s.discoveries[id];return `<article class="content-card ${found?'found':'undiscovered'}"><div class="card-icon">${itemIcon(id)}</div><h3>${ITEMS[id].name}</h3><p>${ITEMS[id].description}</p><small>${found?`首次：第 ${found.firstDay} 天 · 累计 ${found.count}`:'尚未发现 · 期待相遇'}</small></article>`}).join('')}</div>`;
    }
    if(panel==='settings')html+=`<div class="settings-row"><div><h3>钓鱼辅助</h3><small>扩大浮标范围、放慢鱼的移动；奖励不变。</small></div>${button(s.settings.fishingAssist?'已开启':'已关闭','assist')}</div><div class="settings-row"><div><h3>自然音效</h3><small>水滴、收获与轻柔提示音。</small></div>${button(s.settings.sound?'已开启':'已关闭','sound')}</div><div class="key-list"><p><kbd>WASD / 方向键</kbd> 连续移动</p><p><kbd>1 — 7</kbd> 选择工具</p><p><kbd>空格 / 点击</kbd> 操作高亮或相邻格</p><p><kbd>E</kbd> 进入建筑／交谈／采集</p><p><kbd>B / M / C / J</kbd> 背包／地图／图鉴／手记</p><p><kbd>Esc</kbd> 关闭／暂停</p></div><p class="info-note">站在农田中时优先操作脚下。低饱食度会增加体力消耗；农场小屋前每天有免费莓果。跨季作物休眠、不枯死。商店营业时间为 08:00–20:00。</p><div class="section-title">保存你的农场</div><p class="info-note">每 15 秒及重要操作后自动保存。不同浏览器或端口不共享存档，可用导出／导入搬移。</p><div class="button-row">${button('导出存档','export')}${button('导入存档','importFile')}${button('重新开始','open','reset')}</div><a class="attribution" href="https://deerflow.tech" target="_blank" rel="noreferrer">Created By Deerflow</a>`;
    if(panel==='sleep')html+=`<div class="sleep-illustration">☾ <span>明日，又是崭新的一天。</span></div><p class="info-note">睡眠恢复全部体力、30 点生命，饱食度下降 10。雪天不自动浇水，雨天会浇灌露天作物。</p><div class="button-row">${button('睡到明天','sleep')}${button('再忙一会儿','close')}</div>`;
    if(panel==='catch')html+=`<div class="catch-summary">${itemIcon(s.pendingCatch!)}<h3>${ITEMS[s.pendingCatch!]?.name}</h3></div>${button('尝试放入背包','acceptCatch')}<div class="section-title">替换一组物品（被替换物品将放弃）</div><div class="replace-list">${s.inventory.slots.map((slot,i)=>button(`${ITEMS[slot.id].name} × ${slot.count}`,'replaceCatch',String(i))).join('')}</div>${button('将鱼放回湖里','releaseCatch')}`;
    if(panel==='reset')html+=`<p class="info-note">建议先导出当前存档留念。确认后从秋月第 1 天重新开始。</p><div class="button-row">${button('先导出存档','export')}${button('确认新农场','reset')}${button('保留当前农场','close')}</div>`;
    if(panel==='import'&&this.importDraft)html+=`<p class="info-note">第 ${this.importDraft.calendar.day} 天 · ${this.importDraft.gold} G · ${SCENES[this.importDraft.player.scene].name}</p><div class="button-row">${button('确认导入','confirmImport')}${button('取消','close')}</div>`;
    if(panel==='regions')html=`<div class="modal-eyebrow">BEYOND THE TRAIL</div><h2 id="modalTitle">探索与通行</h2><p class="modal-subtitle">收获、采集、钓鱼、料理和寻迹都积累经验。等级达标免费开放，也可提前购买永久通行。</p><p class="info-note">当前 Lv.${levelOf(s)} · 累计经验 ${s.progression.xp}${LEVEL_XP[levelOf(s)]!==undefined?` · 下一级 ${LEVEL_XP[levelOf(s)]}`:' · 已达最高等级'}</p><div class="card-grid">${AREAS.map(a=>`<article class="content-card"><h3>${a.name}</h3><p>${a.description}</p><p>Lv.${a.level} 免费开放 / ${a.price} G 提前购买</p>${areaOpen(s,a.id)?'<span class="completed">已开放 · 入口旁按 E 进入</span>':button(`购买通行 · ${a.price} G`,'purchaseArea',a.id,'',s.gold<a.price||nearby(s)?.id!==a.id)}<small>入口：${a.id==='coast'?'湖畔南端':a.id==='ridge'?'石谷东侧':'森林东侧'} · 在路牌旁办理通行</small></article>`).join('')}</div>`;
    if(panel==='journal'||panel==='map')html+=`<div class="section-title">林间手记 · 给自然一点时间</div><p class="info-note">寻找北坡足印、东侧池塘羽毛、南径树刻，再开启宝箱（60 G、30 经验）。线索与清泉每天恢复；宝箱、狐狸交换和区域补给间隔 3 天。野生食材间隔 3 天，木石采集点间隔 5 天，农场免费莓果仍每天供应。</p><p class="info-note">今日线索 ${s.progression.forestEvents.filter(e=>e.startsWith('trail')).length}/3 · 宝箱${(s.ecology.eventReady.cache??0)>s.calendar.day?`恢复中 · 还需 ${s.ecology.eventReady.cache-s.calendar.day} 天`:'待探索'} · Lv.${levelOf(s)} / ${s.progression.xp} 经验</p>${button('查看区域解锁','open','regions')}`;
    if(panel==='settings')html+=`<div class="section-title">音乐与界面</div><div class="settings-row"><div><h3>溪谷背景音乐</h3><small>原创轻柔旋律；首次点击后播放，离开窗口自动暂停。</small></div>${button(s.settings.music?'已开启':'已关闭','music')}</div><label class="settings-row">音乐音量 <input aria-label="音乐音量" type="range" min="0" max="100" value="${s.settings.volume}" data-setting="volume" /></label><div class="settings-row"><div><h3>状态框详情</h3><small>展开显示待结算收入和手记入口。</small></div>${button(s.settings.hud?'收起':'展开','toggleHud')}</div><label class="settings-row">状态框大小 <input aria-label="状态框大小" type="range" min="220" max="360" step="10" value="${s.settings.hudWidth}" data-setting="hudWidth" /></label>`;
    const focusedAction=(document.activeElement as HTMLElement)?.dataset.action,focusedId=(document.activeElement as HTMLElement)?.dataset.id,focusedValue=(document.activeElement as HTMLElement)?.dataset.value,focusedSetting=(document.activeElement as HTMLElement)?.dataset.setting;
    if(panel==='journal')html+=`<div class="section-title">新手旅程</div><div class="milestones">${[['播种第一片希望',s.stats.planted,5],['收获第一篮蔬菜',s.stats.harvested,5],['钓起第一条鱼',s.stats.caught,1],['为自己做一顿饭',s.stats.cooked,1],['完成邻里的订单',s.stats.orders,1]].map(([name,n,total])=>`<p>${Number(n)>=Number(total)?'✓':'○'} ${name}<span>${Math.min(Number(n),Number(total))}/${total}</span></p>`).join('')}</div>`;
    content.innerHTML=html;content.scrollTop=scroll;
    if(focusedAction)Array.from(content.querySelectorAll<HTMLElement>('[data-action]')).find(el=>el.dataset.action===focusedAction&&el.dataset.id===focusedId&&el.dataset.value===focusedValue)?.focus({preventScroll:true});
    if(focusedSetting)Array.from(content.querySelectorAll<HTMLElement>('[data-setting]')).find(el=>el.dataset.setting===focusedSetting)?.focus({preventScroll:true});
    $('modal').classList.toggle('wide',['bag','chest','catalog','kitchen','wardrobe','map','grocer','fisher'].includes(panel));
    $('modal').dataset.panel=panel;
    this.updateTradeQuote();
    $('modal').querySelector<HTMLButtonElement>('.close-button')!.disabled=panel==='catch';
    if(panel==='wardrobe'&&this.draft){const canvas=$<HTMLCanvasElement>('characterPreview'),c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;c.fillStyle='#b9bba0';c.fillRect(0,0,128,144);for(let i=0;i<15;i++){c.fillStyle='#9fa78e';c.fillRect(i*11%128,i*17%144,2,4)}drawPerson(c,64,120,this.draft,'down',0,3)}
    if(panel==='wardrobe'&&this.draft)content.querySelectorAll<HTMLCanvasElement>('canvas[data-look]').forEach(canvas=>{
      const key=canvas.dataset.look as keyof Appearance,look={...this.draft!};look[key]=Number(canvas.dataset.lookValue);if(key==='hair')look.hat=-1;
      const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;drawPerson(c,24,47,look,'down',0,1.3);
    });
  }
  private inventoryPanel(s:GameStateV2,panel:string){
    const bag:Inventory=panel==='chest'&&this.category==='chest'?s.chest:s.inventory;
    const stock=panel==='grocer'&&this.category==='buy';
    let ids=stock?[...CROPS.filter(c=>c.seasons.includes(seasonOf(s.calendar.day))).map(c=>`seed_${c.id}`),'ration']:[...new Set(bag.slots.map(i=>i.id))];
    if(!['all','buy','chest'].includes(this.category))ids=ids.filter(id=>ITEMS[id].kind===this.category);
    if(!ids.includes(this.selectedItem))this.selectedItem=ids[0]??'';
    let tabs=panel==='chest'?[['all','随身背包'],['chest','储物箱']]:panel==='grocer'?[['buy','↓ 购买商品'],['all','↑ 出售物品']]:[['all','全部'],['seed','种子'],['crop','作物'],['forage','采集'],['fish','鱼类'],['meal','食物'],['material','材料']];
    const trading=['grocer','fisher'].includes(panel);
    let html=trading?`<div class="shop-wallet">${hudIcon('coin')}<span>可用余额<strong>${s.gold.toLocaleString()} <small>G</small></strong></span><p>${stock?'从货架买入 · 支出金币':'卖出背包物品 · 即时入账'}<small>${stock?'选择下方商品查看总价':'请留一些食材给自己'}</small></p></div>`:'';
    html+=`<div class="panel-tabs ${trading?'trade-tabs':''}" data-mode="${stock?'buy':'sell'}">${tabs.map(([id,name])=>`<button aria-pressed="${this.category===id}" class="${this.category===id?'active':''}" data-action="category" data-id="${id}">${name}</button>`).join('')}<small>${s.inventory.slots.length}/${s.inventory.capacity} 格</small></div>`;
    const entries=panel==='bag'?bag.slots.filter(slot=>ids.includes(slot.id)):ids.map(id=>({id,count:quantity(bag,id)}));
    if(panel==='bag')html+=`<div class="bag-summary"><span>已用 <b>${bag.slots.length} / ${bag.capacity}</b> 格 · 每格最多 99 份</span>${button('一键整理','sortBag')}<small>点击物品查看详情、选择种子或食用。<kbd>B</kbd> / <kbd>Esc</kbd> 关闭</small></div>`;
    html+=`<div class="inventory-layout ${panel==='bag'?'backpack-layout':''}"><div class="inventory-grid">${entries.map(({id,count})=>`<button class="item-slot ${this.selectedItem===id?'selected':''}" data-action="selectItem" data-id="${id}" aria-label="${ITEMS[id].name}">${itemIcon(id)}<b>${stock?`${ITEMS[id].buy} G`:count}</b><small>${ITEMS[id].name}</small></button>`).join('')}${Array.from({length:panel==='bag'?Math.max(0,bag.capacity-bag.slots.length):Math.max(0,12-entries.length)},()=>'<div class="empty-slot" aria-label="空背包格"></div>').join('')}</div>`;
    const id=this.selectedItem,item=ITEMS[id];
    if(item){html+=`<div class="item-detail"><div class="detail-icon">${itemIcon(id)}</div><h3>${item.name}</h3><p>${item.description}</p><p class="item-price">${stock?'购买':'出售'}价格 <b>${stock?item.buy:item.sell} G</b> / 份</p>${item.food?`<div class="food-values">生命 +${item.food.health}<br>体力 +${item.food.stamina}<br>饱食 +${item.food.hunger}</div>`:''}`;
      if(['chest','shipping','grocer','fisher'].includes(panel))html+=`<label class="quantity-label">数量 <input id="quantityInput" type="number" min="1" max="${stock?99:quantity(bag,id)}" value="1" /></label>`;
      if(panel==='bag'){if(item.kind==='seed')html+=button(s.selectedSeed===id.slice(5)?'已选择':'选择这袋种子','selectSeed',id);if(item.food)html+=button('吃一份','eat',id)}
      if(panel==='chest')html+=button(this.category==='chest'?'取到背包':'放入储物箱',this.category==='chest'?'withdraw':'deposit',id,'quantity');
      if(panel==='shipping')html+=button('加入今日出货','ship',id,'quantity');
      if(trading)html+=`<div id="tradeQuote" class="trade-quote" aria-live="polite"></div>`+button(stock?'确认购买':'确认出售',stock?'buy':'sell',id,'quantity',!shopOpen(s));
      html+='</div>';
    }else html+='<div class="item-detail empty-detail">行囊很轻。<br>去寻找一些新的收获吧。</div>';
    html+='</div>';
    if(panel==='shipping')html+=`<div class="section-title">已装箱 · 明晨结算</div><p class="info-note">${s.shipping.map(i=>`${ITEMS[i.id].name} × ${i.count}（${ITEMS[i.id].sell*i.count} G）`).join('　')||'还没有装箱的物品'}${s.legacyPending?`　旧存档待结算 ${s.legacyPending} G`:''}</p>`;
    return html;
  }
  private wardrobe(s:GameStateV2){const a=this.draft!;const opts=(names:string[],key:keyof Appearance,unlocked?:number[])=>names.map((name,i)=>`<button aria-label="${name}${unlocked&&!unlocked.includes(i)?'，未解锁':''}" aria-pressed="${a[key]===i}" class="swatch-choice appearance-option ${a[key]===i?'selected':''}" data-action="appearance" data-id="${key}" data-value="${i}"><canvas width="48" height="54" data-look="${key}" data-look-value="${i}" aria-hidden="true"></canvas><span>${name}</span><small>${unlocked&&!unlocked.includes(i)?'◇ 未解锁':a[key]===i?'✓ 已选':'可穿戴'}</small></button>`).join('');
    const lockedOutfit=!s.unlocked.outfits.includes(a.outfit),lockedHat=a.hat>=0&&!s.unlocked.hats.includes(a.hat);
    return `<div class="wardrobe-layout"><div class="wardrobe-preview"><canvas id="characterPreview" width="128" height="144" aria-label="角色外观预览"></canvas><small>预览 · 确认后生效</small></div><div><h3>肤色</h3><div class="swatches">${SKINS.map((color,i)=>`<button aria-label="肤色 ${i+1}" class="color-swatch ${a.skin===i?'selected':''}" style="--swatch:${color}" data-action="appearance" data-id="skin" data-value="${i}"></button>`).join('')}</div><h3>发型</h3><div class="choices">${opts(HAIRS,'hair')}</div><h3>衣服</h3><div class="choices">${opts(OUTFITS,'outfit',s.unlocked.outfits)}</div><h3>帽子</h3><div class="choices"><button class="swatch-choice ${a.hat===-1?'selected':''}" data-action="appearance" data-id="hat" data-value="-1">不戴帽子</button>${opts(HATS,'hat',s.unlocked.hats)}</div><div class="button-row">${lockedOutfit?button(`解锁衣服 · ${150+a.outfit*35} G`,'unlockOutfit',String(a.outfit)):''}${lockedHat?button(`解锁帽子 · ${100+a.hat*25} G`,'unlockHat',String(a.hat)):''}${button('确认穿搭','wear','','',lockedOutfit||lockedHat)}${button('取消预览','close')}</div><p class="info-note">◇ 表示尚未解锁，也可通过手记里程碑免费获得。外观不影响属性。</p></div></div>`;
  }
  fishing(session:FishingSession|null){
    const panel=$('fishingPanel');panel.hidden=!session;if(!session)return;
    panel.dataset.stage=session.stage;
    const difficulty=FISHING_DIFFICULTIES[session.difficulty].name;
    $('fishStatus').textContent=`${difficulty}${session.assist?' · 辅助':''} · `+(session.stage==='waiting'?'等待咬钩…':session.stage==='bite'?'咬钩！空格提竿':session.stage==='reeling'?'追踪鱼的位置':'收竿中');
    $('fishingTrack').hidden=session.stage!=='reeling';$('floatZone').style.height=`${session.range*100}%`;$('floatZone').style.top=`${(session.float-session.range/2)*100}%`;$('fishMarker').style.top=`${session.fishY*100}%`;$('catchProgress').style.width=`${session.progress*100}%`;
    const frame=document.querySelector<HTMLElement>('.canvas-wrap')!,rect=frame.getBoundingClientRect(),width=frame.clientWidth,height=frame.clientHeight;
    const obstacles=['.almanac-dock','.toolbar-row'].map(selector=>{const r=frame.querySelector(selector)!.getBoundingClientRect();return{x:r.x-rect.x,y:r.y-rect.y,width:r.width,height:r.height}});
    const p=this.state().player;obstacles.push({x:p.x/32*width-12,y:p.y/20*height-30,width:45,height:65});
    const pos=fishingPanelPosition({x:session.anchor.x/32*width,y:session.anchor.y/20*height},{width,height},{width:panel.offsetWidth,height:panel.offsetHeight},obstacles);
    panel.style.left=`${pos.x}px`;panel.style.top=`${pos.y}px`;
  }
  private updateTradeQuote(){
    const quote=document.getElementById('tradeQuote');if(!quote)return;
    const s=this.state(),item=ITEMS[this.selectedItem],buy=this.panel==='grocer'&&this.category==='buy',input=$<HTMLInputElement>('quantityInput');
    const count=Number(input.value),valid=Number.isInteger(count)&&count>=1&&count<=Number(input.max),total=(buy?item.buy!:item.sell)*count,after=s.gold+(buy?-total:total);
    quote.classList.toggle('insufficient',!valid||after<0);quote.innerHTML=valid?`${buy?'本次支出':'本次收入'} <b>${buy?'−':'＋'}${total.toLocaleString()} G</b><small>${after<0?'余额不足，还差 '+(-after)+' G':'交易后余额 '+after.toLocaleString()+' G'}</small>`:'请输入有效数量';
    const action=quote.nextElementSibling as HTMLButtonElement;action.disabled=!valid||after<0||!shopOpen(s);
  }
}
