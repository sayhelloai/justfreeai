/* JustFreeAI — main.js */

const CATEGORIES = [
  { label: 'All Tools', icon: '✦', value: 'all' },
  { label: 'AI Assistant', icon: '🤖', value: 'AI Assistant' },
  { label: 'Coding', icon: '💻', value: 'Coding' },
  { label: 'Image Generation', icon: '🎨', value: 'Image Generation' },
  { label: 'Video', icon: '🎬', value: 'Video' },
  { label: 'Audio & Music', icon: '🎵', value: 'Audio & Music' },
  { label: 'Research', icon: '🔬', value: 'Research' },
  { label: 'AI Search', icon: '🔍', value: 'AI Search' },
  { label: 'Presentations', icon: '📊', value: 'Presentations' },
  { label: 'Productivity', icon: '⚡', value: 'Productivity' },
  { label: 'Writing', icon: '✍️', value: 'Writing' },
];

let allTools = [];
let filteredTools = [];
let activeCategory = 'all';
let searchQuery = '';

// ─── FETCH TOOLS ───────────────────────────────────────────────
async function loadTools() {
  try {
    const res = await fetch('tools/tools.json');
    allTools = await res.json();
    allTools = allTools.filter(t => t.approved);
    render();
  } catch (e) {
    console.error('Could not load tools:', e);
  }
}

// ─── FILTER ────────────────────────────────────────────────────
function applyFilters() {
  filteredTools = allTools.filter(tool => {
    const matchCat = activeCategory === 'all' || tool.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || [tool.name, tool.tagline, tool.description, ...tool.tags]
      .some(s => s && s.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });
}

// ─── STAR RATING ───────────────────────────────────────────────
function stars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n;
}

function freeBadgeClass(badge) {
  if (badge === '100% Free' || badge === 'Truly Free') return 'teal';
  if (badge === 'Generous Free') return 'lime';
  return 'amber';
}

// ─── TOOL CARD HTML ────────────────────────────────────────────
function toolCardHTML(tool, size = 'normal') {
  const badgeClass = freeBadgeClass(tool.free_tier_badge);
  const logoContent = tool.logo
    ? `<img src="${tool.logo}" alt="${tool.name} logo" loading="lazy" onerror="this.parentElement.textContent='${tool.name[0]}'">`
    : tool.name[0];

  return `
    <div class="tool-card${tool.sponsored ? ' sponsored' : ''}" onclick="window.location.href='/tool/'+tool.id+'.html'">
      ${tool.sponsored ? '<span class="sponsored-tag">Sponsored</span>' : ''}
      <div class="tool-card-head">
        <div class="tool-logo">${logoContent}</div>
        <div class="tool-meta">
          <div class="tool-name">${tool.name}</div>
          <div class="tool-tagline">${tool.tagline}</div>
        </div>
      </div>
      <div class="tool-desc">${tool.description}</div>
      <div class="tool-free-badge ${badgeClass}">
        ✦ ${tool.free_tier_badge} &nbsp;·&nbsp; ${tool.free_tier}
      </div>
      <div class="tool-footer">
        <div class="tool-rating">
          <span class="stars">${stars(tool.rating)}</span>
          <span class="rating-num">${tool.rating}</span>
          <span class="rating-count">(${formatNum(tool.reviews)})</span>
        </div>
        <a href="${tool.url}" target="_blank" rel="noopener" class="tool-cta" onclick="event.stopPropagation()">
          Try Free →
        </a>
      </div>
    </div>`;
}

// ─── OPEN TOOL DETAIL ──────────────────────────────────────────
function openTool(id) {
  const tool = allTools.find(t => t.id === id);
  if (!tool) return;

  // Update URL
  history.pushState({ toolId: id }, '', `?tool=${id}`);
  document.title = `${tool.name} — JustFreeAI`;

  const logoContent = tool.logo
    ? `<img src="${tool.logo}" alt="${tool.name}" onerror="this.parentElement.textContent='${tool.name[0]}'">`
    : tool.name[0];

  document.getElementById('main-content').innerHTML = `
    <div class="tool-detail container">
      <a href="/" onclick="event.preventDefault(); goHome()" style="display:inline-flex; align-items:center; gap:6px; color:var(--lime); font-size:14px; margin-bottom:32px;">
        ← Back to all tools
      </a>
      <div class="tool-detail-head">
        <div class="tool-detail-logo">${logoContent}</div>
        <div class="tool-detail-info">
          <h1>${tool.name}</h1>
          <p>${tool.tagline}</p>
          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <div class="tool-free-badge ${freeBadgeClass(tool.free_tier_badge)}" style="margin:0">✦ ${tool.free_tier_badge}</div>
            <span style="color:var(--text-faint); font-size:13px;">Category: <strong style="color:var(--text-dim)">${tool.category}</strong></span>
          </div>
        </div>
      </div>
      <div class="tool-detail-body">
        <h2>About</h2>
        <p>${tool.description}</p>
        <div class="free-tier-box">
          <h3>🎁 Free Tier Details</h3>
          <p>${tool.free_tier}</p>
        </div>
        <div style="margin-top:24px;">
          <h2>Tags</h2>
          <div class="tool-tags" style="margin-top:10px; gap:8px;">
            ${tool.tags.map(t => `<span class="tool-tag">${t}</span>`).join('')}
          </div>
        </div>
        <div style="margin-top:32px; display:flex; gap:12px;">
          <a href="${tool.url}" target="_blank" rel="noopener sponsored" class="tool-cta" style="font-size:16px; padding:14px 32px;">
            Try ${tool.name} Free →
          </a>
        </div>
        <div class="ad-banner" style="margin-top:48px;">
          <div class="ad-banner-label">Advertisement</div>
          <div class="ad-slot-placeholder">
            <!-- Ad slot: 728x90 leaderboard — replace with your ad network code -->
            Your Ad Here
          </div>
        </div>
      </div>
    </div>
  `;

  document.querySelector('.nav-search input') && scrollToTop();
  updateMeta(tool.name, `${tool.tagline} — Free AI tool. ${tool.free_tier}`, tool.logo);
}

