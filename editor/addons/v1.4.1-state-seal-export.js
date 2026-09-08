(() => {
  'use strict';

  if (window.__4N1F_STATE_SEAL_V141__) return;
  window.__4N1F_STATE_SEAL_V141__ = true;

  const $ = s => document.querySelector(s);
  const frame = $('#previewFrame');
  const applyBtn = $('#applyBtn');
  const editorFields = $('#editorFields');
  const toast = $('#toast');
  const exportMenu = $('#exportMenu');
  const previewIdInput = $('#previewIdInput');
  let toastTimer = 0;

  function notify(message, type = 'success') {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `show ${type}`;
    toastTimer = setTimeout(() => { toast.className = ''; }, 2600);
  }

  function waitForApplyAck(timeoutMs = 650) {
    return new Promise(resolve => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        removeEventListener('message', onMessage);
        clearTimeout(timer);
        resolve();
      };
      const onMessage = event => {
        if (event.source !== frame?.contentWindow) return;
        const msg = event.data;
        if (msg?.source === '4n1f-frame' && msg?.type === 'code') finish();
      };
      const timer = setTimeout(finish, timeoutMs);
      addEventListener('message', onMessage);
    });
  }

  async function sealCurrentState() {
    const doc = frame?.contentDocument;
    if (!doc?.documentElement || !doc.body) throw new Error('Target preview belum siap.');

    if (applyBtn && editorFields && !editorFields.hidden) {
      const ack = waitForApplyAck();
      applyBtn.click();
      await ack;
    }

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const liveDoc = frame.contentDocument;
    if (!liveDoc?.documentElement) throw new Error('Target preview tidak tersedia.');
    const root = liveDoc.documentElement.cloneNode(true);

    root.querySelectorAll('#__4n1f_box, #__4n1f_editor_style').forEach(node => node.remove());
    root.querySelectorAll('script').forEach(script => {
      const text = script.textContent || '';
      if (text.includes("source:'4n1f-frame'") && text.includes("box.id='__4n1f_box'")) script.remove();
    });
    root.querySelectorAll('*').forEach(el => {
      if (el.classList) {
        [...el.classList].filter(name => name.startsWith('__4n1f_')).forEach(name => el.classList.remove(name));
        if (!el.getAttribute('class')) el.removeAttribute('class');
      }
      ['data-editor-x','data-editor-y','data-editor-scale','data-editor-rotate','data-editor-blur'].forEach(name => el.removeAttribute(name));
    });

    const html = '<!doctype html>\n' + root.outerHTML;
    const sessionId = String(previewIdInput?.value || '').trim();
    return {
      html,
      sessionId,
      sealedAt: new Date().toISOString(),
      patchSet: String($('#jsonOutput')?.textContent || '—'),
      generatedCode: String($('#codeOutput')?.textContent || '')
    };
  }

  function downloadBlob(name, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function u16(value) {
    const out = new Uint8Array(2);
    new DataView(out.buffer).setUint16(0, value & 0xffff, true);
    return out;
  }

  function u32(value) {
    const out = new Uint8Array(4);
    new DataView(out.buffer).setUint32(0, value >>> 0, true);
    return out;
  }

  function concat(parts) {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) { out.set(part, offset); offset += part.length; }
    return out;
  }

  function dosStamp(date) {
    const year = Math.max(1980, date.getFullYear());
    return {
      time: ((date.getHours() & 31) << 11) | ((date.getMinutes() & 63) << 5) | ((date.getSeconds() >> 1) & 31),
      date: (((year - 1980) & 127) << 9) | (((date.getMonth() + 1) & 15) << 5) | (date.getDate() & 31)
    };
  }

  function createStoreZip(entries) {
    const enc = new TextEncoder();
    const now = dosStamp(new Date());
    const locals = [];
    const centrals = [];
    let localOffset = 0;

    for (const entry of entries) {
      const name = enc.encode(entry.name);
      const data = typeof entry.data === 'string' ? enc.encode(entry.data) : entry.data;
      const crc = crc32(data);
      const flags = 0x0800;
      const local = concat([
        u32(0x04034b50), u16(20), u16(flags), u16(0), u16(now.time), u16(now.date),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data
      ]);
      locals.push(local);

      const central = concat([
        u32(0x02014b50), u16(20), u16(20), u16(flags), u16(0), u16(now.time), u16(now.date),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(localOffset), name
      ]);
      centrals.push(central);
      localOffset += local.length;
    }

    const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
    const end = concat([
      u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
      u32(centralSize), u32(localOffset), u16(0)
    ]);
    return concat([...locals, ...centrals, end]);
  }

  async function openCleanPreview() {
    const popup = window.open('about:blank', '_blank');
    if (!popup) return notify('Popup diblokir browser. Izinkan popup lalu coba lagi.', 'error');
    try {
      popup.opener = null;
      popup.document.title = 'Sealing current state…';
      const sealed = await sealCurrentState();
      const url = URL.createObjectURL(new Blob([sealed.html], { type: 'text/html;charset=utf-8' }));
      popup.location.replace(url);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      notify('Clean Preview dibuka dari state CURRENT yang sudah di-APPLY.');
    } catch (error) {
      popup.close();
      notify(error?.message || 'Clean Preview gagal.', 'error');
    }
  }

  async function exportSealedZip() {
    try {
      const sealed = await sealCurrentState();
      const manifest = {
        format: '4N1F-LIVE-EDITOR-SEALED-ZIP-V1',
        preview_id: sealed.sessionId,
        sealed_at: sealed.sealedAt,
        contract: 'CURRENT = APPLY = CLEAN_PREVIEW = ZIP'
      };
      const entries = [
        { name: 'index.html', data: sealed.html },
        { name: '4n1f/manifest.json', data: JSON.stringify(manifest, null, 2) },
        { name: '4n1f/patch-set.json', data: sealed.patchSet === '—' ? '{}' : sealed.patchSet },
        { name: '4n1f/generated-code.txt', data: sealed.generatedCode || '/* No generated code. */' }
      ];
      const zip = createStoreZip(entries);
      const stem = /^p_[a-f0-9]{32}$/i.test(sealed.sessionId) ? sealed.sessionId.toLowerCase() : '4n1f-live-editor';
      downloadBlob(`${stem}-sealed.zip`, new Blob([zip], { type: 'application/zip' }));
      notify('ZIP sealed dari state yang sama dengan Clean Preview.');
    } catch (error) {
      notify(error?.message || 'Export ZIP gagal.', 'error');
    }
  }

  const tools = document.querySelector('.topbar .tools');
  if (tools && !$('#cleanPreviewBtn')) {
    const button = document.createElement('button');
    button.id = 'cleanPreviewBtn';
    button.type = 'button';
    button.textContent = 'Clean Preview';
    const exportBtn = $('#exportBtn');
    tools.insertBefore(button, exportBtn || null);
    button.addEventListener('click', openCleanPreview);
  }

  const exportCard = exportMenu?.querySelector('.export-card');
  if (exportCard && !exportCard.querySelector('[data-export="zip"]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.export = 'zip';
    button.className = 'primary';
    button.textContent = 'Website ZIP · Sealed';
    const note = exportCard.querySelector('small');
    exportCard.insertBefore(button, note || null);
  }

  exportMenu?.addEventListener('click', event => {
    const button = event.target.closest('[data-export="zip"]');
    if (!button) return;
    event.preventDefault();
    exportSealedZip();
  });

  window.__4N1F_STATE_SEAL_API__ = { sealCurrentState, createStoreZip, openCleanPreview, exportSealedZip };
})();
