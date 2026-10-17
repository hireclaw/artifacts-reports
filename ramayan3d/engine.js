/* ============================================================================
   RAMAYAN 3D — custom cinematic renderer (three.js)
   Hand-rolled HDR pipeline: scene -> bright pass -> mip chain (bloom),
   god-ray radial pass, ACES grade, gold lift, vignette, grain, CA, letterbox.
   All materials are bespoke GLSL written for this film.
   ========================================================================= */
import * as THREE from './vendor/three.module.min.js';

/* ---------- tiny GLSL library ---------- */
const LIB = /*glsl*/`
  float hash11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
  vec2 hash22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
    p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
  float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
  float vnoise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),
               mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p=p*2.03+vec2(17.3,9.1); a*=.5; } return v; }
  float fbm3(vec2 p){ float v=0.,a=.5; for(int i=0;i<3;i++){ v+=a*vnoise(p); p=p*2.11+vec2(11.7,5.3); a*=.5; } return v; }
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
  float luma(vec3 c){ return dot(c,vec3(.2126,.7152,.0722)); }
`;

const QUAD_VERT = /*glsl*/`
  varying vec2 vUv;
  void main(){ vUv=uv*2.-1.; gl_Position=vec4(uv*2.-1.,0.,1.); }
`;

const FS = (uniforms, frag) => new THREE.ShaderMaterial({
  depthTest:false, depthWrite:false, uniforms:uniforms||{},
  vertexShader:QUAD_VERT, fragmentShader:frag
});

/* ---------- Engine ---------- */
export class Engine {
  constructor(canvas){
    this.renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.pixelRatio = Math.min(window.devicePixelRatio||1, 1.75);
    this.renderer.setPixelRatio(this.pixelRatio);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 2, 0.1, 3000);

