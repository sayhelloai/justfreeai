#!/usr/bin/env python3
"""
JustFreeAI — AI Discovery Agent
================================
Runs weekly (via GitHub Actions) to:
1. Search for trending new AI tools on Product Hunt, HackerNews, Reddit
2. Filter for: genuinely free tier, quality, not already in database
3. Use Claude AI to evaluate and summarize each candidate
4. Send you a digest email with one-click Approve/Reject per tool
5. When you click Approve → tool is added to tools.json automatically

SETUP INSTRUCTIONS:
-------------------
1. Set these as GitHub Actions Secrets (Settings → Secrets → Actions):
   - ANTHROPIC_API_KEY   : Your Claude API key (for tool evaluation)
   - EMAIL_TO            : Your email address (where digests are sent)
   - EMAIL_FROM          : Sending email (use a Gmail with App Password)
   - EMAIL_PASSWORD      : Gmail App Password
   - GITHUB_TOKEN        : Auto-provided by GitHub Actions (no setup needed)
   - APPROVAL_SECRET     : Any random string, e.g. openssl rand -hex 16

2. Schedule: runs every Monday at 9am UTC (set in .github/workflows/agent.yml)
"""

import json
import os
import re
import smtplib
import time
import urllib.request
import urllib.error
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# ─── CONFIG ────────────────────────────────────────────────────
ANTHROPIC_API_KEY  = os.environ.get("ANTHROPIC_API_KEY", "")
EMAIL_TO           = os.environ.get("EMAIL_TO", "")
EMAIL_FROM         = os.environ.get("EMAIL_FROM", "")
EMAIL_PASSWORD     = os.environ.get("EMAIL_PASSWORD", "")
APPROVAL_SECRET    = os.environ.get("APPROVAL_SECRET", "changeme")
SITE_URL           = os.environ.get("SITE_URL", "https://justfreeai.com")
TOOLS_FILE         = Path(__file__).parent.parent / "tools" / "tools.json"
MAX_CANDIDATES     = 8   # Max tools to evaluate per run


# ─── LOAD EXISTING TOOLS ───────────────────────────────────────
def load_existing_tools():
    with open(TOOLS_FILE) as f:
        tools = json.load(f)
    return {t["name"].lower() for t in tools} | {t.get("url","").lower() for t in tools}


