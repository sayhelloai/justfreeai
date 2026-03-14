# 🟢 JustFreeAI — An AI for Everything
## Complete Setup Guide

Welcome! This guide will get your website **live in under 30 minutes** with zero coding.
Follow each step exactly and you'll have a running, SEO-optimized AI tool directory.

---

## What you're deploying

| Thing | What it does |
|---|---|
| **Website** | Fast, beautiful, SEO-ready directory at justfreeai.com |
| **Weekly Agent** | Automatically finds new free AI tools every Monday |
| **Email Digest** | Sends you a digest — you click Approve or ignore |
| **Auto-publish** | Approved tools go live in ~30 seconds |

---

## STEP 1 — Create a GitHub Account (if you don't have one)

1. Go to **https://github.com/signup**
2. Create a free account
3. Verify your email

---

## STEP 2 — Create a New GitHub Repository

1. Go to **https://github.com/new**
2. Repository name: `justfreeai`
3. Set to **Public** (required for free Netlify deploys)
4. Click **"Create repository"**

---

## STEP 3 — Upload this website to GitHub

### Option A: Easy drag-and-drop (no terminal needed)
1. Open your new repo on GitHub
2. Click **"uploading an existing file"** link
3. **Drag ALL the files from this folder** into the GitHub upload area
   - Make sure to include: `index.html`, `css/`, `js/`, `tools/`, `about.html`, `submit.html`, `privacy.html`, `netlify.toml`, `sitemap.xml`, `robots.txt`, `llms.txt`, `.github/`, `agent/`, `admin/`, `netlify/`
4. Scroll down, click **"Commit changes"**

### Option B: Using Git (faster for future updates)
```bash
cd justfreeai
git init
git remote add origin https://github.com/YOUR_USERNAME/justfreeai.git
git add .
git commit -m "🚀 Initial JustFreeAI launch"
git push -u origin main
```

---

## STEP 4 — Deploy to Netlify (free hosting)

