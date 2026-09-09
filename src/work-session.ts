import { workTarget,workError,type WorkTarget } from './fieldwork';
import { harvestResource } from './engine';
import type { GameStateV2,Result } from './types';
export interface WorkSession {target:WorkTarget;elapsed:number;hit:boolean;complete:boolean}
export interface WorkImpact {target:WorkTarget;result:Result;complete:boolean}
export class WorkController {
  session:WorkSession|null=null;
  private held=new Set<string>();private releaseRequired=false;
  input(source:string,down:boolean){if(down)this.held.add(source);else this.held.delete(source);if(!this.held.size)this.releaseRequired=false;}
  releaseAll(){this.held.clear();this.releaseRequired=false;}
  cancel(){this.session=null;this.releaseRequired=this.held.size>0;}
  start(s:GameStateV2,x:number,y:number):Result{
    if(this.session||this.releaseRequired)return{ok:false,message:''};
    const t=workTarget(s,x,y);if(!t)return{ok:false,message:'这里没有可采集的资源'};
    const error=workError(s,t);if(error)return{ok:false,message:error};
    const dx=x-s.player.x,dy=y-s.player.y;
    if(dx||dy)s.player.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
    this.session={target:t,elapsed:0,hit:false,complete:false};return{ok:true,message:''};
  }
  tick(s:GameStateV2,dt:number):WorkImpact|null{
    const a=this.session;if(!a||!Number.isFinite(dt)||dt<=0)return null;
    const t=workTarget(s,a.target.x,a.target.y);
    if(!a.hit&&(!t||t.key!==a.target.key||t.scene!==a.target.scene)){this.cancel();return null;}
    if(!a.hit&&t){const error=workError(s,t);if(error){this.cancel();return{target:a.target,result:{ok:false,message:error},complete:false};}}
    a.elapsed+=dt;let impact:WorkImpact|null=null;
    if(!a.hit&&a.elapsed>=.22){
      const result=harvestResource(s,a.target.x,a.target.y);a.hit=true;a.complete=result.ok&&s.fieldwork.damage[a.target.key]===undefined;
      impact={target:a.target,result,complete:a.complete};if(!result.ok){this.cancel();return impact;}
    }
    if(a.elapsed>=.5){
      if(a.complete||!this.held.size)this.cancel();
      else {this.session=null;const res=this.start(s,a.target.x,a.target.y);if(!res.ok){this.cancel();if(!impact)return{target:a.target,result:res,complete:false};}}
    }
    return impact;
  }
}
