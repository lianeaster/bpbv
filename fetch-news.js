#!/usr/bin/env node
/**
 * fetch-news.js — fetches latest posts from a Facebook group via Graph API
 * and writes them to news.json for the static site.
 *
 * Usage:
 *   node fetch-news.js              # uses .env for credentials
 *   node fetch-news.js --dry-run    # preview without writing files
 *
 * Requires: .env with FB_ACCESS_TOKEN and FB_GROUP_ID
 * See FACEBOOK_SETUP.md for setup instructions.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = __dirname;
const NEWS_JSON = path.join(ROOT, 'news.json');
const IMAGES_DIR = path.join(ROOT, 'images', 'news');
const MAX_POSTS = 4;
const DRY_RUN = process.argv.includes('--dry-run');
const GRAPH_VERSION = 'v21.0';

function loadEnv() {
  if (process.env.FB_ACCESS_TOKEN) return;

  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found and FB_ACCESS_TOKEN is not set.');
    console.error('Copy .env.example to .env and fill in your credentials.');
    console.error('See FACEBOOK_SETUP.md for instructions.');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (val && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'BPBV-News-Fetcher/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.toString('utf8').slice(0, 300)}`));
        } else {
          resolve({ body, contentType: res.headers['content-type'] || '' });
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchGroupPosts(token, groupId) {
  const fields = 'message,created_time,full_picture,permalink_url,from';
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${groupId}/feed?fields=${fields}&limit=${MAX_POSTS}&access_token=${token}`;

  console.log(`Fetching last ${MAX_POSTS} posts from group ${groupId}...`);
  const { body } = await httpGet(url);
  const data = JSON.parse(body.toString('utf8'));

  if (data.error) {
    console.error('Facebook API error:', data.error.message);
    if (data.error.code === 190) {
      console.error('Your access token has expired. Generate a new one — see FACEBOOK_SETUP.md');
    }
    process.exit(1);
  }

  if (!data.data || data.data.length === 0) {
    console.warn('No posts found in the group feed.');
    return [];
  }

  console.log(`Received ${data.data.length} posts.`);
  return data.data;
}

async function downloadImage(imageUrl, filename) {
  try {
    const { body, contentType } = await httpGet(imageUrl);
    if (!contentType.startsWith('image/')) {
      console.warn(`  Skipped image (not an image: ${contentType})`);
      return null;
    }
    const ext = contentType.includes('png') ? '.png' : '.jpg';
    const finalName = filename + ext;
    const filePath = path.join(IMAGES_DIR, finalName);
    fs.writeFileSync(filePath, body);
    console.log(`  Saved ${finalName} (${(body.length / 1024).toFixed(0)} KB)`);
    return `images/news/${finalName}`;
  } catch (err) {
    console.warn(`  Failed to download image: ${err.message}`);
    return null;
  }
}

function formatDate(isoDate) {
  const d = new Date(isoDate);
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function extractTitle(message) {
  if (!message) return 'Новина кафедри';
  const firstLine = message.split('\n')[0].trim();
  if (firstLine.length <= 120) return firstLine;
  return firstLine.slice(0, 117) + '...';
}

function truncateMessage(message, maxLen = 400) {
  if (!message) return '';
  const clean = message.replace(/\n{3,}/g, '\n\n').trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

async function main() {
  loadEnv();

  const token = process.env.FB_ACCESS_TOKEN;
  const groupId = process.env.FB_GROUP_ID || '918669628322290';

  if (!token) {
    console.error('Error: FB_ACCESS_TOKEN is not set in .env');
    process.exit(1);
  }

  const posts = await fetchGroupPosts(token, groupId);
  if (posts.length === 0) return;

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const newsItems = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`\nProcessing post ${i + 1}/${posts.length}:`);
    console.log(`  Date: ${post.created_time}`);
    console.log(`  Text: ${(post.message || '').slice(0, 80)}...`);

    let imagePath = null;
    if (post.full_picture && !DRY_RUN) {
      imagePath = await downloadImage(post.full_picture, `fb-post-${i + 1}`);
    } else if (post.full_picture) {
      imagePath = `images/news/fb-post-${i + 1}.jpg`;
      console.log(`  [dry-run] Would download image`);
    }

    const item = {
      title: extractTitle(post.message),
      date: formatDate(post.created_time),
      message: truncateMessage(post.message),
      url: post.permalink_url || `https://www.facebook.com/groups/${groupId}/`,
      image: imagePath,
    };

    newsItems.push(item);
  }

  if (DRY_RUN) {
    console.log('\n[dry-run] Would write to news.json:');
    console.log(JSON.stringify(newsItems, null, 2));
    return;
  }

  fs.writeFileSync(NEWS_JSON, JSON.stringify(newsItems, null, 2) + '\n');
  console.log(`\nUpdated ${NEWS_JSON} with ${newsItems.length} posts.`);
  console.log('Done! Run `git add news.json images/news/ && git commit` to publish.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
