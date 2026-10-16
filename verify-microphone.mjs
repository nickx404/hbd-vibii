import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('app.js',import.meta.url),'utf8');
const microphone=source.slice(source.indexOf('  function stopMicrophone('),source.indexOf('  function blowCandles('));
function setup(){
  const elements=new Map();
  const element=selector=>{
    if(!elements.has(selector))elements.set(selector,{textContent:'',setAttribute(){},style:{width:'',removeProperty(){}}});
    return elements.get(selector);
  };
  const frames=new Map();let frameId=0,time=0,loud=false,stops=0,closes=0,blown=0;
  const stream={getTracks:()=>[{stop(){stops++;}}],getAudioTracks:()=>[{addEventListener(){}}]};
  class AudioContext{
    state='running';
    close(){closes++;return Promise.resolve();}
    createMediaStreamSource(){return {connect(){}};}
    createAnalyser(){return {getByteTimeDomainData(samples){samples.fill(loud?144:128);}};}
  }
  const context=vm.createContext({window:{isSecureContext:true,AudioContext},navigator:{mediaDevices:{getUserMedia:async()=>stream}},performance:{now:()=>time},Uint8Array,Math,
    requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId;},cancelAnimationFrame(id){frames.delete(id);},
    $:element,content:{chapters:[{id:'birthday'}]},current:0,paused:false,candlesBlown:false,
    musicHeld:false, musicResumeTimer:null,clearTimeout(){},fadeMusic:async()=>{},music:{pause(){}},resumeMusic(){},
    hit(){blown++;}});
  vm.runInContext(`let micStream=null,micContext=null,micFrame=null,micPending=false,micRequest=0;${microphone}\nfunction blowCandles(){candlesBlown=true;hit();stopMicrophone();}`,context);
  return {context,stream,element,enable:()=>vm.runInContext('enableMicrophone()',context),stop:()=>vm.runInContext('stopMicrophone()',context),loud:()=>{loud=true;},
    tick(){const batch=[...frames.values()];frames.clear();time+=50;batch.forEach(fn=>fn(time));},
    state:()=>({stops,closes,blown,frames:frames.size})};
}
assert.ok(source.includes("if(action==='blow-candles')enableMicrophone();"),'Cake activation must request microphone access, not extinguish candles.');
assert.ok(source.includes("$('#scene').after(controls)"),'Microphone controls must appear below the cake.');
const active=setup();await active.enable();
assert.equal(active.element('.blow-meter').hidden,false,'Show level meter while listening.');
for(let i=0;i<20;i++)active.tick();
assert.equal(active.state().blown,0,'Silence must not extinguish candles.');
active.loud();active.tick();assert.equal(active.state().blown,0,'A brief sound must not extinguish candles.');
for(let i=0;i<15;i++)active.tick();
assert.deepEqual(active.state(),{stops:1,closes:1,blown:1,frames:0},'Sustained volume blows once and releases microphone and animation frame.');
const denied=setup();denied.context.navigator.mediaDevices.getUserMedia=async()=>{throw Object.assign(new Error(),{name:'NotAllowedError'});};await denied.enable();
assert.match(denied.element('#mic-hint').textContent,/not allowed/);assert.equal(denied.state().closes,1);
const pending=setup();let resolve;pending.context.navigator.mediaDevices.getUserMedia=()=>new Promise(done=>{resolve=done;});
const permission=pending.enable();pending.stop();resolve(pending.stream);await permission;
assert.deepEqual(pending.state(),{stops:1,closes:1,blown:0,frames:0},'Cancelling pending permission must release a late microphone stream.');
const unsupported=setup();unsupported.context.window.isSecureContext=false;await unsupported.enable();
assert.match(unsupported.element('#mic-hint').textContent,/unavailable/);
console.log('PASS: silence, sustained blowing, cleanup, denied access, cancelled permission, and insecure-context fallback.');
