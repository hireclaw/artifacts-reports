/* Props part 2: Jatayu, vimana, temples, trees, mountains, diyas, stones */
import * as THREE from './vendor/three.module.min.js';
import { LIB } from './engine.js';
import { makeLit, makeFlame, makeFigure } from './props.js';

/* Jatayu: giant divine bird, animated wings */
export function makeJatayu(){
  const g=new THREE.Group();
  const mat=makeLit({base:new THREE.Color(0.16,0.05,0.03), rimCol:new THREE.Color(1.0,0.55,0.18), rimStr:1.8});
  const body=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),mat); body.scale.set(1.5,0.9,2.4);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.45,10,8),mat); head.position.set(0,0.4,-2.3);
  const beak=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.7,6),mat); beak.position.set(0,0.32,-2.85); beak.rotation.x=-1.35;
  const tail=new THREE.Mesh(new THREE.ConeGeometry(0.4,2.2,6),mat); tail.position.set(0,0.2,2.6); tail.rotation.x=1.4;
  const legs=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.05,1.2,6),mat); legs.position.set(0,-1.0,0.8);
  g.add(body,head,beak,tail,legs);
  const wings=[];
  for(const s of [-1,1]){
    const w=new THREE.Group();
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(4.6,2.1,8,2),mat);
    plane.position.x=s*2.3;
    w.add(plane);
    w.position.set(s*1.2,0.35,-0.2);
    g.add(w); wings.push(w);
  }
  g.userData={mat,wings};
  return g;
}

/* Ravan's Pushpak vimana: golden tiered flying palace */
export function makeVimana(scale=1){
  const g=new THREE.Group();
  const mat=makeLit({base:new THREE.Color(0.30,0.17,0.05), rimCol:new THREE.Color(1.0,0.75,0.3), rimStr:2.0});
  const hull=new THREE.Mesh(new THREE.BoxGeometry(3.2,1.0,4.4),mat); hull.position.y=0.5;
  g.add(hull);
  for(let i=0;i<3;i++){
    const w=2.6-i*0.6, y=1.15+i*0.55;
    const tier=new THREE.Mesh(new THREE.CylinderGeometry(w*0.62,w,w*0.22,8),mat);
    tier.position.y=y; g.add(tier);
    const finial=new THREE.Mesh(new THREE.ConeGeometry(0.14,0.5,8),mat);
    finial.position.y=y+w*0.11+0.25; g.add(finial);
  }
  const glow=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8),
    new THREE.MeshBasicMaterial({color:0xffb54a}));
  glow.position.y=2.85; g.add(glow);
  /* wings/thrusters */
  const thr=new THREE.Mesh(new THREE.ConeGeometry(0.5,1.6,8),mat);
  thr.rotation.x=Math.PI/2; thr.position.set(0,0.55,2.9); g.add(thr);
  g.scale.setScalar(scale);
  g.userData.mat=mat;
  return g;
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

/* Indian temple / palace facade cluster */
export function makeTemple(w=6,h=9,d=6){
  const g=new THREE.Group();
  const mat=makeLit({base:new THREE.Color(0.22,0.13,0.06), rimCol:new THREE.Color(1.0,0.7,0.3), rimStr:1.5});
  const base=new THREE.Mesh(new THREE.BoxGeometry(w,h*0.55,d),mat); base.position.y=h*0.275;
  const tower=new THREE.Mesh(new THREE.ConeGeometry(w*0.38,h*0.5,8),mat); tower.position.y=h*0.55+h*0.25;
  const kalash=new THREE.Mesh(new THREE.SphereGeometry(w*0.045,8,8),mat); kalash.position.y=h*0.93;
  g.add(base,tower,kalash);
  /* door glow */
  const door=new THREE.Mesh(new THREE.PlaneGeometry(w*0.16,h*0.3),
    new THREE.MeshBasicMaterial({color:0xffa040}));
  door.position.set(0,h*0.18,d/2+0.02);
  g.add(door);
  g.userData.mat=mat; return g;
}

/* Stylized tree (vanvas forest) */
export function makeTree(h=6){
  const g=new THREE.Group();
  const mat=makeLit({base:new THREE.Color(0.05,0.09,0.04), rimCol:new THREE.Color(0.9,0.7,0.35), rimStr:0.8});
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.09*h,0.16*h,h*0.45,6),mat);
  trunk.position.y=h*0.22; g.add(trunk);
  const canopy=new THREE.Mesh(new THREE.IcosahedronGeometry(h*0.34,1),mat);
  canopy.position.y=h*0.62; canopy.scale.y=0.8; g.add(canopy);
  const canopy2=new THREE.Mesh(new THREE.IcosahedronGeometry(h*0.24,1),mat);
  canopy2.position.set(h*0.2,h*0.5,h*0.1); g.add(canopy2);
  g.userData.mat=mat; return g;
}

