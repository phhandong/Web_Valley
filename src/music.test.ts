import { afterEach,describe,expect,it,vi } from 'vitest';
import { ValleyMusic } from './music';
import { initialState } from './engine';
class FakeAudio {
  static instances:FakeAudio[]=[];state='running';currentTime=0;destination={};notes=0;
  gain={value:0,setTargetAtTime:vi.fn(),setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()};
  constructor(){FakeAudio.instances.push(this)}
  createGain(){return{gain:this.gain,connect:vi.fn(),disconnect:vi.fn()}}
  createOscillator(){this.notes++;return{type:'sine',frequency:{value:0},connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null}}
  async suspend(){this.state='suspended'} async resume(){this.state='running'}
}
afterEach(()=>{vi.unstubAllGlobals();FakeAudio.instances=[]});
describe('background music lifecycle',()=>{
  it('waits for a gesture, starts one context, and does not stack duplicate scores',()=>{
    vi.stubGlobal('AudioContext',FakeAudio);const music=new ValleyMusic(),s=initialState(1);music.update(s,true);expect(FakeAudio.instances).toHaveLength(0);music.unlock();music.unlock();music.update(s,true);expect(FakeAudio.instances).toHaveLength(1);const c=FakeAudio.instances[0],count=c.notes;expect(count).toBeGreaterThan(0);music.update(s,true);expect(c.notes).toBe(count);
  });
  it('pauses on blur or mute, resumes and respects volume',()=>{
    vi.stubGlobal('AudioContext',FakeAudio);const music=new ValleyMusic(),s=initialState(1);music.unlock();music.update(s,true);const c=FakeAudio.instances[0];music.update(s,false);expect(c.state).toBe('suspended');music.update(s,true);expect(c.state).toBe('running');s.settings.volume=0;music.update(s,true);expect(c.gain.setTargetAtTime).toHaveBeenLastCalledWith(0,0,.15);s.settings.music=false;music.update(s,true);expect(c.state).toBe('suspended');
  });
  it('does not crash if audio is unavailable',()=>{vi.stubGlobal('AudioContext',class{constructor(){throw new Error('unavailable')}});const music=new ValleyMusic();expect(()=>{music.unlock();music.update(initialState(1),true)}).not.toThrow()});
});
