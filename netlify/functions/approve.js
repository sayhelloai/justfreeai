/**
 * Netlify Function: approve.js
 * ============================
 * Handles tool approval from the weekly digest email.
 * Called by /admin/approve.html when you click "Approve & Publish".
 *
 * What it does:
 * 1. Validates the approval secret
 * 2. Reads current tools.json from GitHub
 * 3. Appends the new approved tool
 * 4. Commits the update back to GitHub
 * 5. Netlify auto-rebuilds the site (takes ~30 seconds)
 *
 * Setup in Netlify Dashboard → Site Settings → Environment Variables:
 *   APPROVAL_SECRET   → Same random string you set in GitHub Actions
 *   GITHUB_TOKEN      → GitHub Personal Access Token (repo write scope)
 *   GITHUB_OWNER      → Your GitHub username
 *   GITHUB_REPO       → Your repo name, e.g. "justfreeai"
 */

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { secret, tool } = JSON.parse(event.body);

    // ── 1. Verify secret ──────────────────────────────────────
    if (secret !== process.env.APPROVAL_SECRET) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid approval secret' }) };
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = process.env.GITHUB_OWNER;
    const REPO = process.env.GITHUB_REPO || 'justfreeai';
    const FILE_PATH = 'tools/tools.json';

    if (!GITHUB_TOKEN || !OWNER) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing GITHUB_TOKEN or GITHUB_OWNER env vars' }) };
    }

    const ghHeaders = {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'JustFreeAI-Approval-Bot'
    };

    // ── 2. Get current tools.json from GitHub ────────────────
    const getRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      { headers: ghHeaders }
    );

    if (!getRes.ok) {
      const err = await getRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: `GitHub GET error: ${err}` }) };
    }

    const fileData = await getRes.json();
    const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));

    // ── 3. Check for duplicates ───────────────────────────────
    const isDuplicate = currentContent.some(
      t => t.id === tool.id || t.url?.toLowerCase() === tool.url?.toLowerCase()
    );

    if (isDuplicate) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Tool already in database' })
      };
    }

    // ── 4. Append new tool ────────────────────────────────────
    const newTool = {
      ...tool,
      id: tool.id || tool.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      approved: true,
      added: new Date().toISOString().split('T')[0]
    };

    currentContent.push(newTool);

    // ── 5. Commit back to GitHub ──────────────────────────────
    const newContent = Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64');

    const putRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          message: `✦ Add approved tool: ${tool.name}`,
          content: newContent,
          sha: fileData.sha
        })
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: `GitHub PUT error: ${err}` }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: `${tool.name} added to JustFreeAI!` })
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }
};
