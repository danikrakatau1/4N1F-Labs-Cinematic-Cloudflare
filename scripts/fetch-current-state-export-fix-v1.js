#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const editorPath = 'dist/fetch/editor/editor.js';
const cleanPath = 'dist/fetch/editor/clean-preview.js';

function fail(message) {
  console.error('[4N1F current-state fix]', message);
  process.exit(1);
}
for (const file of [editorPath, cleanPath]) if (!fs.existsSync(file)) fail(`missing ${file}`);

let editor = fs.readFileSync(editorPath, 'utf8');

// Current-state helpers. Uploaded media lives in generatedAssets, not native.values.
// Seal those values into APPLY snapshots and exported HTML so source runtime cannot
// restore the original image/media after Clean Preview reloads the document.
const rebuildMarker = ' function rebuildHtml({forExport=false}={}){';
const rebuildStart = editor.indexOf(rebuildMarker);
const assetPreviewStart = editor.indexOf('\n function assetPreviewUrl', rebuildStart);
if (rebuildStart < 0 || assetPreviewStart < 0) fail('rebuildHtml() boundary not found');

const helpersAndRebuild = ` function currentStateValue(f,{forExport=false}={}){
   const a=generatedAssets.get(f.id);
   return a?(forExport?a.path:assetPreviewUrl(a)):(native.values[f.id]??f.value??'')
 }
 function fieldIsEdited(f){
   if(!f)return false;
   if(generatedAssets.has(f.id))return true;
   if(transforms[f.id])return true;
   return String(native.values[f.id]??'')!==String(f.value??'')
 }
 function currentAppliedValues(){
   const out=deep(native?.values||{});
   for(const f of native?.schema?.fields||[]){const a=generatedAssets.get(f.id);if(a)out[f.id]=a.path}
   return out
 }
 function currentManifestForValues(values){
   const out=deep(native?.manifest||{}),sync=list=>{if(!Array.isArray(list))return;for(const src of list){if(src?.id&&Object.prototype.hasOwnProperty.call(values,src.id))src.url=String(values[src.id]??'')}};
   sync(out.visual_manifest?.sources);sync(out.source_graph?.visuals);return out
 }
 function injectCurrentStateLock(doc,{forExport=false}={}){
   if(!doc?.body||!native)return;
   doc.querySelectorAll('[data-4n1f-current-state-lock]').forEach(n=>n.remove());
   const kinds=new Set(['image','background','video','audio']);
   const locks=(native.schema.fields||[]).filter(f=>kinds.has(f.kind)&&fieldIsEdited(f)).map(f=>({id:f.id,node:f.node_id||'',kind:f.kind,attribute:f.attribute||'',role:f.media_role||'',slide:Number.isInteger(f.slide_index)?f.slide_index:null,value:String(currentStateValue(f,{forExport})??'')}));
   if(!locks.length)return;
   const sc=doc.createElement('script');sc.setAttribute('data-4n1f-current-state-lock','v1');
   sc.textContent=\`(()=>{const LOCKS=\${JSON.stringify(locks)};const q=s=>String(s||'').replace(/[\\\\"]/g,'\\\\$&');const find=l=>document.querySelector('[data-native-node-id="'+q(l.node)+'"]')||document.querySelector('[data-native-edit-id="'+q(l.id)+'"]')||document.querySelector('[data-native-edit-ids*="'+q(l.id)+'"]');const set=(e,k,v)=>{if(e&&e.getAttribute(k)!==v)e.setAttribute(k,v)};const apply=l=>{const e=find(l);if(!e)return;const v=l.value||'';if(l.kind==='image'){set(e,'src',v);set(e,'data-src',v);for(const k of ['srcset','sizes','data-lazy-src','data-srcset'])e.removeAttribute(k);const p=e.closest?.('picture');p?.querySelectorAll('source').forEach(s=>{s.removeAttribute('srcset');s.removeAttribute('data-srcset')})}else if(l.kind==='video'||l.kind==='audio'){set(e,l.attribute||'src',v);if((l.attribute||'src')==='src')e.querySelectorAll?.('source').forEach(s=>set(s,'src',v))}else if(l.kind==='background'){if(l.role==='slideshow'||Number.isInteger(l.slide)){let cfg={};try{cfg=JSON.parse((e.getAttribute('data-settings')||'{}').replace(/&quot;/g,'"'))}catch{};const gal=Array.isArray(cfg.background_slideshow_gallery)?cfg.background_slideshow_gallery:[],i=Number(l.slide)||0;while(gal.length<=i)gal.push({url:''});gal[i]={...(gal[i]||{}),url:v};cfg.background_slideshow_gallery=gal;set(e,'data-settings',JSON.stringify(cfg));const layer=e.querySelector?.('.elementor-background-slideshow[data-native-slideshow]');if(layer){let urls=[];try{urls=JSON.parse(layer.getAttribute('data-native-slideshow-urls')||'[]')}catch{};while(urls.length<=i)urls.push('');urls[i]=v;set(layer,'data-native-slideshow-urls',JSON.stringify(urls));const slides=layer.querySelectorAll?.('.swiper-slide-bg,[data-native-slide-bg]')||[];const pic=slides[i]||slides[0];if(pic&&pic.style.getPropertyValue('background-image')!==('url("'+v.replace(/"/g,'%22')+'")'))pic.style.setProperty('background-image','url("'+v.replace(/"/g,'%22')+'")','important')}}else{const val=v?'url("'+v.replace(/"/g,'%22')+'")':'none';if(e.style.getPropertyValue('background-image')!==val)e.style.setProperty('background-image',val,'important');if(l.role==='gallery'){set(e,'data-thumbnail',v);const a=e.closest?.('a.e-gallery-item,a.elementor-gallery-item');if(a)set(a,'href',v||'#')}}}};const run=()=>LOCKS.forEach(apply);run();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});addEventListener('load',run,{once:true});[0,80,250,700,1500,3200,7000].forEach(ms=>setTimeout(run,ms));const mo=new MutationObserver(run);const start=()=>{if(document.body)mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset','data-src','data-lazy-src','data-srcset']})};start();setTimeout(()=>mo.disconnect(),15000);document.documentElement.setAttribute('data-4n1f-current-state-sealed','1')})();\`;
   doc.body.appendChild(sc)
 }
 function rebuildHtml({forExport=false}={}){
   const doc=parseNative(native.baseHtml);refreshVisualManifest();
   const fields=[...(native.schema.fields||[])].sort((a,b)=>Number(fieldIsEdited(a))-Number(fieldIsEdited(b)));
   for(const f of fields)applyField(doc,f,currentStateValue(f,{forExport}));
   for(const f of native.schema.fields||[]){if(transforms[f.id])applyTransform(nodeFor(doc,f),f,transforms[f.id])}
   if(forExport){doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach(l=>{const local=localizedLinks.get(l.href)||localizedLinks.get(l.getAttribute('href'));if(local)l.setAttribute('href',local)})}
   window.DiniVisualResolver?.sanitizeRuntimeNoise?.(doc);
   doc.querySelectorAll('#wpcp-error-message,.msgmsg-box-wpcp,[id*="wpcp"],[class*="wpcp"]').forEach(n=>n.remove());
   [...doc.querySelectorAll('div,p,span')].forEach(n=>{if(/^(?:error:\\s*)?content is protected\\s*!*$/i.test((n.textContent||'').replace(/\\s+/g,' ').trim()))n.remove()});
   window.DiniVisualResolver?.sanitizeIdentity(doc,{title:'4N1F Fetch — '+(currentTemplateRecord?.name||'Template'),favicon:'/assets/favicon.svg'});
   injectEditorParityPatch(doc,{forExport});injectCurrentStateLock(doc,{forExport});return serialize(doc)
 }`;
