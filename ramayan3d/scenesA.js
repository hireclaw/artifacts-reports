/* Scenes 1–4: Birth · Vanvas · Sita-haran · Jatayu */
import * as THREE from './vendor/three.module.min.js';
import { makeSky, makeWater, makeEmbers } from './props.js';
import { LIB } from './engine.js';
import { makeFigure, makeHanuman, makeGoldenDeer } from './props.js';
import { makeTemple, makeTree, makeMountain, makeVimana, makeJatayu, camRig, easeIO, clamp01 } from './props2.js';

/* ---------- Scene 1: Janm — Ayodhya, golden night, fireworks ---------- */
export function sceneBirth(){
  const g=new THREE.Group();
  const sky=makeSky({top:new THREE.Color(0.03,0.02,0.07), horizon:new THREE.Color(0.42,0.16,0.05),
    sunDir:new THREE.Vector3(0.25,0.30,-1), sunCol:new THREE.Color(1.0,0.6,0.25),
    glow:1.2, stars:0.9, clouds:0.25, cloudCol:new THREE.Color(0.30,0.10,0.04)});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1200,24,16),sky); g.add(dome);

  const palMat={base:new THREE.Color(0.20,0.12,0.05), rimCol:new THREE.Color(1.0,0.72,0.30), rimStr:1.7};
  const palace=makeTemple(10,16,8); palace.position.set(-6,0,-30); g.add(palace);
  for(let i=0;i<9;i++){
    const t=makeTemple(3+Math.random()*3,5+Math.random()*8,3);
    t.position.set(-40+i*10+(Math.random()-0.5)*4,0,-18-Math.random()*30);
    t.rotation.y=(Math.random()-0.5)*0.4;
    g.add(t);
  }
  /* strings of festival lights */
  const lightMat=new THREE.MeshBasicMaterial({color:0xffb040});
  for(let i=0;i<6;i++){
    const curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(-30+i*9,8,-12), new THREE.Vector3(-26+i*9,6.4,-11),
      new THREE.Vector3(-22+i*9,8,-12)]);
    const line=new THREE.Mesh(new THREE.TubeGeometry(curve,8,0.035,5),lightMat); g.add(line);
    for(let j=0;j<6;j++){ const p=curve.getPoint(j/5);
      const b=new THREE.Mesh(new THREE.SphereGeometry(0.09,6,6),lightMat);
      b.position.copy(p).y-=0.14; g.add(b); }
  }
  /* firework bursts */
  const sparks=makeEmbers(400,{box:[120,50,120], rise:5.5, size:4.2, wind:new THREE.Vector2(0.6,0.2),
    curl:2.2, colA:new THREE.Color(1.0,0.55,0.15), colB:new THREE.Color(1.0,0.9,0.55)}); g.add(sparks);
  /* crowd bokeh at courtyard */
  for(let i=0;i<26;i++){
    const f=makeFigure({base:new THREE.Color(0.10,0.06,0.03)});
    f.position.set(-14+Math.random()*28, 0, -8+Math.random()*10);
    f.scale.setScalar(0.75+Math.random()*0.4);
    f.rotation.y=Math.random()*6.283;
    g.add(f);
  }
  /* cradle glow (birth) — elevated warm orb inside palace door */
  const cradle=new THREE.Mesh(new THREE.SphereGeometry(0.5,12,10),
    new THREE.MeshBasicMaterial({color:0xffc060}));
  cradle.position.set(-6,6.5,-26); g.add(cradle);
  const cradleGlow=makeEmbers(40,{box:[6,5,6],rise:1.2,size:6,wind:new THREE.Vector2(0,0),curl:0.5,
    colA:new THREE.Color(1.0,0.8,0.4),colB:new THREE.Color(1.0,0.6,0.2)});
  cradleGlow.position.set(-6,4.5,-26); g.add(cradleGlow);

  const rig=camRig([
    {t:0,  pos:[14,3.2,6], look:[-6,5,-26], fov:48},
    {t:28, pos:[6,4.5,2],  look:[-6,6,-26], fov:44},
    {t:56, pos:[2,6.5,-6], look:[-6,8,-30], fov:40},
    {t:88, pos:[-2,8,-12], look:[-8,10,-32],fov:42},
  ]);
  return { group:g, sky, rig, sparks, update(t,dt){
      sky.userData.u.uTime.value=t;
      sparks.userData.u.uTime.value=t;
      sparks.userData.u.uTime.value=t;
      cradle.scale.setScalar(1+0.14*Math.sin(t*2.2));
    }, ray:{center:[0.22,0.30], strength:0.35},
    grade:{exposure:1.05, tintAmt:0.55} };
}

