const MAX_HTML = 3_500_000;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-4n1f-staging': 'genome-engine-phase2'
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

function collectAssets(html, baseUrl) {
  const urls = [];
  for (const match of html.matchAll(/(?:src|href)=["']([^"'#]+)["']/gi)) {
    try {
      const u = new URL(match[1], baseUrl);
      if (['http:', 'https:'].includes(u.protocol)) urls.push(u.href);
    } catch {}
  }
  const unique = uniq(urls, 120);
  const byType = { images: 0, scripts: 0, stylesheets: 0, fonts: 0, media: 0, other: 0 };
  for (const href of unique) {
    const p = new URL(href).pathname.toLowerCase();
    if (/\.(png|jpe?g|webp|gif|svg|avif|ico)$/.test(p)) byType.images++;
    else if (/\.js(?:$|\?)/.test(href)) byType.scripts++;
    else if (/\.css(?:$|\?)/.test(href)) byType.stylesheets++;
    else if (/\.(woff2?|ttf|otf)$/.test(p)) byType.fonts++;
    else if (/\.(mp4|webm|mp3|wav|ogg|m4a)$/.test(p)) byType.media++;
    else byType.other++;
  }
  return {
    total_unique: unique.length,
    by_type: byType,
    hosts: uniq(unique.map(v => { try { return new URL(v).hostname; } catch { return ''; } }), 24),
    sample_urls: unique.slice(0, 32)
  };
}

function analyzeCore(html, finalUrl, bytes, contentType) {
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

  const colors = topValues(html, /#([0-9a-f]{3,8})\b/gi, value => `#${value.toUpperCase()}`, 16);
  const rgbColors = topValues(html, /\b((?:rgb|rgba|hsl|hsla)\([^)]*\))/gi, value => cleanText(value, 80), 10);
  const fontFamilies = topValues(html, /font-family\s*:\s*([^;}"']+)/gi, value => cleanText(value, 120).replace(/\s*!important$/i, ''), 12);
  const radii = topValues(html, /border-radius\s*:\s*([^;}]+)/gi, value => cleanText(value, 60).replace(/\s*!important$/i, ''), 10);
  const spacing = topValues(html, /(?:margin|padding|gap)(?:-[a-z]+)?\s*:\s*([^;}]+)/gi, value => cleanText(value, 80).replace(/\s*!important$/i, ''), 12);
  const assets = collectAssets(html, finalUrl);

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
      asset_hosts: assets.hosts,
      generated_at: new Date().toISOString()
    },
    design_tokens: {
      schema: '4n1f-design-tokens-observed-v1',
      source: 'static-source-observation',
      target: finalUrl,
      observed: {
        colors: [...colors, ...rgbColors].slice(0, 18),
        font_families: fontFamilies,
        spacing,
        radii,
        box_shadows: countMatches(html, /box-shadow\s*:/gi),
        gradients: countMatches(html, /(?:linear|radial|conic)-gradient\s*\(/gi),
        css_variables: countMatches(html, /--[a-z0-9-_]+\s*:/gi),
        media_queries: countMatches(html, /@media\b/gi)
      },
      note: 'Observed values are extracted from fetched public HTML/CSS text and are not computed-style guarantees.'
    },
    assets
  };
}

