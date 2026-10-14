/* Props, materials and figure builders — all procedural, no external assets. */
import * as THREE from './vendor/three.module.min.js';
import { LIB } from './engine.js';

/* ================= Materials ================= */

/* Stylized lit material: warm key, cool fill, gold rim, height fog, flicker */
export function makeLit(opts={}){
  const u={
    uKeyDir:{value:opts.keyDir||new THREE.Vector3(-0.6,0.8,0.35)},
    uKeyCol:{value:opts.keyCol||new THREE.Color(1.0,0.72,0.38)},
    uFillCol:{value:opts.fillCol||new THREE.Color(0.16,0.14,0.28)},
    uRimCol:{value:opts.rimCol||new THREE.Color(1.0,0.62,0.20)},
    uRimPow:{value:opts.rimPow??2.6},
    uRimStr:{value:opts.rimStr??1.0},
    uBase:{value:opts.base||new THREE.Color(0.10,0.07,0.05)},
    uEmissive:{value:opts.emissive||new THREE.Color(0,0,0)},
    uFogCol:{value:opts.fogCol||new THREE.Color(0.05,0.03,0.02)},
    uFogDen:{value:opts.fogDen??0.0016},
    uTime:{value:0},
    uFlicker:{value:opts.flicker??0},
  };
  const m=new THREE.ShaderMaterial({
    uniforms:u,
    vertexShader:/*glsl*/`
      varying vec3 vN; varying vec3 vW;
      void main(){
        vec4 wp=modelMatrix*vec4(position,1.0); vW=wp.xyz;
        vN=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader:/*glsl*/`
      varying vec3 vN; varying vec3 vW;
      uniform vec3 uKeyDir,uKeyCol,uFillCol,uRimCol,uBase,uEmissive,uFogCol;
      uniform float uRimPow,uRimStr,uFogDen,uTime,uFlicker; ${LIB}
      void main(){
        vec3 n=normalize(vN);
        vec3 v=normalize(cameraPosition-vW);
        float diff=max(dot(n,uKeyDir),0.0);
        float back=max(dot(n,-uKeyDir),0.0);
        vec3 col=uBase*(uFillCol*0.9+uKeyCol*diff*1.25+uFillCol*back*0.35);
        float rim=pow(1.0-max(dot(n,v),0.0), uRimPow);
        col+=uRimCol*rim*uRimStr;
        col+=uEmissive;
        if(uFlicker>0.0){ col*=1.0+0.06*uFlicker*sin(uTime*11.0+vW.x*3.7); }
        float fog=1.0-exp(-uFogDen*length(cameraPosition-vW));
        col=mix(col,uFogCol,fog);
        gl_FragColor=vec4(col,1.0);
      }`
  });
  m.userData.u=u; return m;
}

/* Sky dome: gradient, stars, sun glow, drifting clouds */
export function makeSky(opts={}){
  const u={
    uTop:{value:opts.top||new THREE.Color(0.02,0.03,0.08)},
    uHorizon:{value:opts.horizon||new THREE.Color(0.45,0.18,0.05)},
    uSunDir:{value:opts.sunDir||new THREE.Vector3(0,0.12,-1)},
    uSunCol:{value:opts.sunCol||new THREE.Color(1.0,0.55,0.18)},
    uSunSize:{value:opts.sunSize??0.045},
    uGlow:{value:opts.glow??1.4},
    uStars:{value:opts.stars??1.0},
    uClouds:{value:opts.clouds??0.0},
    uCloudCol:{value:opts.cloudCol||new THREE.Color(0.35,0.12,0.05)},
    uTime:{value:0},
  };
  const m=new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false,
    uniforms:u,
    vertexShader:/*glsl*/`
      varying vec3 vDir;
      void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:/*glsl*/`
      varying vec3 vDir;
      uniform vec3 uTop,uHorizon,uSunDir,uSunCol,uCloudCol;
      uniform float uSunSize,uGlow,uStars,uClouds,uTime; ${LIB}
      void main(){
        vec3 d=normalize(vDir);
        float h=clamp(d.y,0.0,1.0);
        vec3 col=mix(uHorizon,uTop,pow(h,0.62));
        float sd=max(dot(d,normalize(uSunDir)),0.0);
        col+=uSunCol*uGlow*pow(sd,22.0);
        col+=uSunCol*2.6*smoothstep(uSunSize, uSunSize*0.42, 1.0-sd);
        if(uStars>0.01 && d.y>0.02){
          vec2 sp=d.xz/(d.y+0.35)*7.0;
          float st=hash12(floor(sp*36.0));
          float tw=0.72+0.28*sin(uTime*2.2+st*40.0);
          float star=step(0.9945-uStars*0.004,st)*uStars*tw*smoothstep(0.0,0.25,d.y);
          col+=vec3(star)*(0.7+0.3*hash12(floor(sp*36.0)+7.7));
        }
        if(uClouds>0.001){
          vec2 cp=d.xz/max(d.y,0.045)*0.55;
          float cl=fbm(cp*1.15+vec2(uTime*0.008,0.));
          float cm=smoothstep(0.52,0.80,cl)*uClouds*smoothstep(0.02,0.22,d.y);
          col=mix(col,uCloudCol,cm*0.85);
        }
        gl_FragColor=vec4(col,1.0);
      }`
  });
  m.userData.u=u; return m;
}

