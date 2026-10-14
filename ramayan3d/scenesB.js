/* Scenes 5–8: Hanuman flight · Setu · Lanka war · First Deepavali */
import * as THREE from './vendor/three.module.min.js';
import { makeSky, makeWater, makeEmbers, makeFlame, makeFigure, makeHanuman } from './props.js';
import { makeMountain, makeStone, makeTemple, makeVimana, makeArrow, makeArmy, makeDiya, camRig, easeIO, clamp01 } from './props2.js';

/* ---------- Scene 5: Hanuman — ocean flight, Sanjeevani mountain ---------- */
export function sceneHanuman(){
  const g=new THREE.Group();
  const sky=makeSky({top:new THREE.Color(0.05,0.07,0.16), horizon:new THREE.Color(0.55,0.24,0.09),
    sunDir:new THREE.Vector3(0.5,0.30,-1), sunCol:new THREE.Color(1.0,0.6,0.25),
    glow:1.5, stars:0.5, clouds:0.5, cloudCol:new THREE.Color(0.4,0.18,0.08)});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1300,24,16),sky); g.add(dome);

  const water=makeWater({deep:new THREE.Color(0.010,0.022,0.038), shallow:new THREE.Color(0.045,0.06,0.075),
    skyCol:new THREE.Color(0.30,0.12,0.05), sunDir:new THREE.Vector3(0.4,0.25,-0.9),
    sunCol:new THREE.Color(1.0,0.52,0.16), amp:0.55});
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(900,900,110,110),water);
  sea.rotation.x=-Math.PI/2; sea.position.y=-2.4; g.add(sea);

  /* hanuman flying with mountain of herbs glowing */
  const han=makeHanuman({base:new THREE.Color(0.30,0.11,0.04), rimCol:new THREE.Color(1.0,0.65,0.28)});
  han.scale.setScalar(1.6);
  const mtn=makeMountain(3.4,5.2,11); mtn.position.set(0,2.6,0);
  han.add(mtn);
  const herbs=makeEmbers(120,{box:[7,6,7],rise:0.9,size:5,wind:new THREE.Vector2(0,0),curl:0.6,
    colA:new THREE.Color(0.5,1.0,0.45),colB:new THREE.Color(1.0,0.9,0.4)});
  herbs.position.set(0,4.6,0); han.add(herbs);
  g.add(han);

  /* speed streaks */
  const streaks=makeEmbers(300,{box:[160,50,120],rise:0.1,size:2.4,wind:new THREE.Vector2(-13,0),curl:0.12,
    colA:new THREE.Color(0.5,0.35,0.2),colB:new THREE.Color(0.3,0.22,0.14)}); g.add(streaks);

  /* clouds passing */
  const clouds=makeEmbers(90,{box:[220,26,160],rise:0.05,size:9,wind:new THREE.Vector2(-3.5,0),curl:0.2,
    colA:new THREE.Color(0.16,0.08,0.05),colB:new THREE.Color(0.10,0.05,0.04)}); g.add(clouds);

  const rig=camRig([
    {t:0,  pos:[6,7,16],    look:[0,5,-8],   fov:46},
    {t:24, pos:[3,5.5,10],  look:[0,4.6,-8], fov:42},
    {t:52, pos:[-5,4,8],    look:[0,4.2,-10],fov:44},
    {t:84, pos:[-8,6,4],    look:[0,5,-14],  fov:40},
  ]);
  return { group:g, sky, rig, update(t,dt){
      sky.userData.u.uTime.value=t; water.userData.u.uTime.value=t;
      streaks.userData.u.uTime.value=t; clouds.userData.u.uTime.value=t;
      herbs.userData.u.uTime.value=t;
      const f=clamp01(t/8), e=easeIO(f);
      han.position.set(Math.sin(t*0.42)*7, 4.4+Math.sin(t*0.55)*1.3, -8-24*t*0.06);
      han.rotation.y=Math.PI+Math.sin(t*0.42)*0.08;
      han.rotation.z=Math.sin(t*0.8)*0.07;
      mtn.rotation.y=t*0.24;
    }, ray:{center:[0.55,0.35], strength:0.6},
    grade:{exposure:1.0, tintAmt:0.5} };
}