/* Rocky mountain / cliff */
export function makeMountain(r,h,seed=1){
  const mat=makeLit({base:new THREE.Color(0.07,0.05,0.045), rimCol:new THREE.Color(0.9,0.5,0.25), rimStr:0.9});
  const geo=new THREE.ConeGeometry(r,h,9,4);
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    if(y<h*0.49){
      pos.setX(i,x*(1+0.34*Math.sin(seed*3.1+z*0.7+x*0.5)));
      pos.setZ(i,z*(1+0.34*Math.cos(seed*2.3+x*0.6+z*0.4)));
    }
  }
  geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mat); m.userData.mat=mat; return m;
}

/* Floating stone (setu) */
export function makeStone(s=1,seed=0){
  const mat=makeLit({base:new THREE.Color(0.13,0.10,0.08), rimCol:new THREE.Color(1.0,0.65,0.3), rimStr:1.2});
  const geo=new THREE.DodecahedronGeometry(s,0);
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const f=1+0.30*Math.sin(seed*7.3+pos.getX(i)*3.1+pos.getZ(i)*2.7);
    pos.setX(i,pos.getX(i)*f); pos.setY(i,pos.getY(i)*(0.6+0.3*Math.sin(seed*5.1+i))); pos.setZ(i,pos.getZ(i)*f);
  }
  geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mat); m.userData.mat=mat; return m;
}

/* Diya: clay lamp + flame, instanced rows */
export function makeDiya(seed=0){
  const g=new THREE.Group();
  const clay=makeLit({base:new THREE.Color(0.16,0.08,0.05), rimCol:new THREE.Color(1.0,0.6,0.3), rimStr:1.0});
  const bowl=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,6,0,Math.PI*2,Math.PI*0.55,Math.PI*0.45),clay);
  bowl.scale.y=0.75; g.add(bowl);
  const flame=makeFlame({seed, scale:0.85});
  const fm=new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.8),flame);
  fm.position.y=0.38; g.add(fm);
  g.userData.flame=flame;
  return g;
}

/* Bow & arrow trail (war scene projectile) */
export function makeArrow(glow=0xffd070){
  const g=new THREE.Group();
  const mat=new THREE.MeshBasicMaterial({color:glow});
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,3.2,6),mat);
  shaft.rotation.x=Math.PI/2; g.add(shaft);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.4,6),mat);
  tip.rotation.x=-Math.PI/2; tip.position.z=1.8; g.add(tip);
  g.userData.mat=mat;
  return g;
}

/* Simple ragged army silhouette line */
export function makeArmy(count, spread, opts={}){
  const g=new THREE.Group();
  for(let i=0;i<count;i++){
    const f=makeFigure(opts);
    const x=(Math.random()-0.5)*spread;
    f.position.set(x,0,(Math.random()-0.5)*spread*0.35);
    f.scale.setScalar(0.85+Math.random()*0.5);
    f.rotation.y=Math.random()*6.283;
    g.add(f);
  }
  return g;
}

/* Camera keyframe rig */
export function camRig(keys){
  /* keys: [{t,pos:[..],look:[..],fov?,ease?}] */
  const cam={};
  return {
    keys,
    apply(camObj, t, noise=0.25){
      const ks=this.keys;
      let a=ks[0], b=ks[ks.length-1];
      for(let i=0;i<ks.length-1;i++){ if(t>=ks[i].t && t<ks[i+1].t){ a=ks[i]; b=ks[i+1]; break; } }
      let f=(t-a.t)/Math.max(1e-4,(b.t-a.t)); f=Math.max(0,Math.min(1,f));
      const e=f*f*(3-2*f);
      const pos=new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos),e);
      const look=new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look),e);
      const fov=(a.fov??50)+(((b.fov??50)-(a.fov??50))*e);
      /* handheld breathing */
      if(noise>0){
        pos.x+=Math.sin(t*0.55)*noise*0.06; pos.y+=Math.sin(t*0.42+1.7)*noise*0.05;
        look.x+=Math.sin(t*0.33+0.5)*noise*0.02; look.y+=Math.sin(t*0.27+2.1)*noise*0.015;
      }
      camObj.position.copy(pos);
      camObj.lookAt(look);
      if(Math.abs(camObj.fov-fov)>0.01){ camObj.fov=fov; camObj.updateProjectionMatrix(); }
    }
  };
}

export const easeIO=(f)=>f*f*(3-2*f);
export const clamp01=(v)=>Math.max(0,Math.min(1,v));
