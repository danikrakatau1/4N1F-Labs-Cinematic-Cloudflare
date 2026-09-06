(() => {
  'use strict';

  const body = document.body;
  const tools = document.querySelector('.tools');
  const previewInput = document.getElementById('previewIdInput');
  if (!body || !tools) return;

  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';

  const trigger = document.createElement('button');
  trigger.id = 'commandPaletteBtn';
  trigger.type = 'button';
  trigger.textContent = shortcutLabel;
  trigger.title = `Command Palette (${isMac ? '⌘K' : 'Ctrl+K'})`;
  tools.appendChild(trigger);

  const overlay = document.createElement('div');
  overlay.className = 'cmdk-overlay';
  overlay.id = 'commandPalette';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <section class="cmdk-shell" role="dialog" aria-modal="true" aria-label="4N1F Command Palette">
      <div class="cmdk-head">
        <div class="cmdk-mark">4N</div>
        <input id="commandPaletteSearch" type="text" autocomplete="off" spellcheck="false" placeholder="Search commands…" aria-label="Search commands">
        <button class="cmdk-close" type="button" aria-label="Close command palette">ESC</button>
      </div>
      <div class="cmdk-list" id="commandPaletteList" role="listbox"></div>
      <div class="cmdk-foot"><span>↑ ↓ navigate · Enter run</span><span>${shortcutLabel} toggle</span></div>
    </section>`;
  document.body.appendChild(overlay);

  const spotlightExit = document.createElement('button');
  spotlightExit.className = 'spotlight-exit';
  spotlightExit.type = 'button';
  spotlightExit.innerHTML = '<i></i><span>Stage Spotlight · Exit</span><kbd>Esc</kbd>';
  document.body.appendChild(spotlightExit);

  const search = document.getElementById('commandPaletteSearch');
  const list = document.getElementById('commandPaletteList');
  const closeBtn = overlay.querySelector('.cmdk-close');
  let activeIndex = 0;
  let visibleCommands = [];
  let previousFocus = null;

  const click = (selector) => {
    const el = document.querySelector(selector);
    if (!el || el.disabled) return false;
    el.click();
    return true;
  };

  const focus = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return false;
    el.focus();
    if (typeof el.select === 'function') el.select();
    return true;
  };

  const device = (width) => {
    const button = document.querySelector(`.devicebar button[data-width="${width}"]`);
    if (!button) return false;
    button.click();
    return true;
  };

  const setSpotlight = (next) => {
    body.classList.toggle('stage-spotlight', next);
    trigger.textContent = next ? 'FOCUS' : shortcutLabel;
    trigger.setAttribute('aria-pressed', String(next));
    window.dispatchEvent(new CustomEvent('4n1f:stage-spotlight', { detail: { active: next } }));
  };

  const toggleSpotlight = () => setSpotlight(!body.classList.contains('stage-spotlight'));

  const commands = [
    { group:'Navigation', icon:'PR', title:'Back to Preview', desc:'Return to the clean preview for this Preview ID', key:'P', run:()=>click('#backPreviewBtn') },
    { group:'Navigation', icon:'ID', title:'Focus Preview ID', desc:'Jump to the current Preview ID field', key:'I', run:()=>focus('#previewIdInput') },
    { group:'Navigation', icon:'↻', title:'Reload Target', desc:'Reload the current Preview ID into the editor', key:'R', run:()=>click('#loadPreviewBtn') },
    { group:'Canvas', icon:'FS', title:'Toggle Stage Spotlight', desc:'Dim side panels and focus the live canvas', key:'S', run:toggleSpotlight },
    { group:'Canvas', icon:'D', title:'Desktop Canvas', desc:'Set editable target width to desktop', key:'1', run:()=>device('100%') },
    { group:'Canvas', icon:'T', title:'Tablet Canvas', desc:'Set editable target width to 768px', key:'2', run:()=>device('768px') },
    { group:'Canvas', icon:'M', title:'Mobile Canvas', desc:'Set editable target width to 430px', key:'3', run:()=>device('430px') },
    { group:'Edit', icon:'SE', title:'Select Mode', desc:'Return the canvas to direct selection mode', key:'V', run:()=>click('#selectBtn') },
    { group:'Edit', icon:'↶', title:'Undo', desc:'Undo the latest editor operation', key:'⌘Z', run:()=>click('#undoBtn') },
    { group:'Edit', icon:'↷', title:'Redo', desc:'Redo the latest editor operation', key:'⇧⌘Z', run:()=>click('#redoBtn') },
    { group:'Edit', icon:'AP', title:'Apply Draft + Code', desc:'Apply current inspector values and generate code', key:'A', run:()=>click('#applyBtn') },
    { group:'Session', icon:'EX', title:'Export Session', desc:'Open the existing export menu', key:'E', run:()=>click('#exportBtn') },
    { group:'Session', icon:'JS', title:'Copy Generated Code', desc:'Copy generated visual-to-code output when available', key:'C', run:()=>click('#copyCodeBtn') }
  ];

  function searchable(command) {
    return `${command.group} ${command.title} ${command.desc} ${command.key}`.toLowerCase();
  }

  function render() {
    if (!list) return;
    const q = String(search?.value || '').trim().toLowerCase();
    visibleCommands = commands.filter(command => !q || searchable(command).includes(q));
    activeIndex = Math.max(0, Math.min(activeIndex, visibleCommands.length - 1));

    if (!visibleCommands.length) {
      list.innerHTML = '<div class="cmdk-empty">No command found.</div>';
      return;
    }

    let lastGroup = '';
    list.innerHTML = visibleCommands.map((command, index) => {
      const group = command.group !== lastGroup
        ? `<div class="cmdk-group-label">${command.group}</div>`
        : '';
      lastGroup = command.group;
      return `${group}<button class="cmdk-item ${index === activeIndex ? 'active' : ''}" type="button" role="option" aria-selected="${index === activeIndex}" data-command-index="${index}">
        <span class="cmdk-icon">${command.icon}</span>
        <span class="cmdk-copy"><span class="cmdk-title">${command.title}</span><span class="cmdk-desc">${command.desc}</span></span>
        <span class="cmdk-key">${command.key}</span>
      </button>`;
    }).join('');

    requestAnimationFrame(() => list.querySelector('.cmdk-item.active')?.scrollIntoView({ block:'nearest' }));
  }

  function openPalette() {
    if (overlay.classList.contains('open')) return;
    previousFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    if (search) {
      search.value = '';
      activeIndex = 0;
      render();
      requestAnimationFrame(() => search.focus());
    }
  }

  function closePalette({ restoreFocus = true } = {}) {
    if (!overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (restoreFocus && previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll:true });
  }

  function runActive() {
    const command = visibleCommands[activeIndex];
    if (!command) return;
    closePalette({ restoreFocus:false });
    requestAnimationFrame(() => command.run());
  }

  trigger.addEventListener('click', openPalette);
  closeBtn?.addEventListener('click', () => closePalette());
  spotlightExit.addEventListener('click', () => setSpotlight(false));
  search?.addEventListener('input', () => { activeIndex = 0; render(); });

  list?.addEventListener('mousemove', (event) => {
    const item = event.target.closest('[data-command-index]');
    if (!item) return;
    const next = Number(item.dataset.commandIndex);
    if (!Number.isFinite(next) || next === activeIndex) return;
    activeIndex = next;
    render();
  });

  list?.addEventListener('click', (event) => {
    const item = event.target.closest('[data-command-index]');
    if (!item) return;
    activeIndex = Number(item.dataset.commandIndex) || 0;
    runActive();
  });

  overlay.addEventListener('pointerdown', (event) => {
    if (event.target === overlay) closePalette();
  });

  document.addEventListener('keydown', (event) => {
    const modK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (modK) {
      event.preventDefault();
      overlay.classList.contains('open') ? closePalette() : openPalette();
      return;
    }

    if (overlay.classList.contains('open')) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePalette();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (visibleCommands.length) activeIndex = (activeIndex + 1) % visibleCommands.length;
        render();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (visibleCommands.length) activeIndex = (activeIndex - 1 + visibleCommands.length) % visibleCommands.length;
        render();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        runActive();
      }
      return;
    }

    if (event.key === 'Escape' && body.classList.contains('stage-spotlight')) {
      event.preventDefault();
      setSpotlight(false);
    }
  }, true);

  window.__4N1F_COMMAND_PALETTE__ = Object.freeze({
    version:'1.4.0',
    open:openPalette,
    close:closePalette,
    spotlight:toggleSpotlight
  });

  render();
})();
