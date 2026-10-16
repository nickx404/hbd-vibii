import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';

await access(new URL('assets/song.mp3',import.meta.url));
const source=await readFile(new URL('app.js',import.meta.url),'utf8');
const musicCode=source.slice(source.indexOf('  const music ='),source.indexOf('  function setupPasswordGate('));
const microphoneCode=source.slice(source.indexOf('  function stopMicrophone('),source.indexOf('  function confetti('));
const frames=new Map(),timers=new Map(),elements=new Map();
let time=0,id=0,plays=0,pauses=0,confettiCount=0;
const element=selector=>{
  if(!elements.has(selector))elements.set(selector,{style:{removeProperty(){}},classList:{add(){}},setAttribute(){},remove(){}});
  return elements.get(selector);
};
class Audio {
  paused=true;currentTime=42;volume=.55;
  play(){this.paused=false;plays++;return Promise.resolve();}
  pause(){this.paused=true;pauses++;}
}
class AudioContext {
  state='running';close(){return Promise.resolve();}
  createAnalyser(){return {getByteTimeDomainData(samples){samples.fill(128);}};}
  createMediaStreamSource(){return {connect(){}};}
}
const context=vm.createContext({Audio,document:{hidden:false,body:{append(){}},addEventListener(){}},performance:{now:()=>time},
  requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(key){frames.delete(key);},
  setTimeout(fn,delay){timers.set(++id,{fn,delay});return id;},clearTimeout(key){timers.delete(key);},
  window:{isSecureContext:true,AudioContext},navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}],getAudioTracks:()=>[{addEventListener(){}}]})}},
  $:element,content:{chapters:[{id:'birthday'}]},current:0,paused:false,candlesBlown:false,
  confetti(){confettiCount++;},Uint8Array,Math});
vm.runInContext(`let micStream=null,micContext=null,micFrame=null,micPending=false,micRequest=0;${musicCode}${microphoneCode}`,context);
const run=code=>vm.runInContext(code,context);
function tick(ms){time+=ms;const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(time));}
async function flush(){for(let i=0;i<6;i++)await Promise.resolve();}
run('startMusic()');assert.equal(plays,0,'Stay silent before clearance.');
run('musicAllowed=true;startMusic()');assert.equal(plays,1,'Start after clearance.');
const enabling=run('enableMicrophone()');await flush();
tick(350);assert.ok(run('music.volume')>0&&run('music.volume')<.55,'Fade gradually.');
assert.equal(element('.blow-meter').hidden,undefined,'Do not analyse while music is audible.');
tick(350);await enabling;
assert.equal(run('music.volume'),0);assert.equal(run('music.paused'),true);
assert.equal(element('.blow-meter').hidden,false,'Start listening after silence.');
run('blowCandles()');assert.equal(confettiCount,1);assert.equal(plays,1,'Stay silent during confetti.');
const resume=[...timers.values()].find(timer=>timer.delay===3000);
assert.ok(resume,'Resume when the three-second confetti ends.');resume.fn();tick(700);
assert.equal(plays,2);assert.equal(run('music.currentTime'),42,'Resume without restarting the track.');
assert.equal(run('music.volume'),.55);
// Cancellation during the fade must cancel the pending pause and restore the volume.
run('candlesBlown=false');const cancelled=run('enableMicrophone()');run('stopMicrophone()');tick(700);await cancelled;await flush();
assert.equal(run('music.paused'),false);assert.equal(run('music.volume'),.55);
context.navigator.mediaDevices.getUserMedia=async()=>{throw Object.assign(new Error(),{name:'NotAllowedError'});};
await run('enableMicrophone()');tick(700);await flush();
assert.equal(run('musicHeld'),false,'Denied permission restores music.');
assert.equal(run('music.paused'),false);
assert.ok(pauses>0);
console.log('PASS: clearance playback, gradual fade, silent listening, confetti delay, resume position, cancellation, and denied permission.');
