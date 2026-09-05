import { FARM, type GameState } from './game';

const TILE = 40;
const W = 960;
const H = 600;

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private elapsed = 0;
  public targetTile: { x: number; y: number } | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
  }

  burst(tileX: number, tileY: number, kind: 'water' | 'soil' | 'harvest') {
    const colors = kind === 'water' ? ['#8ee1ec', '#3c9fc4'] : kind === 'soil' ? ['#8f542f', '#c17a48'] : ['#fff3a8', '#ed7b45', '#8fcf56'];
    for (let i = 0; i < 12; i++) this.particles.push({
      x: tileX * TILE + 20, y: tileY * TILE + 20,
      vx: (Math.random() - .5) * 70, vy: -20 - Math.random() * 65,
      life: .45 + Math.random() * .35, color: colors[i % colors.length]
    });
  }

  update(dt: number) {
    this.elapsed += dt;
    for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 130 * dt; }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw(state: GameState) {
    const c = this.ctx;
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#84ad55'; c.fillRect(0, 0, W, H);
    this.drawGrass();
    this.drawPath();
    this.drawFence();
    this.drawHouse();
    this.drawStore();
    this.drawShipping();
    this.drawPond();
    this.drawTrees();
    this.drawPlots(state);
    this.drawPlayer(state);
    this.drawParticles();
    this.drawVignette();
  }

  private drawGrass() {
    const c = this.ctx;
    for (let y = 0; y < 15; y++) for (let x = 0; x < 24; x++) {
      const n = (x * 17 + y * 31) % 11;
      if (n < 3) { c.fillStyle = n === 0 ? '#719a49' : '#93bd61'; c.fillRect(x * TILE + 7 + n * 6, y * TILE + 9 + ((x + y) % 4) * 6, 3, 7); }
      if ((x * 5 + y * 3) % 29 === 0) { c.fillStyle = '#f2cf66'; c.fillRect(x*TILE+27,y*TILE+15,4,4); c.fillStyle='#f8ead0'; c.fillRect(x*TILE+25,y*TILE+13,3,3); }
    }
  }

  private drawPath() {
    const c = this.ctx;
    c.fillStyle = '#d2b26e'; c.fillRect(0, 200, 960, 74);
    c.fillStyle = '#e1c580'; c.fillRect(0, 207, 960, 55);
    c.fillRect(134, 240, 92, 210); c.fillRect(726, 240, 92, 155);
    c.fillStyle = '#b9965c';
    for (let x=12;x<950;x+=47) c.fillRect(x,225+(x%3)*7,9,5);
    for (let y=290;y<445;y+=33) c.fillRect(155+(y%2)*22,y,12,6);
  }

  private drawFence() {
    const c = this.ctx; c.fillStyle='#71462c';
    const post=(x:number,y:number)=>{c.fillRect(x,y,8,31);c.fillStyle='#a86a3b';c.fillRect(x+2,y,4,24);c.fillStyle='#71462c';};
    for(let x=350;x<=674;x+=36){c.fillRect(x,192,34,7);post(x,184)}
    c.fillStyle='#563924';c.fillRect(351,198,323,3);
  }

  private drawHouse() {
    const c=this.ctx;
    c.fillStyle='#4e3329';c.fillRect(66,86,194,122);
    c.fillStyle='#d49158';c.fillRect(74,92,178,110);
    c.fillStyle='#efd18c';c.fillRect(94,109,42,34);c.fillRect(184,109,42,34);
    c.fillStyle='#6cb7b0';c.fillRect(100,115,30,22);c.fillRect(190,115,30,22);
    c.fillStyle='#5a3828';c.fillRect(145,143,34,59);c.fillStyle='#f2c76d';c.fillRect(168,171,5,5);
    c.fillStyle='#6b3f34';c.beginPath();c.moveTo(45,94);c.lineTo(161,24);c.lineTo(281,94);c.fill();
    c.fillStyle='#a74f43';c.beginPath();c.moveTo(58,92);c.lineTo(161,37);c.lineTo(268,92);c.fill();
    c.fillStyle='#e7c879';c.fillRect(150,58,22,20);c.fillStyle='#80513d';c.fillRect(155,62,12,16);
    c.fillStyle='#f6e1a0';c.fillRect(111,209,100,12);c.fillStyle='#936036';c.fillRect(126,221,70,6);
  }

  private drawStore() {
    const c=this.ctx;
    c.fillStyle='#51372b';c.fillRect(704,104,210,106);c.fillStyle='#e1b56c';c.fillRect(711,111,196,91);
    c.fillStyle='#33675e';c.fillRect(694,91,230,31);
    for(let x=694;x<924;x+=38){c.fillStyle=((x/38)%2)?'#f0c66c':'#e76b4c';c.fillRect(x,91,38,31)}
    c.fillStyle='#3d6d63';c.fillRect(729,135,70,48);c.fillStyle='#bfe1c5';c.fillRect(737,143,54,32);
    c.fillStyle='#71452e';c.fillRect(836,142,39,60);c.fillStyle='#f8da6f';c.fillRect(865,171,5,5);
    c.fillStyle='#5c3928';c.fillRect(755,67,110,28);c.fillStyle='#f4d990';c.font='bold 16px serif';c.textAlign='center';c.fillText('溪 谷 杂 货',810,87);
  }

  private drawShipping() {
    const c=this.ctx;c.fillStyle='#493225';c.fillRect(255,151,57,56);c.fillStyle='#9b5b34';c.fillRect(260,156,47,47);
    c.fillStyle='#c47b42';c.fillRect(256,147,55,12);c.fillStyle='#452c20';c.fillRect(270,164,27,6);
    c.fillStyle='#f0d27d';c.fillRect(275,180,17,13);c.fillStyle='#7b9d4e';c.fillRect(281,176,5,6);
  }

  private drawPond() {
    const c=this.ctx;c.fillStyle='#547647';
    c.beginPath();c.ellipse(783,445,114,78,0,0,Math.PI*2);c.fill();
    c.fillStyle='#3f96a3';c.beginPath();c.ellipse(783,442,104,68,0,0,Math.PI*2);c.fill();
    c.fillStyle='#5db9bd';c.beginPath();c.ellipse(775,431,86,49,0,0,Math.PI*2);c.fill();
    c.strokeStyle='#a4ddd2';c.lineWidth=3;
    for(let i=0;i<3;i++){const x=735+i*35+Math.sin(this.elapsed*1.7+i)*7;c.beginPath();c.moveTo(x,421+i*14);c.lineTo(x+23,421+i*14);c.stroke();}
    c.fillStyle='#6a9d53';c.fillRect(702,483,13,25);c.fillRect(858,394,12,27);
    c.fillStyle='#efc85d';c.fillRect(699,478,5,12);c.fillRect(709,475,5,15);c.fillRect(855,389,5,12);c.fillRect(865,386,5,15);
  }

  private drawTrees() {
    [[25,38],[338,50],[427,60],[526,39],[616,65],[32,357],[61,482],[261,493],[341,526],[910,341],[897,518]].forEach(([x,y],i)=>{
      const c=this.ctx;c.fillStyle='#69452d';c.fillRect(x+19,y+42,15,36);c.fillStyle='#315b3c';c.fillRect(x+5,y+14,43,45);c.fillRect(x+15,y,28,32);
      c.fillStyle=i%2?'#4f8148':'#477644';c.fillRect(x,y+24,28,26);c.fillRect(x+28,y+20,29,31);c.fillStyle='#78a752';c.fillRect(x+11,y+10,12,9);c.fillRect(x+37,y+29,10,8);
    });
  }

  private drawPlots(state: GameState) {
    const c=this.ctx;
    state.plots.forEach((plot,i)=>{
      const x=FARM.x+i%FARM.cols,y=FARM.y+Math.floor(i/FARM.cols),px=x*TILE,py=y*TILE;
      c.strokeStyle='#759b4d';c.strokeRect(px+2,py+2,36,36);
      if(plot.tilled){c.fillStyle=plot.crop?.watered?'#66452f':'#825437';c.fillRect(px+3,py+3,34,34);c.fillStyle=plot.crop?.watered?'#8a6242':'#a46c43';for(let k=0;k<3;k++)c.fillRect(px+7,py+9+k*10,26,3)}
      if(plot.crop){
        const g=plot.crop.growth;
        c.fillStyle='#3c6c3f';c.fillRect(px+18,py+18-g*3,4,14+g*3);
        c.fillStyle=g===0?'#75a84e':'#4e8a48';c.fillRect(px+12,py+13-g*3,8+g*2,7);c.fillRect(px+21,py+10-g*2,8,8);
        if(g>=2){c.fillStyle='#f7e5c1';c.fillRect(px+14,py+22,15,10);c.fillRect(px+17,py+30,9,4);c.fillStyle='#e67054';c.fillRect(px+15,py+21,13,5);}
        if(plot.crop.watered){c.fillStyle='#79ced8';c.fillRect(px+6,py+30,4,3);c.fillRect(px+31,py+25,3,3)}
      }
    });
    if(this.targetTile){c.strokeStyle='#fff4b0';c.lineWidth=3;c.strokeRect(this.targetTile.x*TILE+3,this.targetTile.y*TILE+3,34,34);c.lineWidth=1;}
  }

  private drawPlayer(state: GameState) {
    const c=this.ctx,x=state.player.x*TILE,y=state.player.y*TILE,bob=Math.sin(this.elapsed*9)*1.5;
    c.fillStyle='rgba(35,45,28,.25)';c.fillRect(x+9,y+32,23,6);
    c.fillStyle='#55392d';c.fillRect(x+11,y+13+bob,19,16);c.fillStyle='#e8b986';c.fillRect(x+13,y+14+bob,15,13);
    c.fillStyle='#315b49';c.fillRect(x+9,y+26+bob,23,10);c.fillStyle='#e4a044';c.fillRect(x+7,y+5+bob,27,9);c.fillStyle='#6f4430';c.fillRect(x+11,y+1+bob,18,8);
    c.fillStyle='#253b32';c.fillRect(x+10,y+35+bob,8,4);c.fillRect(x+24,y+35+bob,8,4);
    const eyeX=state.player.direction==='left'?15:state.player.direction==='right'?25:20;c.fillStyle='#493126';c.fillRect(x+eyeX,y+19+bob,3,3);
  }

  private drawParticles(){for(const p of this.particles){this.ctx.globalAlpha=Math.max(0,p.life*2);this.ctx.fillStyle=p.color;this.ctx.fillRect(Math.round(p.x),Math.round(p.y),5,5)}this.ctx.globalAlpha=1}
  private drawVignette(){const g=this.ctx.createRadialGradient(480,290,240,480,300,590);g.addColorStop(0,'rgba(255,244,184,0)');g.addColorStop(1,'rgba(35,49,36,.22)');this.ctx.fillStyle=g;this.ctx.fillRect(0,0,W,H)}
}

export const TILE_SIZE = TILE;