/* Water: waves (vertex), derivative normals, fresnel, sun specular, shore foam */
export function makeWater(opts={}){
  const u={
    uTime:{value:0},
    uDeep:{value:opts.deep||new THREE.Color(0.015,0.03,0.045)},
    uShallow:{value:opts.shallow||new THREE.Color(0.06,0.09,0.10)},
    uSkyCol:{value:opts.skyCol||new THREE.Color(0.28,0.10,0.04)},
    uSunDir:{value:opts.sunDir||new THREE.Vector3(-0.3,0.18,-0.9)},
    uSunCol:{value:opts.sunCol||new THREE.Color(1.0,0.5,0.15)},
    uAmp:{value:opts.amp??0.42},
    uFoamX:{value:opts.foamX??-9999},
    uFoamW:{value:opts.foamW??6.0},
    uCalm:{value:opts.calm??1.0},
  };
  const m=new THREE.ShaderMaterial({
    uniforms:u,
    vertexShader:/*glsl*/`
      varying vec3 vW; varying float vH;
      uniform float uTime,uAmp,uCalm;
      void main(){
        vec3 p=position;
        float t=uTime*0.85;
        float w1=sin(p.x*0.055+t*1.1+p.z*0.031);
        float w2=sin(p.z*0.089-t*0.9+p.x*0.041)*0.55;
        float w3=sin((p.x+p.z)*0.142+t*1.7)*0.30*uCalm;
        p.y+=(w1+w2+w3)*uAmp;
        vH=(w1+w2+w3)*uAmp;
        vec4 wp=modelMatrix*vec4(p,1.0); vW=wp.xyz;
        gl_Position=projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader:/*glsl*/`
      varying vec3 vW; varying float vH;
      uniform float uTime,uFoamX,uFoamW; ${LIB}
      uniform vec3 uDeep,uShallow,uSkyCol,uSunDir,uSunCol;
      void main(){
        vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));
        if(n.y<0.0) n=-n;
        vec3 v=normalize(cameraPosition-vW);
        float fres=pow(1.0-max(dot(n,v),0.0),3.2);
        float hgl=smoothstep(-0.5,0.7,vH);
        vec3 col=mix(uDeep,uShallow,hgl*0.8);
        col=mix(col,uSkyCol,fres*0.75);
        vec3 sd=normalize(uSunDir);
        float spec=pow(max(dot(reflect(-v,n),sd),0.0),42.0);
        col+=uSunCol*spec*1.6;
        float ripple=fbm(vW.xz*0.22+vec2(uTime*0.35,uTime*0.21));
        col+=uSunCol*0.24*smoothstep(0.62,0.9,ripple);
        float foam=1.0-smoothstep(0.0,uFoamW,abs(vW.x-uFoamX));
        float ft=fbm(vW.xz*0.6+vec2(0.,uTime*0.9));
        col+=vec3(0.9,0.75,0.5)*foam*smoothstep(0.35,0.75,ft)*0.55;
        gl_FragColor=vec4(col,1.0);
      }`
  });
  m.userData.u=u; return m;
}

/* Procedural flame billboard (diyas, pyres, lamps) */
export function makeFlame(opts={}){
  const u={
    uTime:{value:0}, uSeed:{value:opts.seed||0},
    uColA:{value:opts.colA||new THREE.Color(1.0,0.80,0.25)},
    uColB:{value:opts.colB||new THREE.Color(1.0,0.32,0.05)},
    uScale:{value:opts.scale??1},
    uSpeed:{value:opts.speed??1},
  };
  const m=new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:u,
    vertexShader:/*glsl*/`
      varying vec2 vP;
      void main(){ vP=uv*2.-1.;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:/*glsl*/`
      varying vec2 vP;
      uniform float uTime,uSeed,uScale,uSpeed; uniform vec3 uColA,uColB; ${LIB}
      void main(){
        vec2 p=vP; p.y+=1.0; p*=vec2(2.4,1.6)*uScale;
        float t=uTime*2.3*uSpeed+uSeed*17.0;
        p.x+=sin(t*1.7+p.y*4.0)*0.22*(1.0-p.y*0.5);
        float body=fbm3(vec2(p.x*3.0,p.y*2.4-t*1.6)+uSeed);
        float shape=1.0-smoothstep(0.0,1.0,length(vec2(p.x*0.85,p.y*0.42-0.12)));
        float flame=shape*smoothstep(0.28,0.72,body+shape*0.42);
        flame*=smoothstep(1.0,0.15,p.y);
        float core=smoothstep(0.55,0.9,body+shape*0.5)*smoothstep(0.8,0.0,p.y);
        vec3 col=mix(uColB,uColA,core)*flame*2.4;
        gl_FragColor=vec4(col,flame);
      }`
  });
  m.userData.u=u; return m;
}

