(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const panels = [...document.querySelectorAll('[data-spotlight-card]')];
  const scores = [...document.querySelectorAll('.score')];

  const localPoint = (el, e) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(r.width, e.clientX - r.left)),
      y: Math.max(0, Math.min(r.height, e.clientY - r.top)),
      px: ((e.clientX - r.left) / Math.max(1, r.width)) * 100,
      py: ((e.clientY - r.top) / Math.max(1, r.height)) * 100
    };
  };

  if (!reduced && finePointer) {
    for (const panel of panels) {
      panel.addEventListener('pointermove', (e) => {
        const p = localPoint(panel, e);
        panel.style.setProperty('--mx', `${p.x}px`);
        panel.style.setProperty('--my', `${p.y}px`);
      }, { passive: true });
    }

    for (const score of scores) {
      score.addEventListener('pointermove', (e) => {
        const p = localPoint(score, e);
        score.style.setProperty('--sx', `${p.x}px`);
        score.style.setProperty('--sy', `${p.y}px`);
      }, { passive: true });
    }

    const source = document.querySelector('.source-card');
    if (source) {
      source.addEventListener('pointermove', (e) => {
        const r = source.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - .5) * 2;
        const ny = ((e.clientY - r.top) / r.height - .5) * 2;
        source.style.transform = `translateY(-2px) perspective(1200px) rotateX(${(-ny * .35).toFixed(2)}deg) rotateY(${(nx * .45).toFixed(2)}deg)`;
      }, { passive: true });
      source.addEventListener('pointerleave', () => { source.style.transform = ''; });
    }
  }

  const nav = document.querySelector('.studio-nav');
  const lamp = document.querySelector('.nav-limelight');
  const activeNav = nav?.querySelector('.active');
  const placeLamp = (target) => {
    if (!nav || !lamp || !target) return;
    const nr = nav.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    lamp.style.left = `${tr.left - nr.left + tr.width / 2}px`;
    lamp.style.width = `${Math.max(54, tr.width * .75)}px`;
  };
  placeLamp(activeNav);
  addEventListener('resize', () => placeLamp(activeNav), { passive: true });
  nav?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('pointerenter', () => placeLamp(a));
    a.addEventListener('pointerleave', () => placeLamp(activeNav));
  });

  const pipelineNodes = [...document.querySelectorAll('.pipeline-node')];
  const sourceBadge = document.getElementById('sourceBadge');
  const analysisStatus = document.getElementById('analysisStatus');
  const mappingBadge = document.getElementById('mappingBadge');
  const fetchBtn = document.getElementById('fetchSourceBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const buildBtn = document.getElementById('buildBtn');

  const hasPositiveState = (el) => {
    if (!el) return false;
    const t = (el.textContent || '').toLowerCase();
    return el.classList.contains('ok') || /ready|selesai|complete|generated|fetched|tersedia|berhasil/.test(t);
  };

  const syncPipeline = () => {
    if (!pipelineNodes.length) return;
    pipelineNodes[0]?.classList.add('active');
    pipelineNodes[1]?.classList.toggle('active', hasPositiveState(sourceBadge) || hasPositiveState(analysisStatus));
    pipelineNodes[2]?.classList.toggle('active', hasPositiveState(mappingBadge));
    document.body.dataset.quantumPhase = hasPositiveState(mappingBadge) ? 'rebuild' : (hasPositiveState(sourceBadge) || hasPositiveState(analysisStatus) ? 'analyze' : 'source');
  };

  const observer = new MutationObserver(syncPipeline);
  [sourceBadge, analysisStatus, mappingBadge].filter(Boolean).forEach((el) => observer.observe(el, { subtree:true, childList:true, attributes:true }));
  syncPipeline();

  const pulse = (button, className) => {
    if (!button) return;
    button.addEventListener('click', () => {
      button.classList.add(className);
      setTimeout(() => button.classList.remove(className), 900);
    });
  };
  pulse(fetchBtn, 'quantum-fired');
  pulse(analyzeBtn, 'quantum-fired');
  pulse(buildBtn, 'quantum-fired');

  document.documentElement.classList.add('quantum-ready');
})();