/* ---------- Scene 6: Setu — the floating stones, ocean hero shot ---------- */
export function sceneSetu(){
  const g=new THREE.Group();
  const sky=makeSky({top:new THREE.Color(0.06,0.08,0.17), horizon:new THREE.Color(0.62,0.28,0.10),
    sunDir:new THREE.Vector3(-0.1,0.20,-1), sunCol:new THREE.Color(1.0,0.58,0.22),
    glow:1.7, stars:0.35, clouds:0.4, cloudCol:new THREE.Color(0.45,0.2,0.08)});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1300,24,16),sky); g.add(dome);

  const water=makeWater({deep:new THREE.Color(0.008,0.018,0.034), shallow:new THREE.Color(0.04,0.055,0.07),
    skyCol:new THREE.Color(0.33,0.13,0.05), sunDir:new THREE.Vector3(0,0.22,-1),
    sunCol:new THREE.Color(1.0,0.55,0.18), amp:0.6, foamX:-18, foamW:9});
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000,120,120),water);
  sea.rotation.x=-Math.PI/2; sea.position.y=-2.4; g.add(sea);

  /* bridge line of stones rising from the sea to horizon */
  const stones=[];
  const stoneGeoParams=[];
  for(let i=0;i<40;i++){
    const st=makeStone(0.9+Math.random()*0.7,i);
    st.position.set(-16+i*1.45, -3.4, -2);
    g.add(st); stones.push(st);
  }
  /* vanar sena placing stones */
  const monkeys=makeArmy(16,26,{base:new THREE.Color(0.22,0.10,0.04), rimCol:new THREE.Color(1.0,0.6,0.25)});
  monkeys.position.set(-14,0,8); g.add(monkeys);
  const ram=makeFigure({bow:true, base:new THREE.Color(0.16,0.08,0.03)});
  ram.position.set(-8,0,5); ram.rotation.y=0.2; g.add(ram);

  const rig=camRig([
    {t:0,  pos:[-20,2.2,14],  look:[-6,0.5,-4],  fov:46},
    {t:26, pos:[-10,3.0,10],  look:[2,0.5,-6],   fov:44},
    {t:54, pos:[2,2.4,6],     look:[16,0.4,-8],  fov:42},
    {t:82, pos:[16,4.5,2],    look:[40,0.6,-18], fov:40},
  ]);
  return { group:g, sky, rig, update(t,dt){
      sky.userData.u.uTime.value=t; water.userData.u.uTime.value=t;
      stones.forEach((st,i)=>{
        const f=clamp01((t-2-i*0.55)/1.6), e=easeIO(f);
        const bob=Math.sin(t*1.4+i*0.9)*0.12*e;
        st.position.y=-3.4+3.2*e+bob;
        st.rotation.x=e*0.5; st.rotation.z=e*0.3;
      });
      monkeys.children.forEach((m,i)=>{ m.position.y=Math.abs(Math.sin(t*2.1+i))*0.35;
        m.rotation.y=Math.sin(t*1.1+i)*0.3+0.3; });
    }, ray:{center:[0.5,0.28], strength:0.75},
    grade:{exposure:1.05, tintAmt:0.55} };
}

