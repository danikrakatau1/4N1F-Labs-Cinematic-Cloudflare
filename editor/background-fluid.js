(() => {
  const canvas = document.querySelector('.fluid-canvas');
  if (!canvas) return;

  const fallback = document.querySelector('.cinematic-bg');
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const vertex = `
    attribute vec2 a_position;
    void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }
  `;

  const fragment = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_pointer;
    uniform float u_pointerMix;

    float hash(vec2 p){
      return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
    }

    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f*f*(3.0-2.0*f);
      float a = hash(i);
      float b = hash(i + vec2(1.0,0.0));
      float c = hash(i + vec2(0.0,1.0));
      float d = hash(i + vec2(1.0,1.0));
      return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
    }

    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.80,-0.60,0.60,0.80);
      for(int i=0;i<5;i++){
        v += a * noise(p);
        p = rot * p * 2.03 + 13.7;
        a *= 0.5;
      }
      return v;
    }

    vec3 palette(float t){
      vec3 deep = vec3(0.012,0.018,0.050);
      vec3 cyan = vec3(0.055,0.70,0.92);
      vec3 violet = vec3(0.34,0.11,0.92);
      vec3 magenta = vec3(0.76,0.10,0.60);
      vec3 emerald = vec3(0.03,0.54,0.42);
      vec3 c = mix(deep, cyan, smoothstep(0.18,0.76,t));
      c = mix(c, violet, smoothstep(0.42,0.88,t));
      c = mix(c, magenta, smoothstep(0.70,1.00,t));
      c += emerald * smoothstep(0.28,0.72, 1.0-abs(t-0.48)*2.0) * 0.30;
      return c;
    }

    void main(){
      vec2 res = max(u_resolution, vec2(1.0));
      vec2 uv = gl_FragCoord.xy / res;
      vec2 p = uv - 0.5;
      p.x *= res.x / res.y;

      float t = u_time * 0.10;
      vec2 q = vec2(
        fbm(p * 1.45 + vec2(0.0, t)),
        fbm(p * 1.45 + vec2(5.2, -t * 0.72))
      );
      vec2 r = vec2(
        fbm(p * 2.05 + 2.8*q + vec2(1.7, t * 0.55)),
        fbm(p * 2.05 + 2.4*q + vec2(8.3, -t * 0.48))
      );

      vec2 mouse = u_pointer - 0.5;
      mouse.x *= res.x / res.y;
      float d = length(p-mouse);
      float pointerField = exp(-d*d*4.8) * u_pointerMix;

      float wave = fbm(p * 1.65 + 3.2*r + q*1.35);
      wave += 0.14*sin((p.x*2.4+p.y*1.2+t*1.35)*3.14159);
      wave += pointerField * 0.33;

      vec3 color = palette(clamp(wave,0.0,1.0));
      float plume = smoothstep(0.18,0.96,wave);
      color *= 0.22 + plume * 1.28;

      float centerGlow = 1.0 - smoothstep(0.05,1.05,length(p*vec2(0.78,1.0)));
      color += vec3(0.03,0.06,0.16) * centerGlow * 0.55;

      float vignette = 1.0 - smoothstep(0.16,1.05,length(p));
      color *= 0.48 + 0.74*vignette;
      color = pow(max(color,0.0), vec3(0.88));

      gl_FragColor = vec4(color,1.0);
    }
  `;

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    fallback?.classList.add('fluid-fallback-only');
    return;
  }

  const shader = (type, source) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const msg = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(msg || 'Shader compile failed');
    }
    return s;
  };

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
  } catch (err) {
    console.warn('[4N1F background] WebGL fallback:', err);
    fallback?.classList.add('fluid-fallback-only');
    return;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);

  const pos = gl.getAttribLocation(program, 'a_position');
  const resolution = gl.getUniformLocation(program, 'u_resolution');
  const timeLoc = gl.getUniformLocation(program, 'u_time');
  const pointerLoc = gl.getUniformLocation(program, 'u_pointer');
  const pointerMixLoc = gl.getUniformLocation(program, 'u_pointerMix');

  gl.useProgram(program);
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  let dpr = 1;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let targetX = 0.5;
  let targetY = 0.5;
  let pointerMix = 0;
  let targetMix = 0;
  let raf = 0;
  let started = performance.now();
  let visible = !document.hidden;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.25 : 1.6);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0,0,w,h);
    }
  };

  const setPointer = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    targetX = Math.min(1, Math.max(0, (clientX-rect.left)/rect.width));
    targetY = 1-Math.min(1, Math.max(0, (clientY-rect.top)/rect.height));
    targetMix = 1;
  };

  const onMouseMove = e => setPointer(e.clientX,e.clientY);
  const onTouchMove = e => {
    const t = e.touches?.[0];
    if (t) setPointer(t.clientX,t.clientY);
  };
  const onLeave = () => { targetMix = 0; };

  window.addEventListener('mousemove', onMouseMove, { passive:true });
  window.addEventListener('touchmove', onTouchMove, { passive:true });
  window.addEventListener('blur', onLeave);
  document.addEventListener('mouseleave', onLeave);
  window.addEventListener('resize', resize, { passive:true });
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible && !raf) {
      started = performance.now();
      raf = requestAnimationFrame(render);
    }
  });

  const render = now => {
    raf = 0;
    if (!visible) return;
    resize();

    pointerX += (targetX-pointerX)*0.045;
    pointerY += (targetY-pointerY)*0.045;
    pointerMix += (targetMix-pointerMix)*0.035;
    if (targetMix > 0) targetMix *= 0.998;

    const elapsed = reduceMotion ? 8.0 : (now-started)/1000;
    gl.useProgram(program);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(timeLoc, elapsed);
    gl.uniform2f(pointerLoc, pointerX, pointerY);
    gl.uniform1f(pointerMixLoc, pointerMix);
    gl.drawArrays(gl.TRIANGLES,0,6);

    if (!reduceMotion) raf = requestAnimationFrame(render);
  };

  resize();
  raf = requestAnimationFrame(render);
})();
