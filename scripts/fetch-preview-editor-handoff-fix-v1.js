#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const editorPath = 'dist/fetch/editor/editor.js';
const studioPath = 'dist/fetch/studio.js';
const resolverPath = 'dist/fetch/visual-resolver.js';
const previewPath = 'dist/fetch/preview.html';
const previewShellSource = 'overrides/fetch-premium-v2/preview-shell.css';
const previewShellDist = 'dist/fetch/preview-shell.css';

function fail(message) {
  console.error('[4N1F handoff fix]', message);
  process.exit(1);
}

for (const file of [editorPath, studioPath, resolverPath, previewPath, previewShellSource]) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
}

// 1) Preview page: Quantum studio.css intentionally replaced the old V2.26
// studio stylesheet. Restore the preview-only full viewport contract separately
// so the source-native iframe is not left at the browser default 300x150.
fs.copyFileSync(previewShellSource, previewShellDist);
let preview = fs.readFileSync(previewPath, 'utf8');
if (!preview.includes('./preview-shell.css')) {
  if (!preview.includes('</head>')) fail('preview.html has no </head> marker');
  preview = preview.replace('</head>', '  <link rel="stylesheet" href="./preview-shell.css">\n</head>');
  fs.writeFileSync(previewPath, preview);
}

// 2) Native Editor: preserve the original Fetch snapshot handoff, but harden
// the old blank guard. A valid authored opening can start hidden/opacity:0 and
// must never be discarded as a blank preview.
let editor = fs.readFileSync(editorPath, 'utf8');
const start = editor.indexOf(' function renderPreview(force=false){');
const end = editor.indexOf('\n function highlightSelection', start);
if (start < 0 || end < 0) fail('renderPreview() boundary not found in editor.js');

const hardened = ` function renderPreview(force=false){
   if(!native){frame.removeAttribute('srcdoc');frame.src='./invitation.html?editor=1';return}
   if(!force&&frame.srcdoc&&liveDoc())return;
   const html=rebuildHtml(),token=String((Number(frame.dataset.renderSeq||0)+1));
   frame.dataset.renderSeq=token;delete frame.dataset.rawRecovery;
   frame.onload=()=>{
     if(frame.dataset.renderSeq!==token)return;
     installFrameBridge();
     setTimeout(()=>{
       if(frame.dataset.renderSeq!==token)return;
       try{
         const d=liveDoc(),b=d?.body;if(!b)return;
         const hasStructure=!!(b.children.length||(b.textContent||'').trim().length||d.querySelector('img,svg,canvas,video,audio,main,section,#cover,[data-elementor-type],[data-native-node-id],[data-native-edit-id]'));
         if(!hasStructure&&!frame.dataset.rawRecovery){
           console.warn('Editor source-native structural guard triggered; retrying raw Fetch snapshot');
           frame.dataset.rawRecovery=token;
           frame.onload=()=>{if(frame.dataset.renderSeq===token)installFrameBridge()};
           frame.srcdoc=native.baseHtml||html;
           editorToast('Source-native preview dipulihkan langsung dari snapshot Fetch.','info','Preview dipulihkan');
         }
       }catch(e){console.warn('source-native structural guard',e)}
     },1800)
   };
   frame.removeAttribute('src');
   frame.srcdoc=html
 }`;

editor = editor.slice(0, start) + hardened + editor.slice(end);

// Defense-in-depth for Production ZIPs: even if an old snapshot already carries
// a WordPress content-protection message, rebuildHtml() strips it before APPLY,
// Clean Preview, B2 packaging, or Download ZIP.
const editorSanitizeCall = "window.DiniVisualResolver?.sanitizeRuntimeNoise?.(doc);";
if (!editor.includes(editorSanitizeCall)) fail('editor runtime sanitizer call missing');
const editorProtectionSweep = `${editorSanitizeCall}doc.querySelectorAll('#wpcp-error-message,.msgmsg-box-wpcp,[id*="wpcp"],[class*="wpcp"]').forEach(n=>n.remove());[...doc.querySelectorAll('div,p,span')].forEach(n=>{if(/^(?:error:\\s*)?content is protected\\s*!*$/i.test((n.textContent||'').replace(/\\s+/g,' ').trim()))n.remove()});`;
editor = editor.split(editorSanitizeCall).join(editorProtectionSweep);
fs.writeFileSync(editorPath, editor);