1. Go to **https://netlify.com** and sign up with your GitHub account
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** → Select your `justfreeai` repo
4. Build settings: leave everything blank (it's a static site)
5. Click **"Deploy site"**

✅ Your site will be live at a URL like `random-name-123.netlify.app` within 2 minutes!

---

## STEP 5 — Connect your custom domain (justfreeai.com)

1. In Netlify, go to **Site Settings → Domain management**
2. Click **"Add custom domain"** → type `justfreeai.com`
3. Follow Netlify's instructions to update your domain's DNS settings
   - Typically: add a CNAME record pointing `www` to your Netlify URL
   - And/or update nameservers to Netlify's nameservers
4. Netlify will auto-provision a free SSL certificate

---

## STEP 6 — Set up the Weekly Discovery Agent

This is what finds new AI tools for you automatically every week.

### 6a. Get an Anthropic API Key
1. Go to **https://console.anthropic.com**
2. Create account → **API Keys → Create Key**
3. Copy the key (starts with `sk-ant-...`)
4. Note: Claude evaluates ~15 tools/week, cost is typically <$0.05/week

### 6b. Set up Gmail App Password (for sending digest emails)
1. Go to your **Google Account → Security → 2-Step Verification** (must be ON)
2. Scroll down to **"App passwords"**
3. Create an app password for "Mail"
4. Copy the 16-character password

### 6c. Add GitHub Secrets
1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Click **"New repository secret"** for each of these:

| Secret Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Claude API key (sk-ant-...) |
| `EMAIL_TO` | Your personal email (where digests land) |
| `EMAIL_FROM` | Your Gmail address |
| `EMAIL_PASSWORD` | The 16-char Gmail App Password |
| `APPROVAL_SECRET` | Any random string, e.g. `mysecret123` |

### 6d. Add Netlify Environment Variables (for tool approval)
1. Go to Netlify → **Site Settings → Environment variables**
2. Add these:

| Variable | Value |
|---|---|
| `APPROVAL_SECRET` | Same random string as above |
| `GITHUB_TOKEN` | A GitHub Personal Access Token (see below) |
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | `justfreeai` |

**To get a GitHub Personal Access Token:**
1. GitHub → Settings → Developer settings → **Personal access tokens → Tokens (classic)**
2. Generate new token → Check **`repo`** scope → Generate
3. Copy the token

---

## STEP 7 — Run the agent for the first time

1. Go to your GitHub repo → **Actions** tab
2. Click **"Weekly AI Tool Discovery"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait ~2 minutes
5. Check your email — you should receive a digest with tool candidates!

---

## STEP 8 — Set up Google AdSense (to earn from ads)

1. Go to **https://adsense.google.com** and apply
2. Add your site `justfreeai.com`
3. Once approved, get your AdSense code snippet
4. Open `index.html` and replace the comment `<!-- Ad slot: 728x90 leaderboard -->` with your AdSense auto-ads tag
5. In `index.html`, uncomment and fill in the script tag near the bottom

---

## STEP 9 — Submit to Google Search Console

1. Go to **https://search.google.com/search-console**
2. Add your property `https://justfreeai.com`
3. Verify ownership (easiest: HTML file method — Netlify makes this easy)
4. Submit your sitemap: **Sitemaps → Add sitemap → `sitemap.xml`**

---

## How the weekly workflow works (after setup)

```
Every Monday 9am UTC:
  GitHub Actions runs agent/discover.py
       ↓
  Searches Product Hunt + HackerNews + Reddit
       ↓
  Claude AI evaluates each tool for free tier quality
       ↓
  Email digest arrives in your inbox (beautiful HTML)
       ↓
  You click "✅ Approve & Publish" on tools you like
       ↓
  Netlify Function updates tools.json on GitHub
       ↓
  Netlify auto-rebuilds site (~30 seconds)
       ↓
  New tool is live on justfreeai.com 🎉
```

---

## How to manually add a tool

Edit `tools/tools.json` directly on GitHub:
1. Open the file on GitHub
2. Click the ✏️ Edit icon
3. Add your tool following the existing format
4. Click "Commit changes"
5. Netlify rebuilds automatically

---

## How to add a sponsored listing

1. A tool pays you to be "Sponsored"
2. In `tools/tools.json`, add `"sponsored": true` to their entry
3. Their card will show a "Sponsored" badge and a subtle green border
4. You can also charge for "Featured" status by adding `"featured": true`

---

## Files explained

```
justfreeai/
├── index.html          ← Homepage (do not edit much — JS renders content)
├── about.html          ← About page (edit text here)
├── submit.html         ← Submit a tool form
├── privacy.html        ← Privacy policy
├── sitemap.xml         ← Auto-submitted to Google
├── robots.txt          ← Crawler permissions
├── llms.txt            ← AI/LLM search optimization
├── netlify.toml        ← Netlify config (caching, headers)
├── css/style.css       ← All styling
├── js/main.js          ← Site logic, search, rendering
├── tools/tools.json    ← ⭐ THE DATABASE (edit to add/remove tools)
├── agent/discover.py   ← Weekly discovery agent
├── admin/approve.html  ← Approval page (linked from emails)
├── netlify/functions/  ← Serverless functions
│   └── approve.js      ← Handles tool approval → GitHub update
└── .github/workflows/
    └── agent.yml       ← Weekly schedule for discovery agent
```

---

## Customization tips

### Change email address
Search for `hello@justfreeai.com` and `sponsor@justfreeai.com` in HTML files and replace.

### Add analytics (privacy-friendly, free)
Sign up at **https://plausible.io** (free 30-day trial, then $9/mo) or **https://umami.is** (self-hosted free).
Add their script tag to all HTML `<head>` sections.

### Change colors
Edit `css/style.css` — look for the `:root { }` block at the top.
The key colors are:
- `--lime: #c8f135` — the signature accent color
- `--bg: #0a0f0a` — background
- `--cream: #f5f0e8` — heading text

---

## Need help?

Email: hello@justfreeai.com

Or ask Claude at claude.ai — paste your error message and it'll help you debug!
