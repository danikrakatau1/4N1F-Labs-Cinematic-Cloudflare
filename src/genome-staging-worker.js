const FETCH_ORIGIN = 'https://4n1f-labs-cinematic-cloudflare.faqihanif12282000.workers.dev';
const MAX_HTML = 3_500_000;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-4n1f-staging': 'genome-engine-phase1'
    }
  });
}

function uniq(values, limit = 24) {
  return [...new Set(values.filter(Boolean))].slice(0, limit);
}

function cleanText(value, max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function countMatches(source, re) {
  const m = source.match(re);
  return m ? m.length : 0;
}

function topValues(source, re, normalizer = v => v, limit = 12) {
  const counts = new Map();
  let match;
  while ((match = re.exec(source))) {
    const value = normalizer(match[1]);
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function extractMeta(html) {
  const title = cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], 220);
  const description = cleanText(
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)?.[1],
    320
  );
  const lang = cleanText(html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1], 24);
  return { title, description, lang };
}

function extractTechnology(html) {
  const lower = html.toLowerCase();
  const hits = [];
  if (lower.includes('__next_data__') || lower.includes('/_next/')) hits.push('Next.js');
  if (lower.includes('data-reactroot') || lower.includes('react-dom') || lower.includes('react.production')) hits.push('React');
  if (lower.includes('__nuxt__') || lower.includes('/_nuxt/')) hits.push('Nuxt');
  if (lower.includes('data-v-') || lower.includes('vue.runtime')) hits.push('Vue');
  if (lower.includes('wp-content') || lower.includes('wp-includes')) hits.push('WordPress');
  if (lower.includes('cdn.shopify.com') || lower.includes('shopify.theme')) hits.push('Shopify');
  if (lower.includes('webflow.js') || lower.includes('data-wf-page')) hits.push('Webflow');
  if (lower.includes('framerusercontent.com') || lower.includes('framer-motion')) hits.push('Framer');
  if (lower.includes('gtag(') || lower.includes('googletagmanager.com')) hits.push('Google Analytics/Tag Manager');
  return uniq(hits, 12);
}

function analyzeHtml(html, finalUrl, bytes, contentType) {
  const meta = extractMeta(html);
  const tags = {
    elements: countMatches(html, /<[a-z][a-z0-9:-]*(?:\s|>)/gi),
    divs: countMatches(html, /<div(?:\s|>)/gi),
    sections: countMatches(html, /<section(?:\s|>)/gi),
    headings: countMatches(html, /<h[1-6](?:\s|>)/gi),
    links: countMatches(html, /<a(?:\s|>)/gi),
    buttons: countMatches(html, /<button(?:\s|>)/gi),
    forms: countMatches(html, /<form(?:\s|>)/gi),
    images: countMatches(html, /<img(?:\s|>)/gi),
    scripts: countMatches(html, /<script(?:\s|>)/gi),
    stylesheets: countMatches(html, /<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi),
    inline_styles: countMatches(html, /<style(?:\s|>)/gi)
  };

  const colors = topValues(
    html,
    /(?:#([0-9a-f]{3,8})\b|(?:rgb|rgba|hsl|hsla)\(([^)]*)\))/gi,
    value => value ? `#${value.toUpperCase()}` : '',
    14
  );

  const rgbColors = topValues(
    html,
    /\b((?:rgb|rgba|hsl|hsla)\([^)]*\))/gi,
    value => cleanText(value, 80),
    10
  );

  const fontFamilies = topValues(
    html,
    /font-family\s*:\s*([^;}"']+)/gi,
    value => cleanText(value, 120).replace(/\s*!important$/i, ''),
    12
  );

  const radii = topValues(
    html,
    /border-radius\s*:\s*([^;}]+)/gi,
    value => cleanText(value, 60).replace(/\s*!important$/i, ''),
    10
  );

  const spacing = topValues(
    html,
    /(?:margin|padding|gap)(?:-[a-z]+)?\s*:\s*([^;}]+)/gi,
    value => cleanText(value, 80).replace(/\s*!important$/i, ''),
    12
  );

  const assetHosts = [];
  for (const match of html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)["']/gi)) {
    try { assetHosts.push(new URL(match[1]).hostname); } catch {}
  }

  const design = {
    colors: [...colors, ...rgbColors].slice(0, 16),
    font_families: fontFamilies,
    spacing,
    radii,
    box_shadows: countMatches(html, /box-shadow\s*:/gi),
    gradients: countMatches(html, /(?:linear|radial|conic)-gradient\s*\(/gi),
    css_variables: countMatches(html, /--[a-z0-9-_]+\s*:/gi),
    media_queries: countMatches(html, /@media\b/gi)
  };

  return {
    site_genome: {
      schema: '4n1f-site-genome-quick-v1',
      mode: 'quick',
      target: finalUrl,
      fetched_bytes: bytes,
      content_type: contentType,
      metadata: meta,
      structure: tags,
      technology: extractTechnology(html),
      asset_hosts: uniq(assetHosts, 16),
      generated_at: new Date().toISOString()
    },
    design_tokens: {
      schema: '4n1f-design-tokens-observed-v1',
      source: 'static-source-observation',
      target: finalUrl,
      observed: design,
      note: 'Observed values are extracted from fetched public HTML/CSS text and are not computed-style guarantees.'
    }
  };
}

