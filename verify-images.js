// Download images per-page using fresh incognito contexts to avoid cache issues
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://bpbv.nuft.edu.ua';
const IMG_DIR = path.join(__dirname, 'images');

const PAGES = [
  { name: 'faculty', url: BASE_URL + '/%D0%BF%D1%80%D0%BE-%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D1%83/%D0%B2%D0%B8%D0%BA%D0%BB%D0%B0%D0%B4%D0%B0%D1%86%D1%8C%D0%BA%D0%B8%D0%B9-%D1%81%D0%BA%D0%BB%D0%B0%D0%B4-%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D0%B8', label: 'Викладацький склад' },
  { name: 'alumni', url: BASE_URL + '/%D0%BF%D1%80%D0%BE-%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D1%83/%D0%B2%D0%B8%D0%BF%D1%83%D1%81%D0%BD%D0%B8%D0%BA%D0%B8-%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D0%B8', label: 'Випускники' },
  { name: 'international', url: BASE_URL + '/%D0%B4%D1%96%D1%8F%D0%BB%D1%8C%D0%BD%D1%96%D1%81%D1%82%D1%8C-%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D0%B8/%D0%BC%D1%96%D0%B6%D0%BD%D0%B0%D1%80%D0%BE%D0%B4%D0%BD%D0%B0-%D0%B4%D1%96%D1%8F%D0%BB%D1%8C%D0%BD%D1%8F%D1%81%D1%82%D1%8C', label: 'Міжнародна діяльність' },
  { name: 'science', url: BASE_URL + '/%D0%B4%D1%96%D1%8F%D0%BB%D1%8C%D0%BD%D1%96%D1%81%D1%82%D1%8C-%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D0%B8/%D0%BD%D0%B0%D1%83%D0%BA%D0%BE%D0%B2%D0%B0-%D1%80%D0%BE%D0%B1%D0%BE%D1%82%D0%B0', label: 'Наукова робота' },
  { name: 'wine-club', url: BASE_URL + '/%D0%B7%D0%B4%D0%BE%D0%B1%D1%83%D0%B2%D0%B0%D1%87%D1%83/%D0%BD%D0%B0%D1%83%D0%BA%D0%BE%D0%B2%D1%96-%D0%B3%D1%83%D1%80%D1%82%D0%BA%D0%B8', label: 'Наукові гуртки / Енологічний гурток' },
  { name: 'phd', url: BASE_URL + '/%D0%B0%D1%81%D0%BF%D1%96%D1%80%D0%B0%D0%BD%D1%82%D1%83/%D0%BF%D1%80%D0%BE-%D0%B0%D1%81%D0%BF%D1%96%D1%80%D0%B0%D0%BD%D1%82%D1%96%D0%B2', label: 'Про аспірантів' },
  { name: 'home', url: BASE_URL, label: 'Головна сторінка' },
];

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });

  // First, clean up old per-section images (but keep numbered ones as backup)
  const oldSectionFiles = fs.readdirSync(IMG_DIR).filter(f => 
    /^(faculty|alumni|international|science|wine-club|phd|about-general|history|achievements)-\d+\.(jpg|png|webp)$/i.test(f)
  );
  oldSectionFiles.forEach(f => fs.unlinkSync(path.join(IMG_DIR, f)));
  console.log(`Cleaned ${oldSectionFiles.length} old section files\n`);

  const allMappings = {};

  for (const pageInfo of PAGES) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`${pageInfo.label} (${pageInfo.name})`);
    console.log(`${'='.repeat(50)}`);

    // Use incognito context to avoid caching between pages
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Disable cache
    await page.setCacheEnabled(false);

    // Track ALL response URLs and their buffers in order
    const responseMap = new Map();
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('lh3.googleusercontent.com') && !url.includes('.css') && !url.includes('.js')) {
        try {
          const ct = response.headers()['content-type'] || '';
          if (ct.startsWith('image/')) {
            const buffer = await response.buffer();
            if (buffer.length > 500) {
              responseMap.set(url, { buffer, contentType: ct });
            }
          }
        } catch (e) {}
      }
    });

    await page.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Scroll to trigger lazy loading
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let totalHeight = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 300);
          totalHeight += 300;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    await new Promise(r => setTimeout(r, 3000));

    // Get ordered list of image src from DOM
    const domImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => img.src.includes('googleusercontent.com/sitesv/'))
        .map(img => img.src);
    });

    console.log(`DOM images: ${domImages.length}, Response URLs: ${responseMap.size}`);

    // Save images in DOM order, skipping the first 2 which are usually the site header
    const pageMapping = [];
    let idx = 0;
    
    // Skip header images (usually first 1-2)
    const contentImages = domImages.filter((url, i) => {
      // The header image is usually ~2034x2048 and appears first
      // We'll keep all images and let the user see them
      return true;
    });

    // Deduplicate while preserving order
    const seen = new Set();
    const uniqueImages = contentImages.filter(url => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });

    // Skip first image which is always the site logo/header
    const contentOnly = uniqueImages.slice(1); // Skip logo

    for (const url of contentOnly) {
      idx++;
      const data = responseMap.get(url);
      if (!data) {
        console.log(`  ⚠️ [${idx}] Not captured (cached): ${url.substring(0, 60)}...`);
        continue;
      }

      let ext = '.jpg';
      if (data.contentType.includes('png')) ext = '.png';
      else if (data.contentType.includes('webp')) ext = '.webp';

      const filename = `${pageInfo.name}-${String(idx).padStart(2, '0')}${ext}`;
      fs.writeFileSync(path.join(IMG_DIR, filename), data.buffer);

      const sizeKB = Math.round(data.buffer.length / 1024);
      console.log(`  ✅ [${idx}] ${filename} (${sizeKB}KB)`);
      pageMapping.push({ index: idx, file: `images/${filename}`, url });
    }

    allMappings[pageInfo.name] = pageMapping;
    await context.close();
  }

  // Save mapping
  fs.writeFileSync(path.join(__dirname, 'section-mapping.json'), JSON.stringify(allMappings, null, 2));
  console.log('\n\nMapping saved to section-mapping.json');
  
  // Print summary
  console.log('\n=== SUMMARY ===');
  for (const [name, mapping] of Object.entries(allMappings)) {
    console.log(`${name}: ${mapping.length} images`);
    mapping.forEach(m => console.log(`  ${m.file}`));
  }

  await browser.close();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