function analyzeDeep(html, finalUrl, core) {
  const semanticTags = ['header','nav','main','section','article','aside','footer','form','dialog','details'];
  const semantic = {};
  for (const tag of semanticTags) semantic[tag] = countMatches(html, new RegExp(`<${tag}(?:\\s|>)`, 'gi'));

  const classes = topValues(html, /class=["']([^"']+)["']/gi, value => cleanText(value, 160), 24);
  const mediaQueries = uniq([...html.matchAll(/@media\s*([^\{]+)/gi)].map(m => cleanText(m[1], 120)), 20);
  const responsive = {
    viewport_meta: /<meta[^>]+name=["']viewport["']/i.test(html),
    media_query_count: countMatches(html, /@media\b/gi),
    media_query_samples: mediaQueries,
    srcset_count: countMatches(html, /\bsrcset\s*=/gi),
    picture_count: countMatches(html, /<picture(?:\s|>)/gi),
    source_count: countMatches(html, /<source(?:\s|>)/gi)
  };

  const behavior = {
    inline_event_handlers: countMatches(html, /\son(?:click|input|change|submit|load|mouseover|mouseenter|keydown|keyup)\s*=/gi),
    details_elements: countMatches(html, /<details(?:\s|>)/gi),
    dialog_elements: countMatches(html, /<dialog(?:\s|>)/gi),
    aria_controls: countMatches(html, /aria-controls\s*=/gi),
    data_attributes: countMatches(html, /\sdata-[a-z0-9_-]+\s*=/gi),
    transition_mentions: countMatches(html, /\btransition(?:-property|-duration|-timing-function)?\s*:/gi),
    animation_mentions: countMatches(html, /\banimation(?:-name|-duration|-timing-function)?\s*:/gi),
    keyframes: countMatches(html, /@keyframes\b/gi)
  };

  const components = {
    semantic_counts: semantic,
    custom_elements: uniq([...html.matchAll(/<([a-z][a-z0-9]*-[a-z0-9-]+)(?:\s|>)/gi)].map(m => m[1].toLowerCase()), 24),
    repeated_class_signatures: classes
  };

  return {
    schema: '4n1f-genome-deep-observation-v1',
    source: 'static-source-observation',
    target: finalUrl,
    components,
    responsive,
    assets: core.assets,
    behavior,
    limitations: [
      'Deep Phase 2 is read-only static-source analysis.',
      'Runtime DOM, computed styles, authenticated states, browser-only behavior, and visual rendering are not claimed.'
    ]
  };
}

async function loadSource(rawTarget) {
  const req = new Request('https://genome.local/api/fetch-source', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ url: rawTarget })
  });
  const workerModule = await import('./worker.js');
  const response = await workerModule.default.fetch(req, { ASSETS: { fetch: () => new Response('') } });
  const fetched = await response.json().catch(() => null);
  if (!response.ok || !fetched?.ok) {
    const error = new Error(fetched?.error || `Fetch Engine gagal (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return fetched;
}

function normalizeTarget(target) {
  const cleaned = cleanText(target, 2048).replace(/^https?:\/\/https?:\/\//i, 'https://');
  if (!cleaned) throw new Error('Target URL wajib diisi.');
  const parsed = new URL(/^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Hanya URL http/https yang didukung.');
  return parsed.href;
}

async function runGenome(request, mode) {
  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed.' }, 405);
  const body = await request.json().catch(() => null);
  if (body?.authorized !== true) return json({ success: false, message: 'Konfirmasi public/authorized target diperlukan.' }, 400);

  let target;
  try { target = normalizeTarget(body?.url); }
  catch (error) { return json({ success: false, message: error.message || 'Target URL tidak valid.' }, 400); }

  const started = Date.now();
  try {
    const fetchStarted = Date.now();
    const fetched = await loadSource(target);
    const html = String(fetched.html || '');
    if (!html || html.length > MAX_HTML + 1024) return json({ success: false, stage: 'fetch', message: 'Source tidak tersedia atau melewati batas Genome.' }, 422);
    const fetchMs = Date.now() - fetchStarted;

    const analysisStarted = Date.now();
    const core = analyzeCore(html, fetched.url || target, Number(fetched.bytes || 0), fetched.contentType || 'unknown');
    const deep = mode === 'deep' ? analyzeDeep(html, fetched.url || target, core) : null;
    const analysisMs = Date.now() - analysisStarted;

    if (mode === 'deep') {
      core.site_genome.mode = 'deep';
      core.site_genome.schema = '4n1f-site-genome-deep-v1';
      return json({
        success: true,
        schema: '4n1f-genome-deep-response-v1',
        engine: 'Genome Engine Phase 2',
        pipeline: ['Fetch Engine','Source X-Ray','Design DNA','Components','Responsive DNA','Asset Intelligence','Behavior Map'],
        read_only: true,
        persisted: false,
        timings_ms: { fetch: fetchMs, analyze: analysisMs, total: Date.now() - started },
        site_genome: core.site_genome,
        design_tokens: core.design_tokens,
        deep
      });
    }

    return json({
      success: true,
      schema: '4n1f-genome-quick-response-v1',
      engine: 'Genome Engine Phase 1',
      pipeline: ['Fetch Engine', 'Source X-Ray', 'Design DNA'],
      read_only: true,
      persisted: false,
      timings_ms: { fetch: fetchMs, analyze: analysisMs, total: Date.now() - started },
      site_genome: core.site_genome,
      design_tokens: core.design_tokens
    });
  } catch (error) {
    return json({ success: false, stage: 'fetch', message: error?.message || 'Genome adapter gagal.' }, error?.status >= 400 ? error.status : 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/genome-quick') return runGenome(request, 'quick');
    if (url.pathname === '/api/genome-deep') return runGenome(request, 'deep');
    if (url.pathname.startsWith('/api/')) {
      return json({
        success: false,
        staging: true,
        message: 'Genome staging exposes only read-only Genome adapters. Production KV/Preview/Editor APIs remain disconnected.'
      }, 423);
    }
    return env.ASSETS.fetch(request);
  }
};