async function genomeQuick(request) {
  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed.' }, 405);
  const body = await request.json().catch(() => null);
  const target = cleanText(body?.url, 2048);
  if (!target) return json({ success: false, message: 'Target URL wajib diisi.' }, 400);
  if (body?.authorized !== true) return json({ success: false, message: 'Konfirmasi public/authorized target diperlukan.' }, 400);

  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`);
  } catch {
    return json({ success: false, message: 'Target URL tidak valid.' }, 400);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return json({ success: false, message: 'Hanya URL http/https yang didukung.' }, 400);

  const started = Date.now();
  try {
    const fetchStarted = Date.now();
    const response = await fetch(`${FETCH_ORIGIN}/api/fetch-source`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ url: parsed.href })
    });
    const fetched = await response.json().catch(() => null);
    if (!response.ok || !fetched?.ok) {
      return json({
        success: false,
        stage: 'fetch',
        message: fetched?.error || `Fetch Engine gagal (${response.status}).`
      }, response.status >= 400 && response.status < 600 ? response.status : 502);
    }

    const html = String(fetched.html || '');
    if (!html || html.length > MAX_HTML + 1024) return json({ success: false, stage: 'fetch', message: 'Source tidak tersedia atau melewati batas Quick Genome.' }, 422);
    const fetchMs = Date.now() - fetchStarted;

    const analysisStarted = Date.now();
    const result = analyzeHtml(html, fetched.url || parsed.href, Number(fetched.bytes || 0), fetched.contentType || 'unknown');
    const analysisMs = Date.now() - analysisStarted;

    return json({
      success: true,
      schema: '4n1f-genome-quick-response-v1',
      engine: 'Genome Engine Phase 1',
      pipeline: ['Fetch Engine', 'Source X-Ray', 'Design DNA'],
      read_only: true,
      persisted: false,
      timings_ms: { fetch: fetchMs, analyze: analysisMs, total: Date.now() - started },
      ...result
    });
  } catch (error) {
    return json({ success: false, stage: 'adapter', message: error?.message || 'Genome Quick adapter gagal.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/genome-quick') return genomeQuick(request);
    if (url.pathname.startsWith('/api/')) {
      return json({
        success: false,
        staging: true,
        message: 'Genome staging only exposes the read-only /api/genome-quick adapter. Production KV/Preview/Editor APIs remain disconnected.'
      }, 423);
    }
    return env.ASSETS.fetch(request);
  }
};