/* ---------- Scene 2: Vanvas — forest exile, dappled god rays ---------- */
export function sceneVanas(){
  const g=new THREE.Group();
  const sky=makeSky({top:new THREE.Color(0.10,0.16,0.30), horizon:new THREE.Color(0.85,0.45,0.14),
    sunDir:new THREE.Vector3(-0.35,0.26,-1), sunCol:new THREE.Color(1.0,0.72,0.30),
    glow:1.8, stars:0.0, clouds:0.45, cloudCol:new THREE.Color(0.55,0.28,0.10)});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1100,24,16),sky); g.add(dome);

  const groundGeo=new THREE.PlaneGeometry(220,160,48,32);
  const gp=groundGeo.attributes.position;
  for(let i=0;i<gp.count;i++){
    const x=gp.getX(i),y=gp.getY(i);
    gp.setZ(i, Math.sin(x*0.12)*0.7+Math.cos(y*0.17)*0.5+(Math.sin(x*0.05+y*0.04))*0.8);
  }
  groundGeo.computeVertexNormals();
  const ground=new THREE.Mesh(groundGeo, new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},
    vertexShader:`varying vec3 vW; void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader:`varying vec3 vW; uniform float uTime; ${LIB}
      void main(){ vec3 n=normalize(cross(dFdx(vW),dFdy(vW))); if(n.y<0.) n=-n;
        vec3 col=vec3(0.10,0.065,0.035)*(0.4+0.6*max(dot(n,normalize(vec3(-0.3,0.7,-0.5))),0.));
        col+=vec3(0.35,0.2,0.06)*pow(1.0-max(n.y,0.),2.5)*0.4;
        float mist=fbm(vW.xz*0.06+vec2(uTime*0.015,0.));
        col+=vec3(0.20,0.12,0.05)*smoothstep(0.55,0.9,mist)*0.5;
        gl_FragColor=vec4(col,1.); }`
  }));
  g.add(ground);

  const trees=new THREE.Group();
  for(let i=0;i<46;i++){
    const h=5+Math.random()*6;
    const tr=makeTree(h);
    const x=(Math.random()-0.5)*180, z=-10-Math.random()*90;
    if(Math.abs(x)<7 && z>-24) continue;   /* keep the walking path clear */
    tr.position.set(x,-0.2,z);
    tr.rotation.y=Math.random()*6.283;
    trees.add(tr);
  }
  g.add(trees);

  /* three walking figures along path */
  const ram=makeFigure({bow:true, base:new THREE.Color(0.16,0.08,0.03)});
  const sita=makeFigure({base:new THREE.Color(0.14,0.10,0.05)});
  const lak=makeFigure({mace:true, base:new THREE.Color(0.12,0.07,0.03)});
  const trio=new THREE.Group();
  ram.position.set(-1.1,0,0); sita.position.set(0,0,0.3); lak.position.set(1.1,0,0);
  sita.scale.setScalar(0.92);
  trio.add(ram,sita,lak); g.add(trio);

  /* fireflies */
  const flies=makeEmbers(140,{box:[70,14,70], rise:0.25, size:3.4, wind:new THREE.Vector2(0.2,0.1), curl:1.4,
    colA:new THREE.Color(1.0,0.75,0.25), colB:new THREE.Color(0.7,1.0,0.5)}); g.add(flies);

  const rig=camRig([
    {t:0,  pos:[0,2.0,9],  look:[0,1.6,-6],  fov:46},
    {t:26, pos:[2.4,2.6,7],look:[0,1.8,-10], fov:42},
    {t:54, pos:[-3,3.4,3], look:[1,2.0,-14], fov:44},
    {t:86, pos:[0,4.6,-2], look:[0,2.4,-26], fov:40},
  ]);
  return { group:g, sky, rig, update(t,dt){
      sky.userData.u.uTime.value=t; flies.userData.u.uTime.value=t;
      ground.material.uniforms.uTime.value=t;
      const wl=1.5+Math.sin(t*0.4)*0.5;
      trio.position.z=-wl;
      trio.position.y=Math.sin(t*2.4)*0.03;
      ram.rotation.y=Math.PI; sita.rotation.y=Math.PI; lak.rotation.y=Math.PI;
    }, ray:{center:[0.34,0.36], strength:0.85},
    grade:{exposure:1.0, tintAmt:0.5} };
}

/* ---------- Scene 3: Sita haran — golden deer, storm, abduction ---------- */
export function sceneHaran(){
  const g=new THREE.Group();
  const sky=makeSky({top:new THREE.Color(0.05,0.05,0.10), horizon:new THREE.Color(0.35,0.16,0.10),
    sunDir:new THREE.Vector3(0.4,0.22,-1), sunCol:new THREE.Color(1.0,0.45,0.20),
    glow:1.1, stars:0.25, clouds:0.85, cloudCol:new THREE.Color(0.22,0.09,0.06)});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1200,24,16),sky); g.add(dome);

  /* clearing ground */
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,140,32,24), new THREE.MeshBasicMaterial({color:0x1a120a}));
  ground.rotation.x=-Math.PI/2; g.add(ground);

  const trees=new THREE.Group();
  for(let i=0;i<30;i++){
    const tr=makeTree(5+Math.random()*5);
    const ang=Math.random()*6.283, rr=16+Math.random()*55;
    tr.position.set(Math.cos(ang)*rr, -0.2, Math.sin(ang)*rr*0.7-6);
    trees.add(tr);
  }
  g.add(trees);

  /* golden deer glimmer */
  const deer=makeGoldenDeer(); deer.position.set(5,0,-12); deer.rotation.y=0.5; g.add(deer);
  const deerGlow=makeEmbers(60,{box:[5,4,5],rise:0.7,size:5.5,wind:new THREE.Vector2(0,0),curl:0.4,
    colA:new THREE.Color(1.0,0.85,0.45),colB:new THREE.Color(1.0,0.6,0.2)});
  deerGlow.position.set(5,0.6,-12); g.add(deerGlow);

  /* storm wind streak particles */
  const wind=makeEmbers(260,{box:[140,36,90], rise:0.15, size:2.6, wind:new THREE.Vector2(9.0,1.0), curl:0.35,
    colA:new THREE.Color(0.45,0.28,0.16), colB:new THREE.Color(0.25,0.16,0.10)}); g.add(wind);

  /* vimana rising with Sita silhouette */
  const vim=makeVimana(1.35); vim.position.set(0,26,-42); vim.rotation.y=0.35; g.add(vim);
  const sita=makeFigure({base:new THREE.Color(0.14,0.10,0.05), rimCol:new THREE.Color(1.0,0.75,0.4)});
  sita.position.set(0.2,1.05,0.4); sita.scale.setScalar(0.8); vim.add(sita);
  const sitaCloth=new THREE.Mesh(new THREE.PlaneGeometry(1.2,2.6),
    new THREE.MeshBasicMaterial({color:0xffcf7a, transparent:true, opacity:0.5, side:THREE.DoubleSide}));
  sitaCloth.position.set(0.2,0.35,0.9); sitaCloth.rotation.x=-0.9; vim.add(sitaCloth);

  const rig=camRig([
    {t:0,  pos:[8,2.2,-2],  look:[5,1.2,-12], fov:44},
    {t:20, pos:[6.5,1.6,-6],look:[5,1.4,-12], fov:40},
    {t:38, pos:[2,4.0,-4],  look:[2,10,-30],  fov:48},
    {t:60, pos:[0,9,-8],    look:[0,22,-40],  fov:46},
    {t:92, pos:[-4,16,-2],  look:[1,26,-40],  fov:44},
  ]);
  return { group:g, sky, rig, update(t,dt){
      sky.userData.u.uTime.value=t; wind.userData.u.uTime.value=t;
      deerGlow.userData.u.uTime.value=t;
      deer.position.y=Math.sin(t*1.8)*0.05;
      const f=clamp01((t-26)/16), e=easeIO(f);
      vim.position.y=26-26*(1-e);
      vim.position.x=Math.sin(t*0.6)*3-2*e;
      vim.position.z=-42+10*e+Math.sin(t*0.8)*1.2;
      vim.rotation.z=Math.sin(t*0.9)*0.06;
      sita.rotation.y=Math.PI;
    }, ray:{center:[0.42,0.42], strength:0.5},
    grade:{exposure:0.92, tintAmt:0.5} };
}

/* ---------- Scene 4: Jatayu — cliff, storm, the divine bird's stand ---------- */
export function sceneJatayu(){
  const g=new THREE.Group();
  const sky=makeSky({top:new THREE.Color(0.04,0.045,0.09), horizon:new THREE.Color(0.30,0.13,0.08),
    sunDir:new THREE.Vector3(-0.4,0.30,-1), sunCol:new THREE.Color(0.95,0.45,0.22),
    glow:0.9, stars:0.3, clouds:0.9, cloudCol:new THREE.Color(0.16,0.08,0.06)});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1200,24,16),sky); g.add(dome);

  const cliff=makeMountain(34,46,3); cliff.position.set(-26,-4,-40); cliff.rotation.y=0.6; g.add(cliff);
  const cliff2=makeMountain(22,30,7); cliff2.position.set(34,-4,-64); g.add(cliff2);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,160,40,28), new THREE.MeshBasicMaterial({color:0x14100a}));
  ground.rotation.x=-Math.PI/2; g.add(ground);

  /* rain streaks */
  const rain=makeEmbers(520,{box:[130,44,90], rise:0.0, size:2.2, wind:new THREE.Vector2(2.4,-9), curl:0.2,
    colA:new THREE.Color(0.30,0.24,0.18), colB:new THREE.Color(0.20,0.17,0.13)}); g.add(rain);
  /* NOTE: rise 0 & negative wind -> drift handled in shader; looks like slant rain */

  const bird=makeJatayu(); bird.position.set(2,16,-22); bird.scale.setScalar(1.5); g.add(bird);

  const rig=camRig([
    {t:0,  pos:[-4,20,-4],  look:[2,16,-22],  fov:46},
    {t:22, pos:[4,18,-10],  look:[2,14,-24],  fov:42},
    {t:48, pos:[6,10,-16],  look:[2,8,-22],   fov:44},
    {t:74, pos:[8,4.5,-16], look:[2,3,-21],   fov:40},
    {t:96, pos:[9.5,3.2,-15],look:[2,1.2,-20],fov:38},
  ]);
  return { group:g, sky, rig, update(t,dt){
      sky.userData.u.uTime.value=t; rain.userData.u.uTime.value=t;
      const flap=Math.sin(t*5.2)*0.55-0.15;
      bird.userData.wings[0].rotation.z=flap;
      bird.userData.wings[1].rotation.z=-flap;
      /* descending flight path with struggle */
      const f=clamp01(t/70), e=easeIO(f);
      bird.position.set(2+Math.sin(t*0.7)*3.5, 16-15*e+Math.sin(t*1.3)*1.2, -22-4*e+Math.cos(t*0.5)*1.5);
      bird.rotation.z=Math.sin(t*1.1)*0.16+0.22*e;
      bird.rotation.x=0.25+0.4*e;
    }, ray:{center:[0.30,0.34], strength:0.45},
    grade:{exposure:0.9, tintAmt:0.45} };
}
