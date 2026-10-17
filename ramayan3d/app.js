/* RAMAYAN 3D — app: audio-synced scene manager over the custom engine */
import { Engine } from './engine.js';
import { setBillboardSource } from './props.js';
import { sceneBirth, sceneVanas, sceneHaran, sceneJatayu } from './scenesA.js';
import { sceneHanuman, sceneSetu, sceneWar, sceneDeepavali } from './scenesB.js';

/* Timeline cues — scene start times (seconds) over the 900s narration.
   Final values injected from narration analysis. */
const SCENES = [
  { id:'birth',    t0:0,   build:sceneBirth,    hi:'श्री राम जन्म', en:'The Birth of Ram' },
  { id:'vanas',    t0:129, build:sceneVanas,    hi:'वनवास', en:'Into Exile' },
  { id:'haran',    t0:236, build:sceneHaran,    hi:'सीता हरण', en:'The Abduction' },
  { id:'jatayu',   t0:333, build:sceneJatayu,   hi:'जटायु का बलिदान', en:'Jatayu\'s Sacrifice' },
  { id:'hanuman',  t0:446, build:sceneHanuman,  hi:'हनुमान जी', en:'The Flight of Hanuman' },
  { id:'setu',     t0:533, build:sceneSetu,     hi:'राम सेतु', en:'The Bridge of Stones' },
  { id:'war',      t0:610, build:sceneWar,      hi:'लंका युद्ध', en:'The Burning of Lanka' },
  { id:'deepavali',t0:762, build:sceneDeepavali,hi:'पहली दीपावली', en:'The First Deepavali' },
];
const FILM_LEN = 900;

const params=new URLSearchParams(location.search);
const QA_FAST=params.get('qa')==='1';
const QA_T=params.get('qa_t');
const QA_SC=params.get('qa_sc');
const MUTE=params.get('mute')==='1';
const DUR = QA_FAST ? 6 : FILM_LEN;

const canvas=document.getElementById('gl');
const engine=new Engine(canvas);
const wrap=document.getElementById('wrap');

/* ---------- state ---------- */
let audioCtx=null, audioBuf=null, srcNode=null;
let startAt=0, pauseAt=0, playing=false;
let curIdx=-1, cur=null, transition=0, transDir=0, nextIdx=-1;
let buildCache=new Map();
const tTitles=document.getElementById('titles');
const tBar=document.getElementById('bar');
const tPlay=document.getElementById('play');
const tLoad=document.getElementById('loading');

function absT(){
  if(QA_SC!==null){
    const base=SCENES[Math.max(0,Math.min(SCENES.length-1,+QA_SC))].t0;
    return base+(QA_T!==null?+QA_T:10);
  }
  if(QA_T!==null) return +QA_T;
  if(QA_FAST) return (performance.now()/1000)%DUR;
  if(!playing) return pauseAt;
  if(audioCtx && audioBuf) return audioCtx.currentTime-startAt;
  return performance.now()/1000-startAt;
}

/* ---------- scene lifecycle ---------- */
function buildScene(i){
  if(buildCache.has(i)) return buildCache.get(i);
  const s=SCENES[i].build();
  buildCache.set(i,s);
  return s;
}
function activate(i){
  const s=buildScene(i);
  if(cur){ engine.scene.remove(cur.group); }
  engine.scene.add(s.group);
  cur=s; curIdx=i;
  engine.rayCenter.set(s.ray.center[0],s.ray.center[1]);
  engine.rayStrength=s.ray.strength;
  engine.exposure=s.grade.exposure+0.55;
  engine.gradeTintAmt=s.grade.tintAmt;
  setBillboardSource(engine.camera);
  showTitle(SCENES[i]);
}
function showTitle(sc){
  const el=document.createElement('div');
  el.className='chapter';
  el.innerHTML='<span class="hi">'+sc.hi+'</span><span class="en">'+sc.en+'</span>';
  tTitles.replaceChildren(el);
  requestAnimationFrame(()=>el.classList.add('on'));
  setTimeout(()=>el.classList.remove('on'), 5200);
  setTimeout(()=>{ if(el.parentNode) el.remove(); }, 6400);
}

/* ---------- transitions ---------- */
let transPhase=0; /* 0 none, 1 fading out, 2 fading in */
function tickTransition(dt, t){
  if(transPhase===1){
    engine.black=Math.min(1, engine.black+dt*1.6);
    if(engine.black>=1){
      activate(nextIdx);
      transPhase=2;
    }
  } else if(transPhase===2){
    engine.black=Math.max(0, engine.black-dt*1.1);
    if(engine.black<=0) transPhase=0;
  }
}

