#!/usr/bin/env node
/**
 * JustFreeAI — Quick Add Tool CLI
 * ================================
 * Run: node admin/add-tool.js
 * Interactively adds a new tool to tools.json and rebuilds the site.
 *
 * Usage example:
 *   node admin/add-tool.js
 *   > Tool name: Perplexity AI
 *   > URL: https://perplexity.ai
 *   ... etc.
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const TOOLS_FILE = path.join(__dirname, '..', 'tools', 'tools.json');

const CATEGORIES = [
  'AI Assistant', 'Coding', 'Image Generation', 'Video',
  'Audio & Music', 'Research', 'AI Search', 'Presentations',
  'Productivity', 'Writing'
];

const BADGES = [
  '100% Free', 'Truly Free', 'Generous Free', 'Free to Start'
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const q = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  console.log('\n🟢 JustFreeAI — Add New Tool\n');

  const name        = await q('Tool name: ');
  const url         = await q('Tool URL: ');
  const tagline     = await q('Tagline (one-liner, max 70 chars): ');
  const description = await q('Description (2-3 sentences): ');

  console.log('\nCategories:\n' + CATEGORIES.map((c,i) => `  ${i+1}. ${c}`).join('\n'));
  const catIdx  = parseInt(await q('Category number: ')) - 1;
  const category = CATEGORIES[catIdx] || 'Productivity';

  const tagsRaw = await q('Tags (comma-separated, e.g. chatbot,writing,coding): ');
  const tags    = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  const free_tier = await q('Free tier details (what exactly is free): ');

  console.log('\nFree Tier Badges:\n' + BADGES.map((b,i) => `  ${i+1}. ${b}`).join('\n'));
  const badgeIdx  = parseInt(await q('Badge number: ')) - 1;
  const free_tier_badge = BADGES[badgeIdx] || 'Free to Start';

  const ratingRaw = await q('Rating (1.0 - 5.0, e.g. 4.5): ');
  const rating = parseFloat(ratingRaw) || 4.0;

  const reviewsRaw = await q('Approx review count (e.g. 5000): ');
  const reviews = parseInt(reviewsRaw) || 0;

  const featuredRaw = await q('Featured? (y/n): ');
  const featured = featuredRaw.toLowerCase() === 'y';

  const logoRaw = await q('Logo URL (or press Enter to use favicon): ');
  const logo = logoRaw.trim() || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;

  const id = slugify(name);
  const newTool = {
    id,
    name,
    tagline,
    description,
    url,
    category,
    tags,
    free_tier,
    free_tier_badge,
    rating,
    reviews,
    featured,
    sponsored: false,
    logo,
    added: new Date().toISOString().split('T')[0],
    approved: true
  };

  console.log('\n─────────────────────────────────');
  console.log('Preview:');
  console.log(JSON.stringify(newTool, null, 2));
  console.log('─────────────────────────────────\n');

  const confirm = await q('Add this tool? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.\n');
    rl.close();
    return;
  }

  // Add to tools.json
  const tools = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));
  if (tools.find(t => t.id === id)) {
    console.log(`⚠ A tool with id "${id}" already exists. Aborting.`);
    rl.close();
    return;
  }
  tools.push(newTool);
  fs.writeFileSync(TOOLS_FILE, JSON.stringify(tools, null, 2));
  console.log(`\n✓ Added "${name}" to tools.json`);

  // Rebuild
  console.log('→ Rebuilding site...');
  const { execSync } = require('child_process');
  execSync('node admin/build.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log(`\n✅ Done! "${name}" is now live at /tool/${id}.html\n`);
  rl.close();
}

main().catch(e => { console.error(e); rl.close(); });
