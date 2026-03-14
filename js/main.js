/* JustFreeAI — main.js  */

const CATEGORIES = [
  { label: 'All Tools',        icon: '◈',  value: 'all' },
  { label: 'AI Assistant',     icon: '🤖', value: 'AI Assistant' },
  { label: 'Coding',           icon: '💻', value: 'Coding' },
  { label: 'Image Generation', icon: '🎨', value: 'Image Generation' },
  { label: 'Video',            icon: '🎬', value: 'Video' },
  { label: 'Audio & Music',    icon: '🎵', value: 'Audio & Music' },
  { label: 'Research',         icon: '🔬', value: 'Research' },
  { label: 'AI Search',        icon: '🔍', value: 'AI Search' },
  { label: 'Presentations',    icon: '📊', value: 'Presentations' },
  { label: 'Productivity',     icon: '⚡', value: 'Productivity' },
  { label: 'Writing',          icon: '✍️', value: 'Writing' },
];

let allTools = [];
let filteredTools = [];
let activeCategory = 'all';
let searchQuery = '';

// ─── LOAD ────────────────────────────────────────────────────────
async function loadTools() {
  try {
    const res = await fetch('tools/tools.json');
    allTools = (await res.json()).filter(t => t.approved);
    render();
  } catch (e) {
    console.error('Could not load tools:', e);
  }
}