/* ---------- Scene 7: Lanka — war, fire, clashing arrows ---------- */
export function sceneWar(){
  const g=new THREE.Group();
  const sky=makeSky({top:new THREE.Color(0.05,0.02,0.03), horizon:new THREE.Color(0.55,0.10,0.03),
    sunDir:new THREE.Vector3(0.15,0.10,-1), sunCol:new THREE.Color(1.0,0.30,0.08),
    glow:1.3, stars:0.15, clouds:0.95, cloudCol:new THREE.Color(0.45,0.08,0.03)});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1200,24,16),sky); g.add(dome);

  /* burning Lanka silhouette skyline */
  for(let i=0;i<12;i++){
    const t=makeTemple(2.5+Math.random()*3,5+Math.random()*10,2.5);
    t.position.set(-36+i*6.5+(Math.random()-0.5)*3, 0, -30-Math.random()*26);
    t.rotation.y=(Math.random()-0.5)*0.5;
    g.add(t);
  }
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(260,180,36,26), new THREE.MeshBasicMaterial({color:0x160b06}));
  ground.rotation.x=-Math.PI/2; g.add(ground);

  /* great fires */
  const fires=[];
  for(let i=0;i<7;i++){
    const f=makeFlame({seed:i*1.7, scale:2.6+Math.random()*2.2, speed:1.1});
    const fm=new THREE.Mesh(new THREE.PlaneGeometry(5+i*0.4,7+i*0.6),f);
    fm.position.set(-30+i*9, 2.2, -26-Math.random()*22);
    g.add(fm); fires.push(f);
  }
  /* firestorm embers */
  const embers=makeEmbers(650,{box:[150,42,110], rise:4.5, size:4.4, wind:new THREE.Vector2(1.6,0.6), curl:1.8,
    colA:new THREE.Color(1.0,0.45,0.10), colB:new THREE.Color(1.0,0.85,0.35)}); g.add(embers);

  /* two armies facing off */
  const armyA=makeArmy(20,34,{base:new THREE.Color(0.16,0.07,0.03), rimCol:new THREE.Color(1.0,0.55,0.2)});
  armyA.position.set(-16,0,6); g.add(armyA);
  const armyB=makeArmy(20,34,{base:new THREE.Color(0.10,0.05,0.06), rimCol:new THREE.Color(0.7,0.5,0.9)});
  armyB.position.set(16,0,6); g.add(armyB);

  /* arrow volleys crossing */
  const arrows=[];
  for(let i=0;i<10;i++){
    const a=makeArrow(i%2?0xffd070:0xff9040);
    a.userData.dir=i%2?1:-1;
    a.userData.speed=34+Math.random()*20;
    a.userData.start=(i*1.7)%11;
    a.position.y=2+Math.random()*7;
    g.add(a); arrows.push(a);
  }
  const ram=makeFigure({bow:true, base:new THREE.Color(0.16,0.08,0.03)});
  ram.position.set(-4,0,2); ram.rotation.y=0.35; g.add(ram);
  const ravanGlow=makeFigure({base:new THREE.Color(0.10,0.02,0.04), rimCol:new THREE.Color(0.9,0.3,0.7), rimStr:2.2, mace:true});
  ravanGlow.position.set(10,0.6,0); ravanGlow.scale.setScalar(1.45); ravanGlow.rotation.y=-0.4; g.add(ravanGlow);

  const rig=camRig([
    {t:0,  pos:[-14,2.6,14], look:[-4,1.6,0],  fov:46},
    {t:24, pos:[-6,2.2,10],  look:[2,2.0,-2],  fov:42},
    {t:52, pos:[2,3.4,7],    look:[8,2.4,-6],  fov:44},
    {t:80, pos:[6,2.4,9],    look:[4,3.4,-10], fov:40},
  ]);
  return { group:g, sky, rig, update(t,dt){
      sky.userData.u.uTime.value=t; embers.userData.u.uTime.value=t;
      fires.forEach((f,i)=>f.uniforms.uTime.value=t+i*0.23);
      arrows.forEach((a,i)=>{
        const span=44;
        const tt=((t*0.2+a.userData.start)%1)*span*2- (a.userData.dir>0?0:0);
        const x=a.userData.dir>0 ? -26+((t+a.userData.start)%2.2)*a.userData.speed*0.5
                                : 26-((t+a.userData.start)%2.2)*a.userData.speed*0.5;
        a.position.x=x;
        a.rotation.y=a.userData.dir>0?Math.PI/2:-Math.PI/2;
        a.userData.mat.color.multiplyScalar(1.0);
      });
      armyA.children.forEach((m,i)=>{ m.rotation.y=0.2+Math.sin(t*3+i)*0.15; m.position.y=Math.abs(Math.sin(t*4.4+i*0.7))*0.22; });
      armyB.children.forEach((m,i)=>{ m.rotation.y=-0.2-Math.sin(t*3.3+i)*0.15; m.position.y=Math.abs(Math.sin(t*4.1+i*0.9))*0.22; });
      ram.rotation.y=0.35+Math.sin(t*1.4)*0.06;
    }, ray:{center:[0.5,0.26], strength:0.9},
    grade:{exposure:1.1, tintAmt:0.6} };
}