/* ---------- main loop ---------- */
let last=performance.now();
let qaLogged=false;
function frame(){
  requestAnimationFrame(frame);
  const now=performance.now();
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  const t=absT();

  /* scene cue */
  let idx=0;
  for(let i=0;i<SCENES.length;i++){ if(t>=SCENES[i].t0) idx=i; }
  if(curIdx<0){ activate(idx); engine.fade=0; }
  else if(idx!==curIdx && transPhase===0){ nextIdx=idx; transPhase=1; }

  if(cur){
    const lt=t-SCENES[curIdx].t0;
    cur.rig.apply(engine.camera, lt);
    cur.update(lt, dt);
  }
  tickTransition(dt, t);
  engine.fade=Math.min(1,(engine.fade??0)+dt*0.5);
  adaptQuality(dt);

  /* progress + uniforms */
  const p=Math.min(1,t/FILM_LEN);
  tBar.style.transform='scaleX('+p+')';
  engine.render(now/1000, dt);

  if(QA_FAST && !qaLogged && engine.black===0 && t>0.5){
    qaLogged=true; console.log('QA_OK scene='+SCENES[curIdx].id);
  }
  /* QA instrumentation */
  if(!window.__qac) window.__qac=0;
  window.__qac++;
  if(!window.__qaEl){ window.__qaEl=document.createElement('div'); window.__qaEl.id='qaState';
    window.__qaEl.style.cssText='position:fixed;top:2px;left:2px;color:#fff;font-size:14px;z-index:99';
    document.body.appendChild(window.__qaEl); }
  if(window.__qac%5===0) window.__qaEl.textContent=
    ['t='+t.toFixed(1),'lt='+((cur&&curIdx>=0)?(t-SCENES[curIdx].t0):0).toFixed(1),'sc='+(SCENES[curIdx]||{}).id,
     'fade='+engine.fade.toFixed(2),'blk='+engine.black.toFixed(2),'cam='+engine.camera.position.toArray().map(v=>v.toFixed(1)),'n='+window.__qac].join(' | ');
}

/* ---------- audio ---------- */
async function startShow(){
  tPlay.style.display='none';
  try{
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    const r=await fetch('audio/narration.m4a');
    const ab=await r.arrayBuffer();
    audioBuf=await audioCtx.decodeAudioData(ab);
  }catch(e){
    console.log('AUDIO_FALLBACK', e && e.message);
  }
  if(audioCtx && audioBuf){
    srcNode=audioCtx.createBufferSource();
    srcNode.buffer=audioBuf;
    srcNode.connect(audioCtx.destination);
    srcNode.start();
    startAt=audioCtx.currentTime;
  } else {
    /* no audio device/buffer — clock falls back to wall time so visuals still run */
    startAt=performance.now()/1000;
  }
  playing=true;
}
tPlay.addEventListener('click', startShow);
tPlay.addEventListener('touchstart', (e)=>{e.preventDefault(); startShow();}, {passive:false});

if(QA_FAST||QA_T!==null){
  tPlay.style.display='none'; tLoad.style.display='none';
}
if(QA_T!==null){ document.body.classList.add('qa'); }

/* adaptive quality: measure fps, degrade gracefully on weak devices */
let fpsAcc=0, fpsN=0, adapted=0;
function adaptQuality(dt){
  if(adapted>=2 || QA_T!==null) return;
  fpsAcc+=dt; fpsN++;
  if(fpsN<60) return;
  const fps=fpsN/fpsAcc; fpsAcc=0; fpsN=0;
  if(fps<26 && adapted===0){
    adapted=1;
    engine.pixelRatio=1.0; engine.resize();
    /* halve visible particles via drawRange */
    engine.scene.traverse(o=>{ if(o.isPoints && o.geometry.setDrawRange){
      const n=o.geometry.getAttribute('position').count;
      o.geometry.setDrawRange(0, Math.floor(n/2)); } });
    console.log('PERF_DOWNGRADE_1');
  } else if(fps>=26){ adapted=2; }
}

/* preload scene 0 so first frame is instant after play */
activate(0); engine.scene.remove(cur.group); cur=null; curIdx=-1;
engine.fade=0;
frame();
console.log('BOOT_OK');
window.__QA={ engine, SCENES, activate };
