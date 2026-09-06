(() => {
  'use strict';

  const bg = document.querySelector('.cinematic-bg');
  const canvas = document.querySelector('.fluid-canvas');
  const scrim = document.querySelector('.fluid-scrim');
  if (!bg || !canvas) return;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const PERIOD = 60000;

  const scenes = [
    {
      name:'Cyan Night',
      filter:'hue-rotate(0deg) saturate(1.08) brightness(.98)',
      overlay:'radial-gradient(52% 56% at 17% 18%,rgba(35,181,255,.28),transparent 72%),radial-gradient(48% 62% at 84% 25%,rgba(100,73,255,.24),transparent 74%),radial-gradient(48% 50% at 50% 88%,rgba(21,170,143,.16),transparent 72%)',
      a:'#f9fcff', b:'#9ce8ff', c:'#bca5ff', sub:'#b7cadb', kicker:'#96f0cc', glow:'rgba(98,211,255,.20)'
    },
    {
      name:'Violet Royal',
      filter:'hue-rotate(48deg) saturate(1.16) brightness(.97)',
      overlay:'radial-gradient(56% 64% at 20% 12%,rgba(134,90,255,.27),transparent 73%),radial-gradient(58% 66% at 86% 34%,rgba(235,67,217,.21),transparent 74%),radial-gradient(40% 48% at 48% 92%,rgba(69,118,255,.15),transparent 72%)',
      a:'#fffaff', b:'#cfb5ff', c:'#ffaae8', sub:'#c9bdd8', kicker:'#c3abff', glow:'rgba(184,126,255,.19)'
    },
    {
      name:'Emerald Deep',
      filter:'hue-rotate(135deg) saturate(1.04) brightness(.91)',
      overlay:'radial-gradient(58% 62% at 16% 22%,rgba(26,207,163,.24),transparent 72%),radial-gradient(55% 62% at 84% 22%,rgba(19,132,177,.19),transparent 74%),radial-gradient(48% 54% at 58% 88%,rgba(113,216,131,.12),transparent 72%)',
      a:'#f7fffc', b:'#99f0d1', c:'#9fdcff', sub:'#aecfc6', kicker:'#80efbd', glow:'rgba(72,220,166,.18)'
    },
    {
      name:'Electric Blue',
      filter:'hue-rotate(210deg) saturate(1.18) brightness(.95)',
      overlay:'radial-gradient(58% 66% at 22% 18%,rgba(60,115,255,.29),transparent 72%),radial-gradient(58% 64% at 85% 26%,rgba(54,213,255,.20),transparent 74%),radial-gradient(44% 54% at 52% 90%,rgba(94,79,255,.16),transparent 72%)',
      a:'#f9fbff', b:'#9dbbff', c:'#8fe8ff', sub:'#b3c2da', kicker:'#91dfff', glow:'rgba(89,148,255,.20)'
    },
    {
      name:'Rose Nebula',
      filter:'hue-rotate(304deg) saturate(1.12) brightness(.96)',
      overlay:'radial-gradient(56% 62% at 18% 16%,rgba(255,82,171,.22),transparent 72%),radial-gradient(54% 64% at 84% 24%,rgba(165,89,255,.24),transparent 74%),radial-gradient(46% 54% at 54% 90%,rgba(255,132,104,.12),transparent 72%)',
      a:'#fffafb', b:'#ffafd0', c:'#c7a4ff', sub:'#d0b7c6', kicker:'#ffb6d3', glow:'rgba(255,102,175,.17)'
    }
  ];

  const films = [document.createElement('div'), document.createElement('div')];
  films.forEach((film,index) => {
    film.className = 'ambient-film';
    film.setAttribute('aria-hidden','true');
    film.dataset.ambientFilm = String(index);
    bg.insertBefore(film, scrim || null);
  });

  let activeFilm = 0;
  let current = -1;

  const variables = scene => {
    root.style.setProperty('--hero-a', scene.a);
    root.style.setProperty('--hero-b', scene.b);
    root.style.setProperty('--hero-c', scene.c);
    root.style.setProperty('--hero-sub', scene.sub);
    root.style.setProperty('--hero-kicker', scene.kicker);
    root.style.setProperty('--hero-glow', scene.glow);
  };

  function apply(index, immediate=false){
    index = ((index % scenes.length) + scenes.length) % scenes.length;
    if (index === current && !immediate) return;
    const scene = scenes[index];
    const nextFilm = immediate ? films[activeFilm] : films[1-activeFilm];
    const previous = films[activeFilm];

    nextFilm.style.background = scene.overlay;
    if (immediate){
      nextFilm.style.transition = 'none';
      nextFilm.classList.add('is-active');
      requestAnimationFrame(() => { nextFilm.style.transition = ''; });
    } else {
      nextFilm.classList.add('is-active');
      previous.classList.remove('is-active');
      activeFilm = 1-activeFilm;
    }

    canvas.style.filter = scene.filter;
    variables(scene);
    document.body.dataset.ambientScene = scene.name;
    current = index;
    window.dispatchEvent(new CustomEvent('4n1f:ambient-scene',{detail:{index,name:scene.name}}));
  }

  const sceneForNow = () => Math.floor(Date.now()/PERIOD) % scenes.length;
  apply(sceneForNow(), true);

  if (reduced) return;

  let timer = 0;
  let interval = 0;
  const schedule = () => {
    clearTimeout(timer);
    clearInterval(interval);
    const delay = PERIOD - (Date.now() % PERIOD) + 20;
    timer = setTimeout(() => {
      apply(sceneForNow());
      interval = setInterval(() => apply(sceneForNow()), PERIOD);
    }, delay);
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      apply(sceneForNow());
      schedule();
    }
  });
  schedule();
})();