editor = editor.slice(0, rebuildStart) + helpersAndRebuild + editor.slice(assetPreviewStart);

// APPLY snapshot values must point to the actual edited/generated media paths.
const applyStart = editor.indexOf(' applyBtn.onclick=async()=>{');
const applyEnd = editor.indexOf('\n previewBtn.onclick=', applyStart);
if (applyStart < 0 || applyEnd < 0) fail('APPLY handler boundary not found');
const applyHandler = ` applyBtn.onclick=async()=>{if(!native)return editorToast('Import Rebuild ZIP dulu.','error','Belum ada template');const t=editorToast('Menyimpan snapshot final + asset ke IndexedDB…','loading','APPLY');try{const revision='r'+Date.now().toString(36),assets=await persistAppliedAssets(revision),values=currentAppliedValues(),html=rebuildHtml({forExport:true}),manifest=currentManifestForValues(values),snap={version:'2.26.1-current-state',revision,schema:deep(native.schema),manifest,values,transforms:deep(transforms),html,assets,applied_at:new Date().toISOString(),state_sealed:true};await putAppliedSnapshot(snap);isDirty=false;dirty.textContent='APPLIED ✓ · CURRENT STATE SEALED';finishEditorToast(t,\`${assets.length} asset + semua perubahan CURRENT tersimpan dan dikunci untuk Clean Preview/ZIP.\`,'success','APPLY sukses')}catch(e){finishEditorToast(t,e.message,'error','APPLY gagal')}};`;
editor = editor.slice(0, applyStart) + applyHandler + editor.slice(applyEnd);

