const canvas = document.querySelector(".fluid-canvas");
const experience = document.querySelector(".cinematic-bg");
const root = document.documentElement;

const scenes = [
  { id: "nebula", tone: "196 224 255", tone2: "143 94 255" },
  { id: "blackhole", tone: "255 224 188", tone2: "255 91 36" },
  { id: "meteor", tone: "218 239 255", tone2: "75 137 255" },
  { id: "galaxy", tone: "225 211 255", tone2: "130 76 255" },
  { id: "orbit", tone: "170 235 255", tone2: "51 111 255" },
  { id: "hyperspace", tone: "224 244 255", tone2: "72 118 255" },
  { id: "supernova", tone: "255 231 193", tone2: "255 69 41" },
  { id: "aurora", tone: "157 255 224", tone2: "45 121 255" },
  { id: "storm", tone: "194 221 255", tone2: "129 65 255" },
  { id: "eclipse", tone: "242 235 218", tone2: "255 125 42" },
  { id: "wormhole", tone: "231 207 255", tone2: "88 102 255" }
];

if (!canvas || !experience) {
  console.warn('[4N1F cosmic] Homepage canvas not found.');
} else {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compact = matchMedia("(max-width: 720px)").matches;
  const PERIOD = 60000;
  let current = Math.floor(Date.now() / PERIOD) % scenes.length;
  let previous = current;
  let transition = 1;
  let last = performance.now();
  let elapsed = 0;
  let impulse = 0;
  let running = true;
  const pointer = { x: .5, y: .5, tx: .5, ty: .5 };

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    desynchronized: true
  });

  if (!gl) {
    experience.style.background =
      "radial-gradient(circle at 50% 45%, #40237b 0, #10133a 28%, #02030b 70%, #000 100%)";
  } else {
    startWebGL();
  }

  function startWebGL() {
    const vertexSource = `#version 300 es
      in vec2 position;
      out vec2 vUv;
      void main() {
        vUv = position * .5 + .5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `#version 300 es
      precision highp float;

      in vec2 vUv;
      out vec4 outColor;

      uniform vec2 uResolution;
      uniform vec2 uPointer;
      uniform float uTime;
      uniform float uScene;
      uniform float uPrevious;
      uniform float uTransition;
      uniform float uImpulse;

      #define PI 3.14159265359
      #define TAU 6.28318530718

      float hash11(float p) {
        p = fract(p * .1031);
        p *= p + 33.33;
        p *= p + p;
        return fract(p);
      }

      float hash21(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * .1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      vec2 hash22(vec2 p) {
        float n = hash21(p);
        return vec2(n, hash21(p + n + 19.19));
      }

      mat2 rot(float a) {
        float c = cos(a), s = sin(a);
        return mat2(c, -s, s, c);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x),
                   mix(hash21(i + vec2(0,1)), hash21(i + vec2(1)), f.x), f.y);
      }

      float fbm(vec2 p) {
        float sum = 0.0;
        float amp = .52;
        mat2 m = mat2(.80, -.60, .60, .80);
        for (int i = 0; i < 6; i++) {
          sum += amp * noise(p);
          p = m * p * 2.03 + 7.17;
          amp *= .49;
        }
        return sum;
      }

      float sdCircle(vec2 p, float r) { return length(p)-r; }
      float sat(float x) { return clamp(x,0.,1.); }

      vec3 nebula(vec2 uv, float time) {
        vec2 p = uv;
        p.x *= uResolution.x / uResolution.y;
        vec2 m = uPointer - .5;
        m.x *= uResolution.x / uResolution.y;
        float t = time * .09;
        vec2 q = vec2(fbm(p * 1.35 + vec2(0.,t)), fbm(p * 1.35 + vec2(5.2,-t*.7)));
        vec2 r = vec2(fbm(p*2.0 + 2.7*q + vec2(1.8,t*.5)), fbm(p*2.0 + 2.3*q + vec2(8.1,-t*.46)));
        float d = length((p-.5)-m);
        float field = exp(-d*d*4.4);
        float f = fbm(p*1.55 + 3.0*r + q*1.3) + field*.27 + sin((p.x+p.y+t)*5.)*.055;
        vec3 deep = vec3(.006,.008,.03), cyan = vec3(.04,.68,.92), vio = vec3(.36,.10,.92), mag = vec3(.78,.08,.55);
        vec3 c = mix(deep,cyan,smoothstep(.14,.68,f));
        c = mix(c,vio,smoothstep(.42,.84,f));
        c = mix(c,mag,smoothstep(.72,1.0,f));
        c *= .35 + 1.2*smoothstep(.18,.94,f);
        return c;
      }

      vec3 blackHole(vec2 uv,float time){
        vec2 p=uv-.5; p.x*=uResolution.x/uResolution.y;
        vec2 m=(uPointer-.5);m.x*=uResolution.x/uResolution.y;
        p-=m*.08;
        float r=length(p),a=atan(p.y,p.x);
        float spin=a+time*.28+1.1/(r+.12);
        float disk=exp(-abs(p.y+sin(spin*2.2)*.018)/(0.018+r*.08))*smoothstep(.08,.18,r)*(1.-smoothstep(.43,.88,r));
        float ring=exp(-abs(r-.19)*38.);
        float hole=1.-smoothstep(.085,.135,r);
        float lens=exp(-abs(r-.145)*58.);
        vec3 c=vec3(.003,.004,.009);
        c+=vec3(1.0,.42,.08)*disk*1.5;
        c+=vec3(1.0,.78,.48)*ring*.9;
        c+=vec3(.28,.34,.55)*lens*.55;
        c*=1.-hole*.98;
        c+=vec3(1.0,.18,.04)*uImpulse*ring*.7;
        return c;
      }

      vec3 meteor(vec2 uv,float time){
        vec2 p=uv;
        vec3 c=vec3(.005,.008,.02);
        for(int i=0;i<10;i++){
          float fi=float(i);
          float speed=.16+hash11(fi*3.1)*.34;
          vec2 dir=normalize(vec2(-.9,-.42+hash11(fi*7.7)*.18));
          vec2 start=vec2(fract(hash11(fi*9.1)+time*speed),fract(hash11(fi*5.3)+time*speed*.47));
          vec2 q=p-start;
          float along=dot(q,dir),side=abs(dot(q,vec2(-dir.y,dir.x)));
          float tail=exp(-side*180.)*smoothstep(.22,0.,along)*smoothstep(-.02,-.44,along);
          float head=exp(-length(q)*150.);
          c+=vec3(.42,.66,1.0)*tail*.65+vec3(1.0,.92,.75)*head*1.8;
        }
        c+=vec3(.12,.22,.5)*pow(max(0.,1.-length((p-.5)*vec2(1.,1.5))),3.)*.25;
        return c;
      }

      vec3 galaxy(vec2 uv,float time){
        vec2 p=uv-.5;p.x*=uResolution.x/uResolution.y;
        p*=rot(-.23);
        float r=length(p),a=atan(p.y,p.x);
        float arms=.5+.5*cos(a*4.-log(r+.06)*5.6-time*.18);
        float dust=fbm(vec2(a*2.2,r*8.)+time*.015);
        float disk=exp(-r*3.2)*smoothstep(.03,.22,r);
        float core=exp(-r*15.);
        vec3 c=vec3(.004,.006,.018);
        c+=mix(vec3(.14,.28,.8),vec3(.68,.28,1.),arms)*disk*(.35+arms*.9)*(dust*.7+.25);
        c+=vec3(1.,.79,.58)*core*1.7;
        c+=vec3(.55,.65,1.)*uImpulse*exp(-abs(r-.28)*18.)*.25;
        return c;
      }

      vec3 orbitWorld(vec2 uv,float time){
        vec2 p=uv-.5;p.x*=uResolution.x/uResolution.y;
        float r=length(p);
        float planet=smoothstep(.23,.215,r);
        float rim=exp(-abs(r-.225)*70.);
        vec3 c=vec3(.003,.006,.014);
        vec3 pc=mix(vec3(.02,.18,.36),vec3(.08,.55,.72),sat(p.y*.9+.52));
        pc*=.55+.55*sat(dot(normalize(vec3(p,.25)),normalize(vec3(-.5,.6,.7))));
        c=mix(c,pc,planet);
        c+=vec3(.2,.65,1.)*rim*.5;
        for(int i=0;i<3;i++){
          float fi=float(i);
          float a=time*(.22+.09*fi)+fi*2.1;
          vec2 q=vec2(cos(a),sin(a))*(.34+.08*fi);
          float moon=exp(-length(p-q)*90.);
          c+=mix(vec3(.6,.8,1.),vec3(.75,.55,1.),fi/3.)*moon;
        }
        float ring=exp(-abs(length(vec2(p.x,p.y*.38))-.42)*75.);
        c+=vec3(.2,.32,.62)*ring*.25;
        return c;
      }

      vec3 hyperspace(vec2 uv,float time){
        vec2 p=uv-.5;p.x*=uResolution.x/uResolution.y;
        float a=atan(p.y,p.x),r=length(p);
        vec3 c=vec3(.002,.004,.015);
        for(int i=0;i<18;i++){
          float fi=float(i);
          float ang=TAU*hash11(fi*7.3)+sin(time*.05+fi)*.02;
          float lane=abs(sin((a-ang)*.5));
          float pulse=fract(time*(.22+.015*fi)+hash11(fi*4.2));
          float rr=mix(.03,1.05,pulse);
          float streak=exp(-lane*220.)*exp(-abs(r-rr)*28.)*(1.-pulse);
          c+=mix(vec3(.28,.55,1.),vec3(.8,.9,1.),hash11(fi))*streak*1.2;
        }
        c+=vec3(.18,.3,.8)*exp(-r*9.)*.8;
        return c;
      }

      vec3 supernova(vec2 uv,float time){
        vec2 p=uv-.5;p.x*=uResolution.x/uResolution.y;
        float r=length(p),a=atan(p.y,p.x);
        float n=fbm(vec2(a*3.5,r*9.-time*.25));
        float shell=exp(-abs(r-(.18+.035*sin(time*.5)))*34.)*(.45+n);
        float rays=pow(abs(cos(a*7.+n*3.)),18.)*exp(-r*2.8);
        float core=exp(-r*18.);
        vec3 c=vec3(.006,.003,.006);
        c+=vec3(1.,.18,.04)*shell*1.25;
        c+=vec3(1.,.72,.26)*rays*.85;
        c+=vec3(1.,.96,.82)*core*2.1;
        c+=vec3(1.,.32,.08)*uImpulse*exp(-abs(r-.35)*16.)*.55;
        return c;
      }

      vec3 aurora(vec2 uv,float time){
        vec2 p=uv;
        vec3 c=vec3(.003,.01,.024);
        for(int i=0;i<4;i++){
          float fi=float(i);
          float y=.28+.14*fi+.06*sin(p.x*(3.8+fi*.7)+time*(.12+.03*fi)+fi*1.8);
          float curtain=exp(-abs(p.y-y)*26.)*(.35+.65*noise(vec2(p.x*5.+fi,time*.08)));
          vec3 col=mix(vec3(.05,.95,.62),vec3(.16,.38,1.),fi/3.);
          c+=col*curtain*.65;
        }
        c+=vec3(.02,.12,.24)*pow(1.-p.y,2.)*.35;
        return c;
      }

      vec3 storm(vec2 uv,float time){
        vec2 p=uv-.5;p.x*=uResolution.x/uResolution.y;
        float f=fbm(p*2.2+vec2(time*.035,-time*.024));
        float g=fbm(p*4.4-vec2(time*.026,time*.018));
        float cloud=smoothstep(.26,.82,f*.74+g*.36);
        float flash=pow(max(0.,sin(time*2.2+f*8.)),22.)*(.18+uImpulse*.82);
        vec3 c=mix(vec3(.003,.006,.016),vec3(.12,.18,.34),cloud*.55);
        c+=vec3(.52,.62,1.)*flash*cloud;
        c+=vec3(.42,.18,1.)*smoothstep(.7,.95,g)*.2;
        return c;
      }

      vec3 eclipse(vec2 uv,float time){
        vec2 p=uv-.5;p.x*=uResolution.x/uResolution.y;
        vec2 moon=vec2(.035*sin(time*.07),.0);
        float r=length(p-moon);
        float sun=exp(-abs(r-.215)*85.);
        float corona=exp(-abs(r-.24)*19.)*(.45+.55*fbm(vec2(atan(p.y,p.x)*4.,time*.08)));
        float disk=1.-smoothstep(.205,.218,r);
        vec3 c=vec3(.003,.004,.008);
        c+=vec3(1.,.62,.19)*sun*1.5;
        c+=vec3(1.,.82,.52)*corona*.68;
        c*=1.-disk*.98;
        return c;
      }

      vec3 wormhole(vec2 uv,float time){
        vec2 p=uv-.5;p.x*=uResolution.x/uResolution.y;
        float r=length(p),a=atan(p.y,p.x);
        float twist=a+2.6/(r+.08)+time*.22;
        float tunnel=.5+.5*cos(twist*5.-log(r+.04)*7.);
        float bands=exp(-abs(fract(log(r+.045)*2.2-time*.06)-.5)*7.);
        float core=exp(-r*12.);
        vec3 c=vec3(.003,.004,.014);
        c+=mix(vec3(.18,.2,1.),vec3(.72,.24,1.),tunnel)*bands*(1.-smoothstep(.62,1.05,r))*.9;
        c+=vec3(.65,.75,1.)*core*.9;
        c+=vec3(.35,.22,1.)*uImpulse*exp(-abs(r-.3)*20.)*.45;
        return c;
      }

      vec3 renderScene(float scene, vec2 uv, float time) {
        if(scene < .5) return nebula(uv,time);
        if(scene < 1.5) return blackHole(uv,time);
        if(scene < 2.5) return meteor(uv,time);
        if(scene < 3.5) return galaxy(uv,time);
        if(scene < 4.5) return orbitWorld(uv,time);
        if(scene < 5.5) return hyperspace(uv,time);
        if(scene < 6.5) return supernova(uv,time);
        if(scene < 7.5) return aurora(uv,time);
        if(scene < 8.5) return storm(uv,time);
        if(scene < 9.5) return eclipse(uv,time);
        return wormhole(uv,time);
      }

      void main() {
        vec2 uv = vUv;
        vec2 p = uv - .5;
        p.x *= uResolution.x / uResolution.y;
        vec2 bend = (uPointer - .5) * .025;
        uv += bend * (1.-smoothstep(.0,.9,length(p)));
        vec3 a = renderScene(uPrevious, uv, uTime);
        vec3 b = renderScene(uScene, uv, uTime);
        float tr = smoothstep(0.,1.,uTransition);
        vec3 c = mix(a,b,tr);
        float vignette = 1.-smoothstep(.22,1.05,length(p));
        c *= .42 + .78*vignette;
        c = pow(max(c,vec3(0.)),vec3(.86));
        outColor = vec4(c,1.);
      }
    `;

    try {
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
        }
        return shader;
      };

      const program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
      }
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const uniforms = {
        resolution: gl.getUniformLocation(program, "uResolution"),
        pointer: gl.getUniformLocation(program, "uPointer"),
        time: gl.getUniformLocation(program, "uTime"),
        scene: gl.getUniformLocation(program, "uScene"),
        previous: gl.getUniformLocation(program, "uPrevious"),
        transition: gl.getUniformLocation(program, "uTransition"),
        impulse: gl.getUniformLocation(program, "uImpulse")
      };

      const resize = () => {
        const dpr = Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.6);
        const width = Math.max(1, Math.floor(innerWidth * dpr));
        const height = Math.max(1, Math.floor(innerHeight * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
      };

      const frame = (now) => {
        if (!running) return;
        const delta = Math.min(.04, (now - last) / 1000);
        last = now;
        elapsed += delta * (reducedMotion ? .22 : 1);
        transition = Math.min(1, transition + delta / 5.5);
        impulse = Math.max(0, impulse - delta * .72);
        pointer.x += (pointer.tx - pointer.x) * Math.min(1, delta * 4.5);
        pointer.y += (pointer.ty - pointer.y) * Math.min(1, delta * 4.5);
        root.style.setProperty("--impact", impulse.toFixed(3));
        resize();
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
        gl.uniform1f(uniforms.time, elapsed);
        gl.uniform1f(uniforms.scene, current);
        gl.uniform1f(uniforms.previous, previous);
        gl.uniform1f(uniforms.transition, transition);
        gl.uniform1f(uniforms.impulse, impulse);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        requestAnimationFrame(frame);
      };
      applyScene();
      requestAnimationFrame(frame);
    } catch (error) {
      console.error('[4N1F cosmic]', error);
      experience.style.background =
        "radial-gradient(circle at 50% 45%, #40237b 0, #10133a 28%, #02030b 70%, #000 100%)";
    }
  }

  function applyScene() {
    const scene = scenes[current];
    experience.dataset.scene = scene.id;
    root.style.setProperty("--tone", scene.tone);
    root.style.setProperty("--tone-2", scene.tone2);
    root.style.setProperty("--hero-a", `rgb(${scene.tone})`);
    root.style.setProperty("--hero-b", `rgb(${scene.tone2})`);
    root.style.setProperty("--hero-c", `rgb(${scene.tone})`);
    root.style.setProperty("--hero-kicker", `rgb(${scene.tone})`);
    root.style.setProperty("--hero-sub", `rgb(${scene.tone})`);
    root.style.setProperty("--hero-glow", `rgb(${scene.tone2} / .18)`);
    document.body.dataset.ambientScene = scene.id;
    window.dispatchEvent(new CustomEvent("4n1f:ambient-scene", { detail: { index: current, name: scene.id } }));
  }

  function updatePointer(clientX, clientY) {
    pointer.tx = Math.max(0, Math.min(1, clientX / innerWidth));
    pointer.ty = Math.max(0, Math.min(1, 1 - clientY / innerHeight));
  }

  window.addEventListener("pointermove", (event) => updatePointer(event.clientX, event.clientY), { passive: true });
  window.addEventListener("pointerdown", (event) => {
    updatePointer(event.clientX, event.clientY);
    impulse = 1;
  }, { passive: true });

  const sceneForNow = () => Math.floor(Date.now() / PERIOD) % scenes.length;
  const syncScene = () => {
    const next = sceneForNow();
    if (next === current) return;
    previous = current;
    current = next;
    transition = 0;
    impulse = 1;
    applyScene();
  };

  let sceneTimer = 0;
  const scheduleScene = () => {
    clearTimeout(sceneTimer);
    const delay = PERIOD - (Date.now() % PERIOD) + 30;
    sceneTimer = setTimeout(() => {
      syncScene();
      scheduleScene();
    }, delay);
  };
  scheduleScene();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncScene();
      scheduleScene();
    }
  });

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    running = false;
  });
  canvas.addEventListener("webglcontextrestored", () => location.reload());
}