/* Flame billboard mesh, faces camera each frame (call .tick(t)) */
export function flameSprite(opts={}){
  const m=makeFlame(opts);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1.4),m);
  mesh.userData.u=m.userData.u||m.uniforms;
  mesh.tick=(t)=>{ m.uniforms.uTime.value=t; mesh.quaternion.copy(mesh.parent?_camQuat:mesh.quaternion); };
  return mesh;
}
let _camQuat=new THREE.Quaternion();
export function setBillboardSource(cam){ _camQuat=cam.quaternion; }

/* Ember/spark particle field */
export function makeEmbers(count, opts={}){
  const geo=new THREE.BufferGeometry();
  const pos=new Float32Array(count*3), data=new Float32Array(count*4);
  const box=opts.box||[80,30,80];
  for(let i=0;i<count;i++){
    pos[i*3]= (Math.random()-0.5)*box[0];
    pos[i*3+1]= Math.random()*box[1];
    pos[i*3+2]= (Math.random()-0.5)*box[2];
    data[i*4]=Math.random()*6.283; data[i*4+1]=0.35+Math.random()*0.9;
    data[i*4+2]=Math.random(); data[i*4+3]=1+Math.floor(Math.random()*3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('aData', new THREE.BufferAttribute(data,4));
  const u={
    uTime:{value:0}, uRise:{value:opts.rise??2.2},
    uColA:{value:opts.colA||new THREE.Color(1.0,0.62,0.16)},
    uColB:{value:opts.colB||new THREE.Color(1.0,0.90,0.45)},
    uSize:{value:opts.size??3.2}, uWind:{value:opts.wind||new THREE.Vector2(1.2,0.4)},
    uBox:{value:new THREE.Vector3(box[0],box[1],box[2])},
    uCurl:{value:opts.curl??1.0},
  };
  const m=new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:u,
    vertexShader:/*glsl*/`
      attribute vec4 aData;
      uniform float uTime,uRise,uSize,uCurl; uniform vec2 uWind; uniform vec3 uBox;
      varying float vKind; varying float vLife;
      void main(){
        float ph=aData.x, sp=aData.y, kind=aData.w; vKind=kind;
        float t=uTime*sp+ph*6.283;
        vec3 p=position;
        p.y=mod(p.y+uRise*uTime*sp, uBox.y);
        p.x+=uWind.x*uTime*0.2+sin(t*0.9)*uCurl*1.6;
        p.z+=uWind.y*uTime*0.2+cos(t*1.3)*uCurl*1.2;
        vLife=fract((uTime*0.11*sp)+ph);
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        float flick=0.65+0.35*sin(t*7.0);
        gl_PointSize=uSize*flick*(28.0/max(1.0,-mv.z))*(0.6+0.4*vLife);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader:/*glsl*/`
      varying float vKind; varying float vLife;
      uniform vec3 uColA,uColB;
      void main(){
        vec2 c=gl_PointCoord-0.5; float d=length(c);
        float a=smoothstep(0.5,0.05,d)*smoothstep(0.0,0.18,vLife)*smoothstep(1.0,0.72,vLife);
        vec3 col=mix(uColA,uColB,vKind*0.33);
        gl_FragColor=vec4(col*a*2.2,a);
      }`
  });
  const pts=new THREE.Points(geo,m); pts.userData.u=u; pts.frustumCulled=false; return pts;
}

/* Stylized humanoid figure assembled from primitives */
export function makeFigure(opts={}){
  const g=new THREE.Group();
  const mat=makeLit({base:opts.base||new THREE.Color(0.09,0.05,0.03),
    rimCol:opts.rimCol||new THREE.Color(1.0,0.62,0.22), rimStr:opts.rimStr??1.6,
    rimPow:opts.rimPow??2.2, ...opts});
  const cap=(r,h)=>new THREE.Mesh(new THREE.CapsuleGeometry(r,h,4,10),mat);
  const sph=(r)=>new THREE.Mesh(new THREE.SphereGeometry(r,12,10),mat);
  const body=cap(0.34,0.9); body.position.y=1.05;
  const head=sph(0.26); head.position.y=1.86;
  const crown=new THREE.Mesh(new THREE.ConeGeometry(0.17,0.34,8),mat); crown.position.y=2.16;
  const armL=cap(0.10,0.72); armL.position.set(-0.5,1.28,0); armL.rotation.z=0.12;
  const armR=cap(0.10,0.72); armR.position.set(0.5,1.28,0); armR.rotation.z=-0.12;
  const legL=cap(0.13,0.8); legL.position.set(-0.2,0.36,0);
  const legR=cap(0.13,0.8); legR.position.set(0.2,0.36,0);
  const dhoti=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.55,0.62,10),mat); dhoti.position.y=0.78;
  g.add(body,head,crown,armL,armR,legL,legR,dhoti);
  if(opts.bow){
    const bow=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.035,6,20,Math.PI*1.15),mat);
    bow.position.set(0.1,1.35,-0.28); bow.rotation.set(0,Math.PI/2,0.5); g.add(bow);
  }
  if(opts.mace){ const mace=new THREE.Mesh(new THREE.SphereGeometry(0.13,8,8),mat); mace.position.set(0.62,1.0,0); g.add(mace); }
  g.userData.mat=mat;
  return g;
}

/* Hanuman figure: bigger, tail */
export function makeHanuman(opts={}){
  const g=makeFigure({...opts, base:opts.base||new THREE.Color(0.28,0.10,0.04)});
  const mat=g.userData.mat;
  const tailPts=[];
  for(let i=0;i<=14;i++){ const f=i/14;
    tailPts.push(new THREE.Vector3(-0.55-f*0.30, 0.5+f*1.9+Math.sin(f*2.2)*0.22, 0.06+f*0.12)); }
  const tail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailPts),16,0.075,6),mat);
  g.add(tail);
  const gada=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,10),mat); gada.position.set(0.68,1.06,0);
  g.add(gada);
  g.userData.mat=mat; return g;
}


/* Golden deer (marich) */
export function makeGoldenDeer(){
  const g=new THREE.Group();
  const mat=makeLit({base:new THREE.Color(0.55,0.35,0.06), rimCol:new THREE.Color(1.0,0.8,0.35),
    rimStr:2.4, emissive:new THREE.Color(0.10,0.05,0.005)});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.32,0.8,4,10),mat); body.rotation.z=Math.PI/2; body.position.y=0.85;
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.12,0.7,8),mat); neck.position.set(0.72,1.35,0); neck.rotation.z=-0.5;
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8),mat); head.position.set(0.98,1.6,0);
  const antlers=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.5,5),mat); antlers.position.set(0.98,1.95,0);
  g.add(body,neck,head,antlers);
  for(const [x,z] of [[0.45,0.16],[0.45,-0.16],[-0.4,0.16],[-0.4,-0.16]]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.04,0.85,6),mat);
    leg.position.set(x,0.42,z); g.add(leg);
  }
  g.userData.mat=mat; return g;
}
