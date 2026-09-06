(() => {
'use strict';

const canvas=document.getElementById('gl');
const badge=document.getElementById('badge');
const fail=document.getElementById('fail');
const gl=canvas.getContext('webgl2',{
  alpha:false,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false
});
if(!gl){fail.style.display='grid';return;}

const SOURCE_1='https://web.galeriundanganofficial.com/wp-content/uploads/2026/03/JAWA-COKLAT-3-1.jpg';
const SOURCE_2='https://web.galeriundanganofficial.com/wp-content/uploads/2026/03/JAWA-COKLAT-3-3-1.jpg';
const proxied=u=>'/api/fetch-asset?url='+encodeURIComponent(u);

const VS=`#version 300 es
precision highp float;
const vec2 P[3]=vec2[](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));
out vec2 vUv;
void main(){
  vec2 p=P[gl_VertexID];
  vUv=.5*(p+1.);
  gl_Position=vec4(p,0.,1.);
}`;

const FS=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uBase;
uniform sampler2D uPanel;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uCenter;
uniform float uZoom;
uniform float uBaseRot;
uniform float uPanelP;
uniform float uPanelZoom;
uniform float uPanelRot;

float hash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);
}
mat2 rot(float a){
  float s=sin(a),c=cos(a);
  return mat2(c,-s,s,c);
}
vec2 coverUv(vec2 uv,vec2 center,float zoom,float rotation,float imageAspect){
  float screen=uRes.x/uRes.y;
  vec2 q=uv-.5;
  if(screen>imageAspect) q.y*=imageAspect/screen;
  else q.x*=screen/imageAspect;
  q=rot(rotation)*q;
  q/=max(.001,zoom);
  q+=center;
  return q;
}
vec3 sampleSafe(sampler2D tex,vec2 uv){
  vec2 q=clamp(uv,vec2(.001),vec2(.999));
  return texture(tex,q).rgb;
}
float ellipse(vec2 p,vec2 c,vec2 r){
  vec2 q=(p-c)/r;
  return 1.-smoothstep(.985,1.015,dot(q,q));
}
float panelShape(vec2 uv){
  float body=(1.-smoothstep(.365,.378,abs(uv.x-.5)))*
             (1.-smoothstep(.255,.275,abs(uv.y-.5)));
  float top=ellipse(uv,vec2(.5,.30),vec2(.36,.19));
  float bottom=ellipse(uv,vec2(.5,.70),vec2(.36,.19));
  float side=(1.-smoothstep(.345,.372,abs(uv.x-.5)))*
             (1.-smoothstep(.36,.39,abs(uv.y-.5)));
  return clamp(max(max(body,top),max(bottom,side)),0.,1.);
}
void main(){
  vec2 uv=vUv;

  vec2 baseUv=coverUv(uv,uCenter,uZoom,uBaseRot,878.0/1562.0);
  float paperWave=sin((baseUv.y*15.0)+(uTime*.30))*sin((baseUv.x*9.0)-(uTime*.21));
  baseUv+=vec2(paperWave*.00050,sin(baseUv.x*17.0+uTime*.24)*.00032);
  vec3 base=sampleSafe(uBase,baseUv);

  vec2 panelUv=coverUv(uv,vec2(.5),uPanelZoom,uPanelRot,1080.0/1920.0);
  panelUv+=vec2(sin(panelUv.y*14.0+uTime*.25)*.00032,0.);
  vec3 panel=sampleSafe(uPanel,panelUv);

  float shape=panelShape(uv);
  float radial=length((uv-.5)*vec2(.86,1.0));
  float bloomReveal=smoothstep(.72,.08,radial);
  float scan=smoothstep(-.02,.10,uPanelP-(abs(uv.y-.5)*.18+abs(uv.x-.5)*.10));
  float panelAlpha=shape*clamp(uPanelP*1.20,0.,1.)*mix(.58,1.,scan);
  panelAlpha=max(panelAlpha,bloomReveal*smoothstep(.0,.15,uPanelP)*.06);

  vec3 col=mix(base,panel,panelAlpha);

  float centerGlow=1.-smoothstep(.18,.82,length(uv-.5));
  col*=.988+.018*centerGlow;
  col+=vec3(.010,.007,.003)*centerGlow*(.72+.28*sin(uTime*.40));
  col+=(hash(gl_FragCoord.xy+uTime*59.0)-.5)*.012;
  float vig=1.-smoothstep(.52,.88,length((uv-.5)*vec2(.78,1.0)))*.055;
  col*=vig;

  outColor=vec4(col,1.);
}`;

function compile(type,src){
  const s=gl.createShader(type);
  gl.shaderSource(s,src);
  gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');
  return s;
}
const program=gl.createProgram();
gl.attachShader(program,compile(gl.VERTEX_SHADER,VS));
gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FS));
gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'program link failed');
gl.useProgram(program);

const U=n=>gl.getUniformLocation(program,n);
const uni={
  base:U('uBase'),panel:U('uPanel'),res:U('uRes'),time:U('uTime'),
  center:U('uCenter'),zoom:U('uZoom'),baseRot:U('uBaseRot'),
  panelP:U('uPanelP'),panelZoom:U('uPanelZoom'),panelRot:U('uPanelRot')
};
gl.uniform1i(uni.base,0);
gl.uniform1i(uni.panel,1);

function loadTexture(url){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.decoding='async';
    img.onload=()=>{
      const t=gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
      resolve(t);
    };
    img.onerror=()=>reject(new Error('asset gagal dimuat: '+url));
    img.src=proxied(url);
  });
}
function clamp01(v){return Math.max(0,Math.min(1,v));}
function smooth(v){v=clamp01(v);return v*v*(3-2*v);}
function mix(a,b,t){return a+(b-a)*t;}
function spring01(x){
  x=clamp01(x);
  return 1-Math.exp(-6*x)*Math.cos(8*x);
}
function timeline(t){
  let cx=.5,cy=.5,zoom=1,rot=0;

  if(t<1.0){
    const p=smooth(t/1.0);
    cx=mix(.333,.698,p);
    cy=.238;
    zoom=1.543;
  }else if(t<1.55){
    const p=smooth((t-1.0)/.55);
    cx=mix(.698,.5,p);
    cy=mix(.238,.5,p);
    zoom=mix(1.543,1.0,p);
  }else{
    const breathe=Math.sin((t-1.55)*.43);
    cx=.5+breathe*.0018;
    cy=.5+Math.sin((t-1.55)*.31)*.0016;
    zoom=1.0+Math.sin((t-1.55)*.37)*.0025;
  }

  const pp=smooth((t-5.45)/2.15);
  const sp=spring01((t-5.35)/2.0);
  const pzoom=mix(.86,1.0,sp);
  const prot=mix(-6.8,0,sp)*Math.PI/180 + Math.sin((t-5.4)*4.8)*(1-pp)*.006;

  return {cx,cy,zoom,rot,panelP:pp,panelZoom:pzoom,panelRot:prot};
}

let textures=null;
let start=performance.now();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

function resize(){
  const dpr=Math.min(devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(innerWidth*dpr));
  const h=Math.max(1,Math.round(innerHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){
    canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);
  }
}
addEventListener('resize',resize,{passive:true});
resize();

function render(now){
  resize();
  if(!textures){requestAnimationFrame(render);return;}
  let sec=(now-start)/1000;
  if(reduced)sec=8;
  else sec%=20;

  const s=timeline(sec);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures[0]);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,textures[1]);
  gl.uniform2f(uni.res,canvas.width,canvas.height);
  gl.uniform1f(uni.time,sec);
  gl.uniform2f(uni.center,s.cx,s.cy);
  gl.uniform1f(uni.zoom,s.zoom);
  gl.uniform1f(uni.baseRot,s.rot);
  gl.uniform1f(uni.panelP,s.panelP);
  gl.uniform1f(uni.panelZoom,s.panelZoom);
  gl.uniform1f(uni.panelRot,s.panelRot);
  gl.drawArrays(gl.TRIANGLES,0,3);
  requestAnimationFrame(render);
}

Promise.all([loadTexture(SOURCE_1),loadTexture(SOURCE_2)]).then(t=>{
  textures=t;
  badge.textContent='WEBGL · 2 ARTWORKS · NO VIDEO';
  setTimeout(()=>badge.style.opacity='.24',2600);
  requestAnimationFrame(render);
}).catch(err=>{
  console.error(err);
  fail.textContent='Asset WebGL gagal dimuat. '+err.message;
  fail.style.display='grid';
});

addEventListener('pointerdown',()=>{
  start=performance.now();
  badge.style.opacity='1';
  setTimeout(()=>badge.style.opacity='.24',1300);
},{passive:true});
})();
