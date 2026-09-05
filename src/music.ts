import type { GameStateV2 } from './types';

/** Original pentatonic score, synthesized locally; no streaming or audio downloads. */
export class ValleyMusic {
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private next=0;private beat=0;private unlocked=false;
  private melody=[0,4,7,9,7,4,2,-1,0,2,4,7,4,2,0,-1,7,9,12,9,7,4,2,-1,4,7,4,2,0,-1,2,-1];
  unlock(){
    this.unlocked=true;
    try{if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination)}}catch{/* Audio output is optional. */}
  }
  update(s:GameStateV2,active:boolean){
    const c=this.context,g=this.master;if(!c||!g||!this.unlocked)return;
    if(!active||!s.settings.music){if(c.state==='running')void c.suspend().catch(()=>{});return}
    if(c.state==='suspended'){void c.resume().catch(()=>{});return}
    g.gain.setTargetAtTime(s.settings.volume/100*.23,c.currentTime,.15);
    if(this.next<c.currentTime)this.next=c.currentTime+.05;
    const night=s.calendar.minute>=1080,beatLength=night?.48:.38;
    while(this.next<c.currentTime+.2){
      const note=this.melody[this.beat%this.melody.length];
      const root=s.player.scene==='quarry'?45:s.player.scene==='forest'||s.player.scene==='grove'?50:55;
      if(note>=0)this.note(root+12+note,this.next,beatLength*1.7,.27,'sine');
      if(this.beat%8===0){const bass=root+[0,5,7,0][Math.floor(this.beat/8)%4];this.note(bass,this.next,beatLength*7,.18,'triangle');this.note(bass+7,this.next+.05,beatLength*6,.10,'sine')}
      this.next+=beatLength;this.beat++;
    }
  }
  private note(midi:number,time:number,duration:number,volume:number,type:OscillatorType){
    const c=this.context!,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=440*2**((midi-69)/12);
    g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.025);g.gain.exponentialRampToValueAtTime(.0001,time+duration);
    o.connect(g);g.connect(this.master!);o.start(time);o.stop(time+duration+.05);o.onended=()=>{o.disconnect();g.disconnect()};
  }
}