function goHome() {
  history.pushState({}, '', '/');
  document.title = 'JustFreeAI — The Best Free AI Tools';
  updateMeta('JustFreeAI', 'Curated free AI tools — no spam, no fluff. 100+ tools curated weekly.', '');
  render();
}

window.addEventListener('popstate', (e) => {
  const params = new URLSearchParams(window.location.search);
  const toolId = params.get('tool');
  if (toolId) openTool(toolId);
  else goHome();
});

// ─── MAIN RENDER ───────────────────────────────────────────────
function render() {
  applyFilters();

  const featured = allTools.filter(t => t.featured);
  const sponsored = allTools.filter(t => t.sponsored);
  const showSearch = searchQuery.length > 0 || activeCategory !== 'all';

  let html = '';

  // Hero
  if (!showSearch) {
    html += `
    <div class="hero">
      <div class="hero-bg"></div>
      <div class="container" style="position:relative">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          Curated free AI tools — no spam, no fluff
        </div>
        <h1>The <em>best</em> free AI tools,<br>all in one place.</h1>
        <p class="hero-sub">Every AI tool you'll ever need, with a genuine free tier. Curated, quality-checked, zero spam.</p>
        <div class="hero-search">
          <input type="text" id="hero-search-input" placeholder="Search 100+ free AI tools..." value="${searchQuery}">
          <button onclick="doHeroSearch()">Search</button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-num">${allTools.length}+</div>
            <div class="hero-stat-label">Curated Tools</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-num">100%</div>
            <div class="hero-stat-label">Free Tiers</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-num">0</div>
            <div class="hero-stat-label">Spam / Low Quality</div>
          </div>
        </div>
      </div>
    </div>`;

    // After hero, bind hero search
    setTimeout(() => {
      const hi = document.getElementById('hero-search-input');
      if (hi) {
        hi.addEventListener('keydown', e => { if (e.key === 'Enter') doHeroSearch(); });
        hi.focus();
      }
    }, 0);
  }

  html += `<div class="container">`;

  // Categories
  html += `<div class="categories-section${showSearch ? ' mt-24' : ''}">
    <div class="cat-scroll">
      ${CATEGORIES.map(c => `
        <div class="cat-pill${activeCategory === c.value ? ' active' : ''}" onclick="setCategory('${c.value}')">
          <span class="cat-pill-icon">${c.icon}</span> ${c.label}
        </div>
      `).join('')}
    </div>
  </div>`;

  // Search results mode
  if (showSearch) {
    const count = filteredTools.length;
    html += `
      <div class="search-results-header">
        <h2>${count} tool${count !== 1 ? 's' : ''} found</h2>
        <p>${searchQuery ? `Results for "${searchQuery}"` : `Category: ${activeCategory}`}</p>
      </div>`;

    if (count === 0) {
      html += `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>No tools found</h3>
          <p>Try a different search term or browse all categories.</p>
        </div>`;
    } else {
      html += `<div class="tools-grid">` + filteredTools.map(t => toolCardHTML(t)).join('') + `</div>`;
    }

  } else {
    // Normal homepage

    // Top ad
    html += `
    <div class="ad-banner">
      <div class="ad-banner-label">Advertisement</div>
      <div class="ad-slot-placeholder">
        <!-- Ad slot: 728x90 leaderboard — paste your Google AdSense / Carbon Ads code here -->
        Your Ad Here · <a href="mailto:sponsor@justfreeai.com" style="color:var(--lime)">Sponsor this spot</a>
      </div>
    </div>`;

    // Featured tools
    html += `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">✦ <span>Editor's Picks</span></h2>
        <a href="javascript:void(0)" class="section-link" onclick="setCategory('all')">View all →</a>
      </div>
      <div class="featured-grid">
        ${featured.map(t => toolCardHTML(t, 'featured')).join('')}
      </div>
    </div>`;

    // Content + sidebar layout
    html += `<div class="content-with-sidebar">`;
    html += `<div>`;

    // All tools
    html += `
      <div class="section-header">
        <h2 class="section-title">All <span>Free AI Tools</span></h2>
        <span class="text-dim" style="font-size:13px">${allTools.length} tools</span>
      </div>
      <div class="tools-grid">
        ${allTools.map(t => toolCardHTML(t)).join('')}
      </div>`;

    html += `</div>`; // end main

    // Sidebar
    html += `
      <aside class="sidebar">
        <div class="sidebar-card">
          <div class="sidebar-title">📬 Weekly Free AI Digest</div>
          <p style="font-size:13px; color:var(--text-dim); margin-bottom:16px;">Get the top new free AI tools every week. No spam, unsubscribe anytime.</p>
          <input type="email" id="sidebar-email" class="form-input" placeholder="your@email.com" style="margin-bottom:10px">
          <button class="btn-submit" style="width:100%; height:40px; border-radius:8px" onclick="subscribeNewsletter()">Subscribe Free</button>
        </div>
        <div class="sidebar-card" style="padding:0; overflow:hidden;">
          <div class="sidebar-ad">
            <div class="sidebar-ad-label">Advertisement</div>
            <span>300×250 Ad Slot</span>
            <a href="mailto:sponsor@justfreeai.com" style="color:var(--lime); font-size:12px">Advertise here</a>
          </div>
        </div>
        <div class="sidebar-card">
          <div class="sidebar-title">🔥 Most Popular</div>
          ${allTools.sort((a,b) => b.reviews - a.reviews).slice(0,5).map(t => `
            <div onclick="window.location.href='/tool/${t.id}.html'" style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border); cursor:pointer; transition: opacity 0.2s" onmouseenter="this.style.opacity='.7'" onmouseleave="this.style.opacity='1'">
              <div class="tool-logo" style="width:32px;height:32px;border-radius:8px;font-size:14px">${t.logo ? `<img src="${t.logo}" alt="" style="width:100%;height:100%;object-fit:contain;padding:4px">` : t.name[0]}</div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--cream)">${t.name}</div>
                <div style="font-size:11px;color:var(--text-faint)">${formatNum(t.reviews)} reviews</div>
              </div>
            </div>
          `).join('')}
        </div>
      </aside>`;

    html += `</div>`; // end content-with-sidebar
  }

  // Newsletter
  if (!showSearch) {
    html += `
    <div class="newsletter">
      <h2>Never miss a free AI tool</h2>
      <p>We research and curate new free AI tools weekly. Get the best ones delivered to your inbox.</p>
      <div class="newsletter-form">
        <input type="email" id="nl-email" placeholder="Enter your email address">
        <button onclick="subscribeNewsletter('nl-email')">Subscribe</button>
      </div>
    </div>`;
  }

  html += `</div>`; // end container

  document.getElementById('main-content').innerHTML = html;
}