# ─── SEARCH SOURCES ────────────────────────────────────────────
def fetch_url(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {
        "User-Agent": "JustFreeAI-Bot/1.0 (https://justfreeai.com)"
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read().decode("utf-8")
    except Exception as e:
        print(f"  ⚠ Fetch error {url}: {e}")
        return ""


def search_producthunt():
    """Fetch top AI products from Product Hunt API (no auth needed for basic)"""
    print("→ Searching Product Hunt...")
    candidates = []
    # Product Hunt GraphQL - top posts tagged 'artificial-intelligence' this week
    query = """
    {
      posts(topic: "artificial-intelligence", order: VOTES, first: 20) {
        edges { node {
          name tagline description website votesCount
          topics { edges { node { name } } }
        } }
      }
    }
    """
    try:
        data = json.dumps({"query": query}).encode()
        req = urllib.request.Request(
            "https://api.producthunt.com/v2/api/graphql",
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "JustFreeAI-Bot/1.0",
                # For authenticated access, add: "Authorization": "Bearer YOUR_PH_TOKEN"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            resp = json.loads(r.read())
        posts = resp.get("data", {}).get("posts", {}).get("edges", [])
        for edge in posts:
            p = edge["node"]
            candidates.append({
                "name": p.get("name",""),
                "tagline": p.get("tagline",""),
                "url": p.get("website",""),
                "source": "Product Hunt",
                "votes": p.get("votesCount", 0),
                "description": p.get("description","")
            })
    except Exception as e:
        print(f"  Product Hunt API error: {e}")
    return candidates


def search_hackernews():
    """Fetch AI launches from HackerNews Show HN"""
    print("→ Searching Hacker News...")
    candidates = []
    try:
        url = "https://hn.algolia.com/api/v1/search?query=Show+HN+AI+free&tags=story&hitsPerPage=20&numericFilters=created_at_i>{}".format(
            int(time.time()) - 7 * 86400  # last 7 days
        )
        data = json.loads(fetch_url(url))
        for hit in data.get("hits", []):
            title = hit.get("title","")
            if any(kw in title.lower() for kw in ["ai", "llm", "gpt", "ml", "artificial"]):
                candidates.append({
                    "name": title.replace("Show HN: ", "").strip(),
                    "tagline": "",
                    "url": hit.get("url",""),
                    "source": "Hacker News",
                    "votes": hit.get("points", 0),
                    "description": title
                })
    except Exception as e:
        print(f"  HN error: {e}")
    return candidates


def search_reddit():
    """Fetch trending AI tools from r/artificial and r/ChatGPT"""
    print("→ Searching Reddit...")
    candidates = []
    for sub in ["artificial", "ChatGPT", "AItools"]:
        try:
            url = f"https://www.reddit.com/r/{sub}/top.json?t=week&limit=20"
            data = json.loads(fetch_url(url, {"User-Agent": "JustFreeAI-Bot/1.0"}))
            for post in data.get("data", {}).get("children", []):
                p = post["data"]
                title = p.get("title","")
                if any(kw in title.lower() for kw in ["free", "ai ", "tool", "app"]):
                    candidates.append({
                        "name": title[:80],
                        "tagline": "",
                        "url": p.get("url",""),
                        "source": f"Reddit r/{sub}",
                        "votes": p.get("score", 0),
                        "description": title
                    })
        except Exception as e:
            print(f"  Reddit r/{sub} error: {e}")
    return candidates


# ─── CLAUDE EVALUATION ─────────────────────────────────────────
def evaluate_with_claude(candidates, existing):
    """Use Claude to evaluate each candidate for free tier, quality, relevance"""
    print(f"\n→ Evaluating {len(candidates)} candidates with Claude...")
    if not ANTHROPIC_API_KEY:
        print("  ⚠ No ANTHROPIC_API_KEY set. Skipping AI evaluation.")
        return candidates[:MAX_CANDIDATES]

    results = []
    for c in candidates[:MAX_CANDIDATES * 2]:
        if not c.get("url") or not c["url"].startswith("http"):
            continue
        if any(ex in c["name"].lower() or ex in c["url"].lower() for ex in existing):
            print(f"  Skip (already listed): {c['name']}")
            continue

        prompt = f"""You are an AI tool curator for JustFreeAI.com, a directory that ONLY lists AI tools with genuine, meaningful free tiers.

Evaluate this tool:
Name: {c['name']}
URL: {c['url']}
Description: {c.get('description','') or c.get('tagline','')}
Source: {c['source']} ({c['votes']} votes/upvotes)

Respond ONLY with a JSON object (no markdown, no explanation):
{{
  "should_list": true/false,
  "confidence": 0-100,
  "has_free_tier": true/false,
  "free_tier_description": "Describe the free tier concisely",
  "category": "one of: AI Assistant | Coding | Image Generation | Video | Audio & Music | Research | AI Search | Presentations | Productivity | Writing",
  "quality_score": 1-10,
  "why": "1-2 sentence reason for your decision",
  "suggested_tagline": "A catchy tagline for the tool (max 60 chars)",
  "tags": ["tag1","tag2","tag3"]
}}

Only set should_list=true if: the tool has a REAL free tier (not just a trial), solves a genuine user problem, has signs of quality, and is not spammy."""

        try:
            import urllib.request
            body = json.dumps({
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "messages": [{"role": "user", "content": prompt}]
            }).encode()
            req = urllib.request.Request(
                "https://api.anthropic.com/v1/messages",
                data=body,
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01"
                }
            )
            with urllib.request.urlopen(req, timeout=20) as r:
                resp = json.loads(r.read())
            text = resp["content"][0]["text"].strip()
            # Strip any markdown fences just in case
            text = re.sub(r"```json|```", "", text).strip()
            eval_data = json.loads(text)

            if eval_data.get("should_list") and eval_data.get("has_free_tier"):
                c.update(eval_data)
                results.append(c)
                print(f"  ✓ APPROVED for digest: {c['name']} (confidence: {eval_data.get('confidence')}%)")
                if len(results) >= MAX_CANDIDATES:
                    break
            else:
                print(f"  ✗ Rejected: {c['name']} — {eval_data.get('why','')}")

            time.sleep(0.5)  # Rate limit

        except Exception as e:
            print(f"  Claude error for {c['name']}: {e}")

    return results


# ─── EMAIL DIGEST ───────────────────────────────────────────────
def build_tool_card_html(tool, index):
    approve_url = f"{SITE_URL}/admin/approve.html?secret={APPROVAL_SECRET}&tool={urllib.parse.quote(json.dumps({'id': slugify(tool['name']), 'name': tool['name'], 'url': tool['url'], 'tagline': tool.get('suggested_tagline', tool.get('tagline','')), 'category': tool.get('category','Other'), 'tags': tool.get('tags',[]), 'free_tier': tool.get('free_tier_description',''), 'free_tier_badge': 'Generous Free', 'description': tool.get('description',''), 'rating': 0, 'reviews': 0, 'featured': False, 'sponsored': False, 'logo': '', 'added': datetime.now().strftime('%Y-%m-%d'), 'approved': True}))}"

    return f"""
    <div style="background:#1a231a; border:1px solid #2a3a2a; border-radius:16px; padding:24px; margin-bottom:20px; font-family:'Helvetica Neue',sans-serif;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
        <div>
          <h2 style="color:#f5f0e8; font-size:20px; margin:0 0 4px 0">{tool['name']}</h2>
          <p style="color:#8a9080; font-size:13px; margin:0">📍 {tool['source']} · {tool['votes']} votes</p>
        </div>
        <span style="background:rgba(200,241,53,0.1); border:1px solid rgba(200,241,53,0.2); border-radius:6px; padding:4px 12px; color:#c8f135; font-size:11px; font-weight:600; white-space:nowrap">{tool.get('category','Other')}</span>
      </div>
      <p style="color:#e8ead4; font-size:15px; line-height:1.6; margin:0 0 12px 0">{tool.get('suggested_tagline') or tool.get('tagline') or tool.get('description','')[:150]}</p>
      <div style="background:rgba(77,255,224,0.05); border:1px solid rgba(77,255,224,0.15); border-radius:8px; padding:12px 16px; margin-bottom:16px">
        <p style="color:#4dffe0; font-size:12px; font-weight:600; margin:0 0 4px 0; text-transform:uppercase; letter-spacing:0.05em">🎁 Free Tier</p>
        <p style="color:#e8ead4; font-size:14px; margin:0">{tool.get('free_tier_description', 'Review needed')}</p>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap">
        {''.join(f'<span style="background:#141c14;border:1px solid #2a3a2a;border-radius:4px;padding:3px 8px;color:#5a6055;font-size:11px">{tag}</span>' for tag in tool.get('tags',[])[:5])}
      </div>
      <p style="color:#8a9080; font-size:13px; margin:0 0 16px 0"><strong style="color:#c8c2b5">Claude's take:</strong> {tool.get('why','')}</p>
      <div style="display:flex; gap:10px">
        <a href="{approve_url}" style="background:#c8f135; color:#0a0f0a; padding:12px 24px; border-radius:10px; font-weight:700; font-size:14px; text-decoration:none; display:inline-block">✅ Approve & Publish</a>
        <a href="{tool['url']}" target="_blank" style="background:#1a231a; color:#c8f135; padding:12px 24px; border-radius:10px; font-weight:600; font-size:14px; text-decoration:none; border:1px solid rgba(200,241,53,0.3); display:inline-block">🔗 Visit Tool</a>
      </div>
    </div>"""


def send_digest_email(tools):
    """Send weekly digest email with approve/reject buttons"""
    if not tools:
        print("→ No tools to send in digest.")
        return

    print(f"\n→ Sending digest email with {len(tools)} candidates...")

    date_str = datetime.now().strftime("%B %d, %Y")
    cards_html = "\n".join(build_tool_card_html(t, i) for i, t in enumerate(tools))

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="background:#0a0f0a; color:#e8ead4; font-family:'Helvetica Neue',Arial,sans-serif; margin:0; padding:20px">
  <div style="max-width:680px; margin:0 auto">

    <div style="text-align:center; padding:40px 0 32px">
      <div style="display:inline-flex; align-items:center; gap:10px; margin-bottom:16px">
        <div style="width:36px;height:36px;background:#c8f135;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#0a0f0a">J</div>
        <span style="font-size:22px; font-weight:800; color:#f5f0e8">JustFree<span style="color:#c8f135">AI</span></span>
      </div>
      <h1 style="color:#f5f0e8; font-size:28px; margin:0 0 8px 0">Weekly Tool Discovery</h1>
      <p style="color:#8a9080; font-size:15px; margin:0">{date_str} · {len(tools)} new candidates found</p>
    </div>

    <div style="background:#1a231a; border:1px solid rgba(200,241,53,0.2); border-radius:12px; padding:16px 20px; margin-bottom:28px; font-size:14px; color:#8a9080">
      ✦ These tools were discovered from Product Hunt, Hacker News, and Reddit this week, and pre-screened by Claude for free tier quality. <strong style="color:#c8c2b5">Click "Approve & Publish" on any tool you want to add to JustFreeAI.</strong>
    </div>

    {cards_html}

    <div style="text-align:center; padding:32px 0; color:#5a6055; font-size:13px; border-top:1px solid #2a3a2a; margin-top:20px">
      <a href="{SITE_URL}" style="color:#c8f135">JustFreeAI.com</a> · Weekly AI Tool Digest<br>
      Tools not approved this week will be re-evaluated next week if they gain more traction.
    </div>
  </div>
</body>
</html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🤖 {len(tools)} new free AI tools to review — JustFreeAI Weekly"
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(EMAIL_FROM, EMAIL_PASSWORD)
            s.send_message(msg)
        print(f"  ✓ Digest sent to {EMAIL_TO}")
    except Exception as e:
        print(f"  ✗ Email error: {e}")
        # Fallback: dump to console for debugging
        print("\n──── EMAIL WOULD CONTAIN ────")
        for t in tools:
            print(f"  • {t['name']} — {t['url']}")


# ─── HELPERS ───────────────────────────────────────────────────
def slugify(s):
    return re.sub(r"[^a-z0-9-]", "", s.lower().replace(" ", "-"))


# Avoid import issue in environments without urllib.parse
import urllib.parse


# ─── MAIN ──────────────────────────────────────────────────────
def main():
    print("\n══════════════════════════════════════")
    print("  JustFreeAI Discovery Agent")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
    print("══════════════════════════════════════\n")

    existing = load_existing_tools()
    print(f"→ Loaded {len(existing)} existing tools from database\n")

    # Gather candidates from all sources
    candidates = []
    candidates += search_producthunt()
    candidates += search_hackernews()
    candidates += search_reddit()

    # Deduplicate by URL
    seen_urls = set()
    unique = []
    for c in candidates:
        url = c.get("url","").lower()
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique.append(c)

    print(f"\n→ {len(unique)} unique candidates found across all sources")

    # Sort by votes/engagement
    unique.sort(key=lambda x: x.get("votes", 0), reverse=True)

    # AI evaluation
    evaluated = evaluate_with_claude(unique, existing)

    # Send digest
    send_digest_email(evaluated)

    print(f"\n✓ Agent run complete. {len(evaluated)} tools sent for your review.")


if __name__ == "__main__":
    main()