// 3) Source sanitation: V2.26 already removed protection scripts/styles, but the
// plugin's visible DOM message (#wpcp-error-message) could survive. Remove the
// protection DOM itself and print-blocking protection CSS as part of the same
// canonical sanitizer shared by Fetch and Editor.
let resolver = fs.readFileSync(resolverPath, 'utf8');
const resolverStart = resolver.indexOf('  function sanitizeRuntimeNoise(doc){');
const resolverEnd = resolver.indexOf('\n  function replaceBackgroundLayer', resolverStart);
if (resolverStart < 0 || resolverEnd < 0) fail('sanitizeRuntimeNoise() boundary not found in visual-resolver.js');

const hardenedSanitizer = `  function sanitizeRuntimeNoise(doc){
    if(!doc)return;
    const bad=/wpcp|disable[_-]?(copy|selection|right)|right[_-]?click|content.?protected|wpadminbar|rank-math-schema/i;
    doc.querySelectorAll('script').forEach(s=>{const sig=[s.id,s.className,s.getAttribute('src'),s.textContent?.slice(0,1200)].join(' ');if(bad.test(sig))s.remove()});
    doc.querySelectorAll('style').forEach(s=>{const sig=[s.id,s.textContent?.slice(0,1800)].join(' ');if(/wpcp|unselectable|touch-callout|user-select\\s*:\\s*none|not allowed to print|body\\s*\\*\\s*\\{\\s*display\\s*:\\s*none/i.test(sig))s.remove()});
    doc.querySelectorAll('#wpcp-error-message,.msgmsg-box-wpcp,[id*="wpcp"],[class*="wpcp"]').forEach(n=>n.remove());
    [...doc.querySelectorAll('div,p,span')].forEach(n=>{const text=(n.textContent||'').replace(/\\s+/g,' ').trim();if(/^(?:error:\\s*)?content is protected\\s*!*$/i.test(text))n.remove()});
    doc.body?.classList?.remove('unselectable');
    for(const prop of ['oncontextmenu','onselectstart','onmousedown','ondragstart','onkeydown'])try{doc[prop]=null}catch{}
    doc.documentElement.setAttribute('data-dini-runtime-sanitized','1')
  }`;
resolver = resolver.slice(0, resolverStart) + hardenedSanitizer + resolver.slice(resolverEnd);
fs.writeFileSync(resolverPath, resolver);

// 4) Reveal parity: the downloaded production package proved that the edited
// name belongs to a single s02 field inside .motionText. The old global IO was
// observing those timeline nodes before "Buka Undangan", which could release
// the name early. Motion-scene nodes are now owned only by the explicit opening
// timeline. First-viewport recovery also respects authored animation delays.
let studio = fs.readFileSync(studioPath, 'utf8');
const oldReveal = "const revealNow=el=>{if(!el)return;const mobile=matchMedia('(max-width:767px)').matches;let name=(mobile?el.getAttribute('data-native-animation-mobile'):el.getAttribute('data-native-animation'))||el.getAttribute('data-native-reveal')||'';if(name==='none')name='';el.classList.remove('elementor-invisible');el.classList.add('native-visible');el.style.removeProperty('opacity');el.style.removeProperty('visibility');if(name&&!matchMedia('(prefers-reduced-motion: reduce)').matches){el.classList.add('animated',name);const d=Number(el.getAttribute('data-native-animation-delay')||0);if(d>0)el.style.animationDelay=d+'ms';}};";
const newReveal = "const revealNow=(el,skipDelay=false)=>{if(!el)return;const mobile=matchMedia('(max-width:767px)').matches;let name=(mobile?el.getAttribute('data-native-animation-mobile'):el.getAttribute('data-native-animation'))||el.getAttribute('data-native-reveal')||'';if(name==='none')name='';el.classList.remove('elementor-invisible');el.classList.add('native-visible');el.style.removeProperty('opacity');el.style.removeProperty('visibility');if(name&&!matchMedia('(prefers-reduced-motion: reduce)').matches){el.classList.add('animated',name);const d=skipDelay?0:Number(el.getAttribute('data-native-animation-delay')||0);if(d>0)el.style.animationDelay=d+'ms';else el.style.removeProperty('animation-delay');}};";
if (!studio.includes(oldReveal)) fail('revealNow() source signature not found in studio.js');
studio = studio.replace(oldReveal, newReveal);