// B2/current package must use the same final values as APPLY.
const snapStart = editor.indexOf(' async function snapshotCurrentEditorForPackage(){');
const snapEnd = editor.indexOf('\n async function buildProductionZipFromCurrent', snapStart);
if (snapStart < 0 || snapEnd < 0) fail('snapshotCurrentEditorForPackage() boundary not found');
const snapFn = ` async function snapshotCurrentEditorForPackage(){
   if(!native)throw new Error('Belum ada template di Editor.');
   const revision='b2-'+Date.now().toString(36),assets=await persistAppliedAssets(revision),values=currentAppliedValues(),html=rebuildHtml({forExport:true}),manifest=currentManifestForValues(values);
   return {version:'2.26.1-current-state',revision,schema:deep(native.schema),manifest,values,transforms:deep(transforms||{}),html,assets,applied_at:new Date().toISOString(),state_sealed:true}
 }`;
editor = editor.slice(0, snapStart) + snapFn + editor.slice(snapEnd);

// Download ZIP must retain values + transforms, not values-only legacy data.
const valuesOnly = "{name:'native-data.json',data:JSON.stringify(snap.values,null,2)}";
if (!editor.includes(valuesOnly)) fail('values-only Download ZIP native-data signature not found');
editor = editor.split(valuesOnly).join("{name:'native-data.json',data:JSON.stringify({values:snap.values,transforms:snap.transforms||{}},null,2)}");

fs.writeFileSync(editorPath, editor);

let clean = fs.readFileSync(cleanPath, 'utf8');
const cleanValuesOnly = "{name:'native-data.json',data:JSON.stringify(snap.values||{},null,2)}";
if (!clean.includes(cleanValuesOnly)) fail('Clean Preview values-only native-data signature not found');
clean = clean.split(cleanValuesOnly).join("{name:'native-data.json',data:JSON.stringify({values:snap.values||{},transforms:snap.transforms||{}},null,2)}");
// Stamp the rendered frame so tests/users can distinguish a sealed snapshot from stale APPLY data.
const frameSrcdoc = '  frame.srcdoc=html;';
if (!clean.includes(frameSrcdoc)) fail('Clean Preview frame.srcdoc signature not found');
clean = clean.replace(frameSrcdoc, "  frame.dataset.stateRevision=String(snap.revision||'');frame.dataset.stateSealed=snap.state_sealed?'1':'0';\n  frame.srcdoc=html;");
fs.writeFileSync(cleanPath, clean);

// Hard guards.
for (const marker of ['currentAppliedValues','data-4n1f-current-state-lock','CURRENT STATE SEALED','state_sealed:true']) if (!editor.includes(marker)) fail(`editor marker missing: ${marker}`);
if (!editor.includes("JSON.stringify({values:snap.values,transforms:snap.transforms||{}},null,2)")) fail('Download ZIP native-data is not values+transforms');
if (!clean.includes("JSON.stringify({values:snap.values||{},transforms:snap.transforms||{}},null,2)")) fail('Clean ZIP native-data is not values+transforms');
if (!clean.includes('frame.dataset.stateSealed')) fail('Clean Preview sealed-state marker missing');

console.log('[4N1F current-state fix] Editor = APPLY = Clean Preview = Download ZIP state contract hardened');