// ─── INTERACTIONS ──────────────────────────────────────────────
function doHeroSearch() {
  const val = document.getElementById('hero-search-input')?.value || '';
  searchQuery = val.trim();
  render();
}

function setCategory(cat) {
  activeCategory = cat;
  searchQuery = '';
  // Update nav search too
  const ni = document.querySelector('.nav-search input');
  if (ni) ni.value = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function subscribeNewsletter(inputId = 'sidebar-email') {
  const el = document.getElementById(inputId);
  if (!el) return;
  const email = el.value.trim();
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }
  // Replace with your newsletter service (Mailchimp, ConvertKit, etc.)
  alert(`✅ You're subscribed! We'll send free AI tool updates to ${email}`);
  el.value = '';
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── NAV SEARCH ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const navInput = document.querySelector('.nav-search input');
  if (navInput) {
    navInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      if (searchQuery.length === 0 || searchQuery.length > 1) render();
    });
    navInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') render();
    });
  }

  // Support URL params: ?search=query and ?cat=category (from static tool pages)
  const params = new URLSearchParams(window.location.search);
  const urlSearch = params.get('search') || params.get('q') || '';
  const urlCat    = params.get('cat') || 'all';

  if (urlSearch) {
    searchQuery = urlSearch;
    if (navInput) navInput.value = urlSearch;
  }
  if (urlCat && urlCat !== 'all') {
    activeCategory = urlCat;
  }

  loadTools();
});

// ─── SEO META UPDATE ───────────────────────────────────────────
function updateMeta(title, desc, image) {
  document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title + ' — JustFreeAI');
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
  if (image) document.querySelector('meta[property="og:image"]')?.setAttribute('content', image);
}