const oldFirstRecovery = "if(first){first.querySelectorAll('[data-native-reveal]').forEach((el,i)=>{if(el.closest('.motionText,[class*=\"motionText\"]'))return;setTimeout(()=>revealNow(el),Math.min(i,8)*110+80)});}";
const newFirstRecovery = "if(first){first.querySelectorAll('[data-native-reveal]').forEach((el,i)=>{if(el.closest('.motionText,[class*=\"motionText\"]'))return;if(Number(el.getAttribute('data-native-animation-delay')||0)>0)return;setTimeout(()=>revealNow(el),Math.min(i,8)*110+80)});}";
if (!studio.includes(oldFirstRecovery)) fail('first viewport reveal recovery signature not found');
studio = studio.replace(oldFirstRecovery, newFirstRecovery);

const oldTimeline4500 = "setTimeout(()=>motionTexts.forEach(el=>el.querySelectorAll('[data-native-reveal],.delay-image').forEach((n,i)=>setTimeout(()=>revealNow(n),i*80))),4500);";
const newTimeline4500 = "setTimeout(()=>motionTexts.forEach(el=>el.querySelectorAll('[data-native-reveal],.delay-image').forEach((n,i)=>setTimeout(()=>revealNow(n,true),i*80))),4500);";
if (!studio.includes(oldTimeline4500)) fail('motion timeline 4500ms signature not found');
studio = studio.replace(oldTimeline4500, newTimeline4500);

const oldTimeline4600 = "setTimeout(()=>motionTexts.forEach(el=>{const nodes=[...el.querySelectorAll('[data-native-reveal]')];if(nodes.length)revealNow(nodes[nodes.length-1]);}),4600);";
const newTimeline4600 = "setTimeout(()=>motionTexts.forEach(el=>{const nodes=[...el.querySelectorAll('[data-native-reveal]')];if(nodes.length)revealNow(nodes[nodes.length-1],true);}),4600);";
if (!studio.includes(oldTimeline4600)) fail('motion timeline 4600ms signature not found');
studio = studio.replace(oldTimeline4600, newTimeline4600);

const oldObserver = "document.querySelectorAll('[data-native-reveal]').forEach(el=>io.observe(el));";
const newObserver = "document.querySelectorAll('[data-native-reveal]').forEach(el=>{if(el.closest('.motionText,[class*=\"motionText\"]'))return;io.observe(el)});";
if (!studio.includes(oldObserver)) fail('global reveal observer signature not found');
studio = studio.replace(oldObserver, newObserver);
fs.writeFileSync(studioPath, studio);

// Hard guards for all regressions covered by this build patch.
if (editor.includes("frame.src='about:blank'")) fail('about:blank editor fallback still present');
if (!editor.includes("sessionStorage.getItem('diniAnifRebuildSnapshot')")) fail('Fetch snapshot handoff key missing');
if (!editor.includes('FETCH SNAPSHOT LOADED')) fail('Fetch snapshot load marker missing');
if (!editor.includes('renderNativeEditor();renderPreview(true);renderInspector()')) fail('native editor hydration sequence missing');
if (!editor.includes('#wpcp-error-message')) fail('editor protection sweep missing');
if (!resolver.includes('#wpcp-error-message')) fail('canonical protection sanitizer missing');
if (!studio.includes('revealNow(n,true)')) fail('motion timeline delay ownership fix missing');
if (!studio.includes("if(el.closest('.motionText,[class*=\"motionText\"]'))return;io.observe(el)")) fail('motionText global observer exclusion missing');
if (!studio.includes("if(Number(el.getAttribute('data-native-animation-delay')||0)>0)return")) fail('authored delay recovery guard missing');
if (!fs.existsSync(previewShellDist)) fail('preview shell was not copied to dist');

console.log('[4N1F handoff fix] full viewport + editor handoff + reveal parity + protection sanitation hardened');
