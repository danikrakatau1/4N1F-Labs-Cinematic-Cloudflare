#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const editorPath = 'dist/fetch/editor/editor.js';
const previewPath = 'dist/fetch/preview.html';
const previewShellSource = 'overrides/fetch-premium-v2/preview-shell.css';
const previewShellDist = 'dist/fetch/preview-shell.css';

function fail(message) {
  console.error('[4N1F handoff fix]', message);
  process.exit(1);
}

if (!fs.existsSync(editorPath)) fail(`missing ${editorPath}`);
if (!fs.existsSync(previewPath)) fail(`missing ${previewPath}`);
if (!fs.existsSync(previewShellSource)) fail(`missing ${previewShellSource}`);

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
// the old blank guard. V2.26 used computed visibility/opacity after 700ms; that
// can falsely classify a valid wedding cover as blank because authored opening
// scenes legitimately start hidden/opacity:0. The Cloudflare transplant had
// also replaced its fallback with about:blank, producing the white editor.
//
// Replace only renderPreview(). All schema, Source Graph V3, editable mapping,
// liveApply, inspector, APPLY/Clean/ZIP logic remain the pristine V2.26 engine.
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
fs.writeFileSync(editorPath, editor);

// Hard fail if the transplant regression reappears.
if (editor.includes("frame.src='about:blank'")) fail('about:blank editor fallback still present');
if (!editor.includes("sessionStorage.getItem('diniAnifRebuildSnapshot')")) fail('Fetch snapshot handoff key missing');
if (!editor.includes('FETCH SNAPSHOT LOADED')) fail('Fetch snapshot load marker missing');
if (!editor.includes('renderNativeEditor();renderPreview(true);renderInspector()')) fail('native editor hydration sequence missing');
if (!fs.existsSync(previewShellDist)) fail('preview shell was not copied to dist');

console.log('[4N1F handoff fix] preview shell + source-native editor handoff hardened');