/* ---------- Scene 8: First Deepavali — Ayodhya at night, sea of diyas ---------- */
export function sceneDeepavali(){
  const g=new THREE.Group();
  const sky=makeSky({top:new THREE.Color(0.015,0.015,0.05), horizon:new THREE.Color(0.30,0.10,0.03),
    sunDir:new THREE.Vector3(-0.3,0.14,-1), sunCol:new THREE.Color(1.0,0.5,0.2),
    glow:1.0, stars:1.0, clouds:0.12, cloudCol:new THREE.Color(0.2,0.07,0.03)});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1200,24,16),sky); g.add(dome);

  /* palace + skyline */
  const palace=makeTemple(11,17,9); palace.position.set(-6,0,-34); g.add(palace);
  for(let i=0;i<10;i++){
    const t=makeTemple(3+Math.random()*3,4+Math.random()*8,3);
    t.position.set(-44+i*9+(Math.random()-0.5)*4,0,-20-Math.random()*28);
    g.add(t);
  }
  /* ground dark */
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(260,180,40,28), new THREE.MeshBasicMaterial({color:0x0d0805}));
  ground.rotation.x=-Math.PI/2; g.add(ground);

  /* rows upon rows of diyas — the heart of the finale */
  const flames=[];
  const rows=[[ -14, -6, 26 ],[ -14, -10, 34 ],[ -14, -15, 42 ],[ -13, -21, 30 ],[ -14, -26, 38 ]];
  rows.forEach(([x0,z0,n],ri)=>{
    for(let i=0;i<n;i++){
      const d=makeDiya(ri*31+i*7);
      d.position.set(x0+i*1.1+(Math.random()-0.5)*0.5, 0.05, z0+(Math.random()-0.5)*1.1);
      d.rotation.y=Math.random()*6.283;
      g.add(d); flames.push(d.userData.flame);
    }
  });
  /* diyas along the path back to palace door */
  for(let i=0;i<14;i++){
    const d=makeDiya(i*3.3);
    d.position.set(-5.4+(i%2?0.75:0), 0.05, -8-i*1.9);
    g.add(d); flames.push(d.userData.flame);
  }

  /* celebration fireworks */
  const fw=makeEmbers(560,{box:[150,55,130], rise:5.0, size:4.6, wind:new THREE.Vector2(0.5,0.2), curl:2.4,
    colA:new THREE.Color(1.0,0.6,0.2), colB:new THREE.Color(1.0,0.9,0.6)}); g.add(fw);

  /* returning procession silhouette */
  const ram=makeFigure({bow:true, base:new THREE.Color(0.16,0.08,0.03), rimCol:new THREE.Color(1.0,0.8,0.4)});
  const sita=makeFigure({base:new THREE.Color(0.14,0.10,0.05), rimCol:new THREE.Color(1.0,0.8,0.4)});
  const lak=makeFigure({mace:true, base:new THREE.Color(0.12,0.07,0.03)});
  const proc=new THREE.Group();
  ram.position.set(-1.2,0,0); sita.position.set(0,0,0.2); lak.position.set(1.2,0,0);
  proc.add(ram,sita,lak); proc.position.set(1,0,-6); proc.rotation.y=Math.PI;
  g.add(proc);

  const rig=camRig([
    {t:0,   pos:[2,2.4,10],  look:[-6,4,-30],  fov:46},
    {t:28,  pos:[0,3.4,4],   look:[-6,6,-30],  fov:42},
    {t:62,  pos:[-2,5.5,-2], look:[-8,8,-34],  fov:40},
    {t:96,  pos:[-4,9,-8],   look:[-10,10,-36],fov:44},
    {t:128, pos:[-6,12,-14], look:[-10,9,-34], fov:48},
  ]);
  return { group:g, sky, rig, update(t,dt){
      sky.userData.u.uTime.value=t; fw.userData.u.uTime.value=t;
      flames.forEach((f,i)=>f.uniforms.uTime.value=t+ (i%13)*0.31);
      proc.position.z=-6-((t*0.55)%60)*0.22;
      proc.position.y=Math.sin(t*2.6)*0.025;
      ram.rotation.y=Math.PI; sita.rotation.y=Math.PI; lak.rotation.y=Math.PI;
    }, ray:{center:[0.5,0.3], strength:0.8},
    grade:{exposure:1.12, tintAmt:0.6} };
}
