#!/usr/bin/env node
/**
 * JustFreeAI — Static Site Generator
 * ====================================
 * Run this script to generate:
 *   1. Individual static HTML pages for each tool (/tool/tool-id.html)
 *   2. An updated sitemap.xml with all tool pages
 *
 * This is CRITICAL for SEO — Google indexes individual pages better than
 * JavaScript-rendered single-page apps.
 *
 * Usage:
 *   node admin/build.js
 *
 * Or add it to your package.json:
 *   "scripts": { "build": "node admin/build.js" }
 *
 * On Netlify, set Build Command to: node admin/build.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const TOOLS_FILE = path.join(ROOT, 'tools', 'tools.json');
const TOOL_DIR   = path.join(ROOT, 'tool');
const SITE_URL   = 'https://justfreeai.com';

// ─── LOAD TOOLS ─────────────────────────────────────────────────
const tools = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'))
  .filter(t => t.approved);

console.log(`\n🔨 JustFreeAI Build Script`);
console.log(`   Building ${tools.length} tool pages...\n`);

// Create /tool directory
if (!fs.existsSync(TOOL_DIR)) fs.mkdirSync(TOOL_DIR, { recursive: true });

// ─── HELPERS ─────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function freeBadgeColor(badge) {
  if (badge === '100% Free' || badge === 'Truly Free') return '#4dffe0';
  if (badge === 'Generous Free') return '#c8f135';
  return '#ffb347';
}

function stars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? '½' : '';
  return '★'.repeat(full) + half + '☆'.repeat(5 - full - (half ? 1 : 0));
}

function formatNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;
}

function relatedTools(tool, allTools, max = 4) {
  return allTools
    .filter(t => t.id !== tool.id && (
      t.category === tool.category ||
      t.tags.some(tag => tool.tags.includes(tag))
    ))
    .slice(0, max);
}

// ─── GENERATE TOOL PAGE ──────────────────────────────────────────
function generateToolPage(tool, allTools) {
  const related = relatedTools(tool, allTools);
  const badgeColor = freeBadgeColor(tool.free_tier_badge);
  const logoImg = tool.logo
    ? `<img src="${escapeHtml(tool.logo)}" alt="${escapeHtml(tool.name)} logo" width="80" height="80" style="width:100%;height:100%;object-fit:contain;padding:12px" onerror="this.style.display='none';this.parentElement.textContent='${escapeHtml(tool.name[0])}'">` 
    : escapeHtml(tool.name[0]);

  const relatedHTML = related.map(r => `
    <a href="/tool/${escapeHtml(r.id)}.html" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #2a3a2a;text-decoration:none">
      <div style="width:36px;height:36px;border-radius:9px;background:#141c14;border:1px solid #2a3a2a;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;color:#c8f135;font-size:15px">
        ${r.logo ? `<img src="${escapeHtml(r.logo)}" alt="" width="36" height="36" style="width:100%;height:100%;object-fit:contain;padding:5px" onerror="this.style.display='none'">` : escapeHtml(r.name[0])}
      </div>
      <div>
        <div style="font-size:14px;font-weight:600;color:#f5f0e8">${escapeHtml(r.name)}</div>
        <div style="font-size:12px;color:#5a6055">${escapeHtml(r.category)}</div>
      </div>
    </a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(tool.name)} — Free AI Tool | JustFreeAI</title>
  <meta name="description" content="${escapeHtml(tool.tagline)}. ${escapeHtml(tool.free_tier)}. Reviewed on JustFreeAI — the free AI tools directory.">
  <meta name="keywords" content="${escapeHtml(tool.name)} free, ${escapeHtml(tool.name)} free tier, ${escapeHtml(tool.tags.join(', '))} free AI">
  <link rel="canonical" href="${SITE_URL}/tool/${escapeHtml(tool.id)}.html">

  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE_URL}/tool/${escapeHtml(tool.id)}.html">
  <meta property="og:title" content="${escapeHtml(tool.name)} — Free AI Tool">
  <meta property="og:description" content="${escapeHtml(tool.tagline)}. ${escapeHtml(tool.free_tier)}">
  ${tool.logo ? `<meta property="og:image" content="${escapeHtml(tool.logo)}">` : ''}
  <meta property="og:site_name" content="JustFreeAI">

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(tool.name)} — Free AI Tool">
  <meta name="twitter:description" content="${escapeHtml(tool.tagline)}">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "${escapeHtml(tool.name)}",
    "description": "${escapeHtml(tool.description)}",
    "url": "${escapeHtml(tool.url)}",
    "applicationCategory": "AIApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "${escapeHtml(tool.free_tier)}"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "${tool.rating}",
      "reviewCount": "${tool.reviews}"
    },
    "isAccessibleForFree": true
  }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23c8f135'/><text y='24' x='6' font-size='20' font-family='serif' font-weight='900' fill='%230a0f0a'>J</text></svg>">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>

  <nav class="nav">
    <div class="container nav-inner">
      <a href="/" class="logo">
        <div class="logo-mark">J</div>
        <span class="logo-text">Just<span>Free</span>AI</span>
      </a>
      <div class="nav-search">
        <span class="nav-search-icon">⌕</span>
        <input type="text" placeholder="Search free AI tools..." id="nav-search-input" aria-label="Search">
      </div>
      <div class="nav-links">
        <a href="/submit.html" class="nav-link">Submit a Tool</a>
        <a href="mailto:sponsor@justfreeai.com" class="btn-submit">Sponsor</a>
      </div>
    </div>
  </nav>

  <main>
    <div class="container" style="padding:48px 24px 80px; max-width:1100px">

      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" style="margin-bottom:28px; font-size:13px; color:#5a6055">
        <a href="/" style="color:#8a9080; text-decoration:none">JustFreeAI</a>
        <span style="margin:0 8px">›</span>
        <a href="/?cat=${escapeHtml(tool.category)}" style="color:#8a9080; text-decoration:none">${escapeHtml(tool.category)}</a>
        <span style="margin:0 8px">›</span>
        <span style="color:#c8c2b5">${escapeHtml(tool.name)}</span>
      </nav>

      <div style="display:grid; grid-template-columns:1fr 280px; gap:40px; align-items:start">

        <!-- Main content -->
        <article>
          <header style="display:flex;gap:24px;align-items:flex-start;margin-bottom:32px">
            <div style="width:80px;height:80px;border-radius:20px;background:#1a231a;border:1px solid #344834;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:32px;color:#c8f135">
              ${logoImg}
            </div>
            <div>
              <h1 style="font-family:'Playfair Display',serif;font-size:clamp(28px,5vw,42px);font-weight:800;color:#032D60;margin-bottom:8px;letter-spacing:-0.02em">${escapeHtml(tool.name)}</h1>
              <p style="font-size:17px;color:#8a9080;margin-bottom:16px">${escapeHtml(tool.tagline)}</p>
              <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                <span style="background:rgba(200,241,53,0.08);border:1px solid rgba(200,241,53,0.2);border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;color:${badgeColor}">✦ ${escapeHtml(tool.free_tier_badge)}</span>
                <span style="font-size:13px;color:#5a6055">${escapeHtml(tool.category)}</span>
                <span style="color:#ffd700;font-size:13px">${stars(tool.rating)}</span>
                <span style="font-size:13px;color:#f5f0e8;font-weight:600">${tool.rating}</span>
                <span style="font-size:12px;color:#5a6055">(${formatNum(tool.reviews)} reviews)</span>
              </div>
            </div>
          </header>

          <!-- CTA -->
          <div style="margin-bottom:36px">
            <a href="${escapeHtml(tool.url)}" target="_blank" rel="noopener sponsored" 
               class="tool-cta" style="font-size:16px;padding:14px 32px;border-radius:100px;display:inline-flex;align-items:center;gap:8px;text-decoration:none">
              Try ${escapeHtml(tool.name)} Free →
            </a>
            <p style="margin-top:10px;font-size:12px;color:#5a6055">No credit card required · Opens in new tab</p>
          </div>

          <!-- Free Tier Box -->
          <div style="background:#EBF5EE;border:1px solid #B3DEC0;border-radius:14px;padding:24px 28px;margin-bottom:32px">
            <h2 style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#2E844A;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">🎁 What's Free</h2>
            <p style="font-size:16px;color:#e8ead4;line-height:1.6">${escapeHtml(tool.free_tier)}</p>
          </div>

          <!-- Description -->
          <section>
            <h2 style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#f5f0e8;margin-bottom:14px">About ${escapeHtml(tool.name)}</h2>
            <p style="font-size:16px;color:#8a9080;line-height:1.8;margin-bottom:24px">${escapeHtml(tool.description)}</p>
          </section>

          <!-- Tags -->
          <section style="margin-bottom:32px">
            <h2 style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:#c8c2b5;margin-bottom:12px">Tags</h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${tool.tags.map(tag => `<a href="/?search=${encodeURIComponent(tag)}" style="font-size:13px;color:#8a9080;background:#141c14;border:1px solid #2a3a2a;border-radius:6px;padding:5px 12px;text-decoration:none">${escapeHtml(tag)}</a>`).join('')}
            </div>
          </section>

          <!-- Ad slot -->
          <div style="background:#1a231a;border:1px dashed #2a3a2a;border-radius:12px;padding:16px;text-align:center;margin:32px 0;color:#5a6055;font-size:12px">
            <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Advertisement</div>
            <div style="min-height:90px;display:flex;align-items:center;justify-content:center">
              <!-- Ad slot: 728x90 leaderboard — replace with your ad network code -->
              Your Ad Here · <a href="mailto:sponsor@justfreeai.com" style="color:#c8f135;margin-left:4px">Advertise here</a>
            </div>
          </div>

          <!-- Back link -->
          <a href="/" style="display:inline-flex;align-items:center;gap:6px;color:#c8f135;font-size:14px;text-decoration:none;margin-top:8px">
            ← Browse all free AI tools
          </a>
        </article>

        <!-- Sidebar -->
        <aside style="position:sticky;top:88px">
          <!-- Ad -->
          <div style="background:#1a231a;border:1px dashed #2a3a2a;border-radius:14px;min-height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#5a6055;font-size:12px;margin-bottom:20px">
            <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase">Advertisement</div>
            <span>300×250 Ad Slot</span>
            <a href="mailto:sponsor@justfreeai.com" style="color:#c8f135;font-size:11px">Advertise here</a>
          </div>

          <!-- Related tools -->
          ${related.length > 0 ? `
          <div style="background:#1a231a;border:1px solid #2a3a2a;border-radius:14px;padding:20px">
            <h3 style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#f5f0e8;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #2a3a2a">Similar Free Tools</h3>
            ${relatedHTML}
          </div>` : ''}
        </aside>
      </div>
    </div>
  </main>

  <footer class="footer">
    <div class="container"><div class="footer-bottom">
      <a href="/" class="logo">
        <div class="logo-mark">J</div>
        <span class="logo-text">Just<span>Free</span>AI</span>
      </a>
      <div class="footer-links">
        <a href="/about.html" class="footer-link">About</a>
        <a href="/submit.html" class="footer-link">Submit Tool</a>
        <a href="mailto:hello@justfreeai.com" class="footer-link">Contact</a>
        <a href="/privacy.html" class="footer-link">Privacy</a>
      </div>
      <div class="footer-copy">© 2025 <span>JustFreeAI</span></div>
    </div>
  </footer>

  <script>
    // Nav search redirect
    document.getElementById('nav-search-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        window.location.href = '/?search=' + encodeURIComponent(this.value.trim());
      }
    });
  </script>
</body>
</html>`;
}

// ─── GENERATE SITEMAP ────────────────────────────────────────────
function generateSitemap(tools) {
  const today = new Date().toISOString().split('T')[0];
  const toolUrls = tools.map(t => `
  <url>
    <loc>${SITE_URL}/tool/${t.id}.html</loc>
    <lastmod>${t.added || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${SITE_URL}/about.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>${SITE_URL}/submit.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
${toolUrls}
</urlset>`;
}

// ─── GENERATE LLMS.TXT ───────────────────────────────────────────
function generateLlmsTxt(tools) {
  const toolList = tools.map(t =>
    `- [${t.name}](${SITE_URL}/tool/${t.id}.html): ${t.tagline}. Free tier: ${t.free_tier}`
  ).join('\n');

  return `# JustFreeAI — AI Tool Directory

> The internet's most curated directory of free AI tools, all with genuine free tiers. Every tool listed has a genuine free tier — no trials, no credit cards required. Updated weekly.

## What is JustFreeAI?

JustFreeAI (${SITE_URL}) is a hand-curated directory of ${tools.length}+ AI tools that are genuinely free to use. Every tool has a real, meaningful free tier verified by our team.

## All Listed Tools

${toolList}

## Categories

${[...new Set(tools.map(t => t.category))].map(cat => {
  const catTools = tools.filter(t => t.category === cat);
  return `### ${cat}\n${catTools.map(t => `- ${t.name}: ${t.tagline}`).join('\n')}`;
}).join('\n\n')}

## Contact

- General: hello@justfreeai.com
- Sponsorship: sponsor@justfreeai.com
- Submit a tool: ${SITE_URL}/submit.html

## Data

Full tool database (JSON): ${SITE_URL}/tools/tools.json
`;
}

// ─── RUN BUILD ───────────────────────────────────────────────────
let built = 0;
for (const tool of tools) {
  const html = generateToolPage(tool, tools);
  const outPath = path.join(TOOL_DIR, `${tool.id}.html`);
  fs.writeFileSync(outPath, html);
  built++;
  process.stdout.write(`   ✓ /tool/${tool.id}.html\n`);
}

// Write sitemap
const sitemap = generateSitemap(tools);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
console.log(`\n   ✓ sitemap.xml (${tools.length + 3} URLs)`);

// Write llms.txt
const llmsTxt = generateLlmsTxt(tools);
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llmsTxt);
console.log(`   ✓ llms.txt (${tools.length} tools listed for AI crawlers)`);

console.log(`\n✅ Build complete! ${built} tool pages generated.\n`);