    this._initTargets();
    this._initPasses();
    this.rayCenter = new THREE.Vector2(0,0.08);
    this.rayStrength = 0;
    this.gradeTint = new THREE.Color(1.0,0.78,0.45);
    this.gradeTintAmt = 0.5;
    this.exposure = 1.0;
    this.fade = 1; this.black = 0;
    this.resize();
    window.addEventListener('resize', ()=>this.resize());
  }

  _rt(w,h,depth=false){ return new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,
      minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, depthBuffer:depth}); }

  _initTargets(){
    this.rtScene = this._rt(2,2,true);
    this.rtBright = this._rt(2,2);
    this.mips = [];
    for(let i=0;i<4;i++) this.mips.push(this._rt(2,2));
    this.rtTmp = this._rt(2,2);
    this.rtRay = this._rt(2,2);
  }

  _initPasses(){
    this.uBright={ tD:{value:null}, uThresh:{value:0.55}, uKnee:{value:0.30} };
    this.bright=FS(this.uBright, /*glsl*/`
      varying vec2 vUv; uniform sampler2D tD; uniform float uThresh,uKnee; ${LIB}
      void main(){ vec3 c=texture2D(tD, vUv*0.5+0.5).rgb; float l=luma(c);
        float k=max(l-uThresh,0.0); k=k/(k+uKnee); gl_FragColor=vec4(c*k,1.); }`);

    this.uBlur={ tD:{value:null}, uDir:{value:new THREE.Vector2(1,0)}, uTexel:{value:new THREE.Vector2(1,1)} };
    this.blur=FS(this.uBlur, /*glsl*/`
      varying vec2 vUv; uniform sampler2D tD; uniform vec2 uDir,uTexel;
      void main(){ vec2 uv=vUv*0.5+0.5; vec2 o=uDir*uTexel;
        vec3 s=texture2D(tD,uv).rgb*0.227;
        s+=(texture2D(tD,uv+o*1.384).rgb+texture2D(tD,uv-o*1.384).rgb)*0.316;
        s+=(texture2D(tD,uv+o*3.230).rgb+texture2D(tD,uv-o*3.230).rgb)*0.070;
        gl_FragColor=vec4(s,1.); }`);

    this.uRay={ tD:{value:null}, uCenter:{value:new THREE.Vector2(0,.1)}, uStr:{value:0.5} };
    this.ray=FS(this.uRay, /*glsl*/`
      varying vec2 vUv; uniform sampler2D tD; uniform vec2 uCenter; uniform float uStr; ${LIB}
      void main(){ vec2 uv=vUv*0.5+0.5; vec2 dir=(uCenter-uv);
        vec3 acc=vec3(0.);
        for(int i=0;i<28;i++){ float f=float(i)/28.0; vec2 p=uv+dir*f*0.9;
          acc+=texture2D(tD,p).rgb*(1.0-f*0.85); }
        acc/=28.0; gl_FragColor=vec4(acc*uStr,1.); }`);

    this.uComp={
      tScene:{value:null}, tB0:{value:null}, tB1:{value:null}, tB2:{value:null}, tB3:{value:null},
      tRay:{value:null},
      uTime:{value:0}, uExposure:{value:1}, uTint:{value:new THREE.Color(1,.78,.45)},
      uTintAmt:{value:.5}, uVignette:{value:.34}, uGrain:{value:.05},
      uCA:{value:.0020}, uLetterbox:{value:.065}, uFade:{value:1}, uTintBlack:{value:0},
      uBloomStr:{value:0.85}
    };
    this.comp=FS(this.uComp, /*glsl*/`
      varying vec2 vUv; uniform sampler2D tScene,tB0,tB1,tB2,tB3,tRay;
      uniform float uTime,uExposure,uTintAmt,uVignette,uGrain,uCA,uLetterbox,uFade,uTintBlack,uBloomStr;
      uniform vec3 uTint; ${LIB}
      void main(){
        vec2 uv=vUv*0.5+0.5;
        vec2 c=uv-0.5;
        float r2=dot(c,c);
        vec2 ca=c*r2*uCA*6.0;
        vec3 sc;
        sc.r=texture2D(tScene, uv+ca).r;
        sc.g=texture2D(tScene, uv).g;
        sc.b=texture2D(tScene, uv-ca).b;
        vec3 bl=texture2D(tB0,uv).rgb*0.42+texture2D(tB1,uv).rgb*0.28
               +texture2D(tB2,uv).rgb*0.18+texture2D(tB3,uv).rgb*0.12;
        vec3 ry=texture2D(tRay, uv).rgb;
        vec3 col=sc + bl*uBloomStr + ry;
        col*=uExposure;
        vec3 lift=vec3(0.028,0.020,0.014);
        col=col*(1.0-lift)+lift;
        float l=luma(col);
        vec3 warm=uTint*(0.55+0.45*l);
        col=mix(col, col*warm*1.18, uTintAmt*(1.0-l*0.55));
        col+=vec3(-0.010,0.006,0.014)*(1.0-smoothstep(0.0,0.35,l));
        col=aces(col);
        col*=1.0-uVignette*pow(r2*2.2,1.35);
        float g=hash12(uv*vec2(1920.,1080.)+vec2(uTime*61.7,uTime*127.3));
        col+=(g-0.5)*uGrain;
        float bar=step(abs(vUv.y), 1.0-uLetterbox*2.0);
        col*=bar;
        col=mix(col, vec3(0.), 1.0-uFade);
        col=mix(col, vec3(0.), uTintBlack);
        gl_FragColor=vec4(col,1.0);
      }`);

    this.quadScene=new THREE.Scene();
    this.quadCam=new THREE.Camera();
    this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2), this.bright);
    this.quad.frustumCulled=false;
    this.quadScene.add(this.quad);
  }

  _blit(mat, target){
    this.quad.material=mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCam);
    this.renderer.setRenderTarget(null);
  }

  resize(){
    const w=innerWidth, h=innerHeight;
    this.renderer.setSize(w,h,false);
    this.camera.aspect=w/h; this.camera.updateProjectionMatrix();
    const pr=this.pixelRatio;
    const rw=Math.max(2,Math.floor(w*pr)), rh=Math.max(2,Math.floor(h*pr));
    this.rtScene.setSize(rw,rh);
    const bw=Math.max(2,Math.floor(rw/2)), bh=Math.max(2,Math.floor(rh/2));
    this.rtBright.setSize(bw,bh); this.rtTmp.setSize(bw,bh); this.rtRay.setSize(bw,bh);
    let mw=bw, mh=bh;
    for(const m of this.mips){ mw=Math.max(2,Math.floor(mw/2)); mh=Math.max(2,Math.floor(mh/2)); m.setSize(mw,mh); }
    this.uBlur.uTexel.value.set(1/bw,1/bh);
  }

  render(time, dt){
    this.renderer.setRenderTarget(this.rtScene);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);

    this.uBright.tD.value=this.rtScene.texture;
    this._blit(this.bright, this.rtBright);

    /* mip chain: downsample+blur each octave into mips[i] */
    let src=this.rtBright;
    for(let i=0;i<4;i++){
      const s=Math.pow(2,i+1);
      this.uBlur.uDir.value.set(s,0); this.uBlur.tD.value=src.texture;
      this._blit(this.blur, this.rtTmp);
      this.uBlur.uDir.value.set(0,s); this.uBlur.tD.value=this.rtTmp.texture;
      this._blit(this.blur, this.mips[i]);
      src=this.mips[i];
    }

    this.uRay.tD.value=this.rtBright.texture;
    this.uRay.uCenter.value.copy(this.rayCenter);
    this.uRay.uStr.value=this.rayStrength;
    this._blit(this.ray, this.rtRay);

    this.uComp.tScene.value=this.rtScene.texture;
    this.uComp.tB0.value=this.mips[0].texture;
    this.uComp.tB1.value=this.mips[1].texture;
    this.uComp.tB2.value=this.mips[2].texture;
    this.uComp.tB3.value=this.mips[3].texture;
    this.uComp.tRay.value=this.rtRay.texture;
    this.uComp.uTime.value=time;
    this.uComp.uExposure.value=this.exposure;
    this.uComp.uTint.value.copy(this.gradeTint);
    this.uComp.uTintAmt.value=this.gradeTintAmt;
    this.uComp.uFade.value=this.fade;
    this.uComp.uTintBlack.value=this.black;
    this.quad.material=this.comp;
    this.renderer.render(this.quadScene, this.quadCam);
  }
}
export { LIB, FS, QUAD_VERT };
