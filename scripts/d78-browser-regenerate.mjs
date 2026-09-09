import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const outputPath = process.argv[2] || '/tmp/d78-source-native.html';
const targetUrl = 'https://www.arteriorshome.com/';
const canonical = process.env.CANONICAL_ORIGIN || 'https://4n1f-labs-cinematic-cloudflare.faqihanif12282000.workers.dev';
const distRoot = path.resolve('dist');

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return ({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}[ext] || 'application/octet-stream');
}

function autoScript() {
  return `\n<script id="d78-auto-regenerate">\n(async()=>{\n  const sleep=ms=>new Promise(r=>setTimeout(r,ms));\n  const waitFor=async(fn,ms,label)=>{const end=Date.now()+ms;let last;while(Date.now()<end){try{last=fn();if(last)return last}catch{}await sleep(250)}throw new Error('Timeout: '+label)};\n  const done=(html)=>{const bytes=new TextEncoder().encode(html);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));document.body.innerHTML='<pre id="d78-output">'+btoa(bin)+'</pre>';document.documentElement.setAttribute('data-d78-done','1')};\n  const fail=(e)=>{document.body.innerHTML='<pre id="d78-error">'+String(e&&e.stack||e).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</pre>';document.documentElement.setAttribute('data-d78-error','1')};\n  try{\n    await waitFor(()=>document.querySelector('#fetchSourceBtn')&&document.querySelector('#sourceUrl')&&document.querySelector('#sourceInput'),10000,'Fetch Studio ready');\n    const url=document.querySelector('#sourceUrl');url.value=${JSON.stringify(targetUrl)};\n    document.querySelector('#fetchSourceBtn').click();\n    await waitFor(()=>document.querySelector('#sourceInput').value.length>50000,30000,'remote HTML fetched');\n    const analyze=document.querySelector('#analyzeBtn');\n    if(document.querySelector('#buildBtn').disabled) analyze.click();\n    await waitFor(()=>!document.querySelector('#buildBtn').disabled,45000,'analysis complete');\n    document.querySelector('#buildBtn').click();\n    const html=await waitFor(()=>{const v=localStorage.getItem('diniAnifNativeHtml');return v&&v.length>50000?v:null},45000,'source-native build complete');\n    done(html);\n  }catch(e){fail(e)}\n})();\n</script>\n`;
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || '/', 'http://127.0.0.1');
    if (u.pathname === '/api/fetch-source' || u.pathname === '/api/fetch-asset') {
      const upstream = await fetch(canonical + u.pathname + u.search, { headers: { accept: req.headers.accept || '*/*' } });
      const body = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, Object.fromEntries([...upstream.headers.entries()].filter(([k]) => !['content-encoding','transfer-encoding','content-length'].includes(k.toLowerCase()))));
      res.end(body);
      return;
    }
    if (u.pathname === '/d78-proxy') {
      const raw = u.searchParams.get('url');
      if (!raw || !/^https:\/\/www\.arteriorshome\.com\//i.test(raw)) { res.writeHead(400); res.end('blocked'); return; }
      const upstream = await fetch(raw, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; 4N1F-Fetch-Studio/2.26)' } });
      const body = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, {'content-type': upstream.headers.get('content-type') || 'application/octet-stream'});res.end(body);return;
    }
    let rel = decodeURIComponent(u.pathname);
    if (rel === '/') rel = '/index.html';
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(distRoot, '.' + rel);
    if (!file.startsWith(distRoot + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('not found'); return; }
    let body = fs.readFileSync(file);
    if (u.searchParams.get('d78') === '1' && rel === '/fetch/index.html') {
      let html = body.toString('utf8');
      html = html.replace('</body>', autoScript() + '</body>');
      body = Buffer.from(html);
    }
    res.writeHead(200, {'content-type': contentType(file), 'cache-control': 'no-store'});res.end(body);
  } catch (e) { res.writeHead(500, {'content-type':'text/plain'});res.end(String(e?.stack || e)); }
});

await new Promise((resolve, reject) => { server.once('error', reject); server.listen(4173, '127.0.0.1', resolve); });

let chrome = '';
for (const cmd of ['google-chrome','google-chrome-stable','chromium','chromium-browser']) {
  try { chrome = execFileSync('bash',['-lc',`command -v ${cmd}`],{encoding:'utf8'}).trim(); if (chrome) break; } catch {}
}
if (!chrome) { server.close(); throw new Error('Chrome/Chromium tidak tersedia pada runner.'); }
console.error(`D78 browser regeneration using ${chrome}`);

const args = [
  '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
  '--disable-background-networking','--disable-default-apps','--disable-extensions',
  '--no-first-run','--user-data-dir=/tmp/d78-chrome-profile',
  '--virtual-time-budget=120000','--dump-dom','http://127.0.0.1:4173/fetch/?d78=1'
];
const child = spawn(chrome, args, {stdio:['ignore','pipe','pipe']});
let stdout='', stderr='';
child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
child.stdout.on('data', d => { stdout += d; });
child.stderr.on('data', d => { stderr += d; if (stderr.length > 120000) stderr = stderr.slice(-120000); });
const code = await new Promise(resolve => child.on('close', resolve));
await new Promise(resolve => server.close(resolve));
if (code !== 0) throw new Error(`Chrome gagal (${code}): ${stderr.slice(-5000)}`);

const ok = stdout.match(/<pre id="d78-output">([A-Za-z0-9+/=]+)<\/pre>/);
if (!ok) {
  const err = stdout.match(/<pre id="d78-error">([\s\S]*?)<\/pre>/);
  throw new Error(`D78 browser harness gagal: ${err ? err[1].replace(/<[^>]+>/g,' ').slice(0,4000) : stdout.slice(-4000)}`);
}
const html = Buffer.from(ok[1], 'base64').toString('utf8');
if (!/^<!doctype html>/i.test(html.trim())) throw new Error('D78 hasil browser bukan HTML source-native.');
if (/Preparing source-native package/i.test(html)) throw new Error('D78 browser menghasilkan placeholder.');
if (!/data-4n1f-identity-sanitized="1"/.test(html)) throw new Error('D78 identity sanitation marker hilang.');
if (!/https:\/\/www\.arteriorshome\.com\//i.test(html)) throw new Error('D78 hasil browser bukan rebuild Arteriors.');
fs.writeFileSync(outputPath, html);
console.error(`D78 browser source-native ready: ${html.length} chars -> ${outputPath}`);