// ─── FILTER ──────────────────────────────────────────────────────
function applyFilters() {
  filteredTools = allTools.filter(tool => {
    const matchCat  = activeCategory === 'all' || tool.category === activeCategory;
    const q         = searchQuery.toLowerCase();
    const matchSearch = !q || [tool.name, tool.tagline, tool.description, ...tool.tags]
      .some(s => s && s.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────
function stars(r) {
  const f = Math.floor(r), h = r % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(f) + (h ? '½' : '') + '☆'.repeat(5 - f - h);
}

function fmtNum(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : n; }

function badgeClass(b) {
  if (b === '100% Free' || b === 'Truly Free') return 'teal';
  if (b === 'Generous Free') return 'lime';
  return 'amber';
}

function logoHTML(tool, size = 52) {
  return tool.logo
    ? `<img src="${tool.logo}" alt="${tool.name}" loading="lazy" style="width:100%;height:100%;object-fit:contain;padding:8px" onerror="this.style.display='none';this.parentElement.textContent='${tool.name[0]?.toUpperCase()}';">`
    : tool.name[0]?.toUpperCase();
}

// ─── TOOL CARD ────────────────────────────────────────────────────
function toolCardHTML(tool) {
  const bc = badgeClass(tool.free_tier_badge);
  return `
    <a href="/tool/${tool.id}.html" class="tool-card${tool.sponsored ? ' sponsored' : ''}" style="display:block;text-decoration:none;color:inherit">
      ${tool.sponsored ? '<span class="sponsored-tag">Sponsored</span>' : ''}
      <div class="tool-card-head">
        <div class="tool-logo">${logoHTML(tool)}</div>
        <div class="tool-meta">
          <div class="tool-name">${tool.name}</div>
          <div class="tool-tagline">${tool.tagline}</div>
        </div>
      </div>
      <div class="tool-desc">${tool.description}</div>
      <div class="tool-free-badge ${bc}">✔ ${tool.free_tier_badge} · ${tool.free_tier}</div>
      <div class="tool-footer">
        <div class="tool-rating">
          <span class="stars">${stars(tool.rating)}</span>
          <span class="rating-num">${tool.rating}</span>
          <span class="rating-count">(${fmtNum(tool.reviews)})</span>
        </div>
        <span onclick="event.preventDefault();event.stopPropagation();window.open('${tool.url}','_blank')" class="tool-cta">
          Try Free →
        </span>
      </div>
    </a>`;
}

// ─── HERO FLOATING CARDS ──────────────────────────────────────────
function heroFloatCards() {
  const picks = allTools.filter(t => t.featured).slice(0, 3);
  if (!picks.length) return '';
  const colors = ['#EEF4FF','#F0FDF4','#FFF7ED'];
  const icons  = ['🤖','🎨','🎵'];
  return picks.map((t, i) => `
    <div class="hero-float-card">
      <div class="hfc-head">
        <div class="hfc-icon" style="background:${colors[i]}">${icons[i]}</div>
        <div>
          <div class="hfc-name">${t.name}</div>
          <div class="hfc-cat">${t.category}</div>
        </div>
      </div>
      <span class="hfc-badge">✔ ${t.free_tier_badge}</span>
    </div>`).join('');
}

// ─── MAIN RENDER ──────────────────────────────────────────────────
function render() {
  applyFilters();
  const featured    = allTools.filter(t => t.featured);
  const showSearch  = searchQuery.length > 0 || activeCategory !== 'all';
  let html = '';

  // ── HERO ──
  if (!showSearch) {
    html += `
    <div class="hero">
      <div class="container">
        <div class="hero-inner">
          <div class="hero-content">
            <div class="hero-eyebrow">
              <span class="hero-eyebrow-dot"></span>
              Curated · Quality-checked · Zero spam
            </div>
            <h1>The best <em>free AI tools</em>,<br>all in one place.</h1>
            <p class="hero-sub">Every AI tool you need — with a genuine free tier. No credit cards, no trials, no paywalls. Just tools that work, for free.</p>
            <div class="hero-search">
              <input type="text" id="hero-search-input" placeholder="Search 100+ free AI tools..." value="${searchQuery}" autocomplete="off">
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
                <div class="hero-stat-label">Spam Listings</div>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-card-stack">
              ${heroFloatCards()}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trust bar -->
    <div class="trust-bar">
      <div class="container">
        <div class="trust-bar-inner">
          <div class="trust-item"><div class="trust-icon">✔</div> Hand-curated, no auto-listings</div>
          <div class="trust-item"><div class="trust-icon">🔍</div> Verified free tiers only</div>
          <div class="trust-item"><div class="trust-icon">⭐</div> Real user ratings</div>
          <div class="trust-item"><div class="trust-icon">🔄</div> Updated every week</div>
          <div class="trust-item"><div class="trust-icon">🚫</div> Zero pay-to-list bias</div>
        </div>
      </div>
    </div>`;

    setTimeout(() => {
      const hi = document.getElementById('hero-search-input');
      if (hi) hi.addEventListener('keydown', e => { if (e.key === 'Enter') doHeroSearch(); });
    }, 0);
  }

  // ── CATEGORIES ──
  html += `
    <div class="categories-section${showSearch ? ' mt-0' : ''}">
      <div class="container">
        <div class="cat-scroll">
          ${CATEGORIES.map(c => `
            <button class="cat-pill${activeCategory === c.value ? ' active' : ''}" onclick="setCategory('${c.value}')" type="button">
              <span class="cat-pill-icon">${c.icon}</span> ${c.label}
            </button>`).join('')}
        </div>
      </div>
    </div>`;

  html += `<div class="container">`;

  // ── SEARCH RESULTS ──
  if (showSearch) {
    const count = filteredTools.length;
    html += `
      <div class="search-results-header">
        <h2>${count} tool${count !== 1 ? 's' : ''} found</h2>
        <p>${searchQuery ? `Results for "<strong>${searchQuery}</strong>"` : `Browsing: ${activeCategory}`}</p>
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
    // ── TOP AD ──
    html += `
    <div class="ad-banner">
      <div class="ad-banner-label">Advertisement</div>
      <div class="ad-slot-placeholder">
        <!-- 728×90 leaderboard ad slot — paste your Google AdSense code here -->
        Your Ad Here &nbsp;·&nbsp; <a href="mailto:sponsor@justfreeai.com?subject=Sponsorship%20Enquiry%20%E2%80%94%20JustFreeAI&body=Hi%20JustFreeAI%20team%2C%0A%0AI%27m%20interested%20in%20sponsoring%20a%20listing%20on%20JustFreeAI.com.%0A%0ATool%20name%3A%20%0AWebsite%3A%20%0ABudget%3A%20%0A%0ALooking%20forward%20to%20hearing%20from%20you!" style="color:var(--blue);font-weight:600">Sponsor this spot</a>
      </div>
    </div>`;

    // ── EDITOR'S PICKS ──
    html += `
    <div class="section">
      <div class="section-header">
        <div>
          <div class="section-eyebrow">Hand-picked by our team</div>
          <div class="section-title">Editor's Picks</div>
        </div>
        <a href="javascript:void(0)" class="section-link" onclick="setCategory('all')">Browse all tools →</a>
      </div>
      <div class="featured-grid">
        ${featured.map(t => toolCardHTML(t)).join('')}
      </div>
    </div>`;

    // ── FEATURED BANNER ──
    html += `
    <div class="featured-banner">
      <div class="featured-banner-icon">📬</div>
      <div class="featured-banner-content">
        <h3>New free AI tools, every Monday</h3>
        <p>Our AI agent discovers trending tools weekly. You get a curated digest — no noise, just the best new tools with genuine free tiers.</p>
      </div>
      <a href="#newsletter" class="featured-banner-cta">Get the digest</a>
    </div>`;

    // ── ALL TOOLS + SIDEBAR ──
    html += `<div class="content-with-sidebar">`;
    html += `<div>
      <div class="section-header">
        <div>
          <div class="section-eyebrow">Full directory</div>
          <div class="section-title">All Free AI Tools</div>
        </div>
        <span class="text-muted" style="font-size:13px">${allTools.length} tools</span>
      </div>
      <div class="tools-grid">
        ${allTools.map(t => toolCardHTML(t)).join('')}
      </div>
    </div>`;

    // ── SIDEBAR ──
    html += `
      <aside class="sidebar">
        <div class="sidebar-card">
          <div class="sidebar-title">📬 Weekly Digest</div>
          <p style="font-size:13px;color:var(--grey-500);margin-bottom:14px;line-height:1.6">New free AI tools every Monday. No spam, unsubscribe anytime.</p>
          <input type="email" id="sidebar-email" class="form-input" placeholder="your@email.com" style="margin-bottom:10px;font-size:13px">
          <button class="form-submit" style="height:40px;font-size:13px;border-radius:100px" onclick="subscribeNewsletter()">Subscribe Free</button>
        </div>
        <div class="sidebar-card" style="padding:0;overflow:hidden">
          <div class="sidebar-ad">
            <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--grey-400);font-weight:600">Advertisement</div>
            <span style="font-size:13px;color:var(--grey-400)">300×250 Ad Slot</span>
            <a href="mailto:sponsor@justfreeai.com?subject=Sponsorship%20Enquiry%20%E2%80%94%20JustFreeAI&body=Hi%20JustFreeAI%20team%2C%0A%0AI%27m%20interested%20in%20sponsoring%20a%20listing%20on%20JustFreeAI.com.%0A%0ATool%20name%3A%20%0AWebsite%3A%20%0ABudget%3A%20%0A%0ALooking%20forward%20to%20hearing%20from%20you!" style="color:var(--blue);font-size:12px;font-weight:600">Advertise here</a>
          </div>
        </div>
        <div class="sidebar-card">
          <div class="sidebar-title">🔥 Most Popular</div>
          ${[...allTools].sort((a,b) => b.reviews - a.reviews).slice(0,5).map(t => `
            <a href="/tool/${t.id}.html" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--grey-100);text-decoration:none;transition:opacity 0.15s" onmouseenter="this.style.opacity='.7'" onmouseleave="this.style.opacity='1'">
              <div class="tool-logo" style="width:34px;height:34px;border-radius:8px;font-size:14px;flex-shrink:0">${t.logo ? `<img src="${t.logo}" alt="" style="width:100%;height:100%;object-fit:contain;padding:4px">` : t.name[0]}</div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--navy)">${t.name}</div>
                <div style="font-size:11px;color:var(--grey-400)">${fmtNum(t.reviews)} reviews</div>
              </div>
            </button>`).join('')}
        </div>
        <div class="sidebar-card" style="background:var(--blue-xlight);border-color:var(--blue-light)">
          <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px">Want to be featured?</div>
          <p style="font-size:13px;color:var(--grey-600);margin-bottom:14px;line-height:1.6">Sponsor a listing and reach thousands of AI enthusiasts every month.</p>
          <a href="mailto:sponsor@justfreeai.com?subject=Sponsorship%20Enquiry%20%E2%80%94%20JustFreeAI&body=Hi%20JustFreeAI%20team%2C%0A%0AI%27m%20interested%20in%20sponsoring%20a%20listing%20on%20JustFreeAI.com.%0A%0ATool%20name%3A%20%0AWebsite%3A%20%0ABudget%3A%20%0A%0ALooking%20forward%20to%20hearing%20from%20you!" class="tool-cta" style="font-size:13px;width:100%;justify-content:center">Get in touch →</a>
        </div>
      </aside>`;

    html += `</div>`; // end content-with-sidebar
  }

  // ── NEWSLETTER ──
  if (!showSearch) {
    html += `
    <div class="newsletter" id="newsletter">
      <div class="newsletter-eyebrow">Stay in the loop</div>
      <h2>Never miss a free AI tool</h2>
      <p>We discover and curate the best new free AI tools every week. Get them delivered straight to your inbox — no spam, ever.</p>
      <div class="newsletter-form">
        <input type="email" id="nl-email" placeholder="Enter your email address">
        <button onclick="subscribeNewsletter('nl-email')">Subscribe</button>
      </div>
    </div>`;
  }

  html += `</div>`; // end container

  document.getElementById('main-content').innerHTML = html;
}

// ─── INTERACTIONS ─────────────────────────────────────────────────
function doHeroSearch() {
  const val = document.getElementById('hero-search-input')?.value || '';
  searchQuery = val.trim();
  const ni = document.querySelector('.nav-search input');
  if (ni) ni.value = searchQuery;
  render();
}

function setCategory(cat) {
  activeCategory = cat;
  searchQuery = '';
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
    alert('Please enter a valid email address.'); return;
  }
  alert(`✅ You're subscribed! We'll send free AI tool updates to ${email}`);
  el.value = '';
}

function goHome() {
  history.pushState({}, '', '/');
  document.title = 'JustFreeAI — The Best Free AI Tools';
  searchQuery = '';
  activeCategory = 'all';
  render();
}

// ─── NAV SEARCH ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const navInput = document.querySelector('.nav-search input');
  if (navInput) {
    navInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      if (searchQuery.length === 0 || searchQuery.length > 1) render();
    });
    navInput.addEventListener('keydown', e => { if (e.key === 'Enter') render(); });
  }

  // Support ?search= and ?cat= URL params
  const params   = new URLSearchParams(window.location.search);
  const urlSearch = params.get('search') || params.get('q') || '';
  const urlCat    = params.get('cat') || 'all';
  if (urlSearch) { searchQuery = urlSearch; if (navInput) navInput.value = urlSearch; }
  if (urlCat && urlCat !== 'all') activeCategory = urlCat;

  loadTools();
});

// ─── META ─────────────────────────────────────────────────────────
function updateMeta(title, desc, image) {
  document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title + ' — JustFreeAI');
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
  if (image) document.querySelector('meta[property="og:image"]')?.setAttribute('content', image);
}
