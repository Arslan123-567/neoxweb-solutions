/* Read-only structural SEO audit for the static site. Run: node scripts/audit-site.js */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlFiles = [];
function walk(dir, relative = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.posix.join(relative, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') walk(path.join(dir, entry.name), rel);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(rel);
  }
}
walk(root);

const report = {
  pages: htmlFiles.length,
  missingTitle: [], missingDescription: [], missingCanonical: [], duplicateCanonical: [],
  duplicateTitles: [], duplicateDescriptions: [],
  missingViewport: [], missingH1: [], multipleH1: [], brokenInternalLinks: [],
  malformedJsonLd: [], images: { total: 0, missingAlt: [], missingDimensions: [], missingLoadingHint: [] },
  sitemap: { entries: 0, duplicateUrls: 0, urlsWithoutPage: [], unlinkedPages: [] }
};
const nonPageHtml = new Set(['404.html', 'navbar.html', 'unified-footer.html', 'profile.html']);
const incomingLinks = new Map();
const titlePages = new Map();
const descriptionPages = new Map();

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const head = (html.match(/<head\b[\s\S]*?<\/head>/i) || [''])[0];
  const isStandalonePage = !file.startsWith('content/') && !nonPageHtml.has(file);
  if (isStandalonePage) {
    const titleText = (head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim();
    const descriptionText = (head.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)/i) || [])[1]?.trim();
    if (!titleText) report.missingTitle.push(file);
    else titlePages.set(titleText, [...(titlePages.get(titleText) || []), file]);
    if (!descriptionText) report.missingDescription.push(file);
    else descriptionPages.set(descriptionText, [...(descriptionPages.get(descriptionText) || []), file]);
    const canonicalCount = (head.match(/<link\s+rel=["']canonical["']/gi) || []).length;
    if (!canonicalCount) report.missingCanonical.push(file);
    if (canonicalCount > 1) report.duplicateCanonical.push({ file, count: canonicalCount });
    if (!/<meta\s+name=["']viewport["']/i.test(head)) report.missingViewport.push(file);
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    if (!h1Count) report.missingH1.push(file);
    if (h1Count > 1) report.multipleH1.push({ file, count: h1Count });
  }

  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { report.malformedJsonLd.push({ file, error: error.message }); }
  }
  for (const match of html.matchAll(/<img\b([^>]*?)>/gis)) {
    report.images.total++;
    const attrs = match[1];
    if (!/\balt\s*=/.test(attrs)) report.images.missingAlt.push(file);
    if (!/\bwidth\s*=/.test(attrs) || !/\bheight\s*=/.test(attrs)) report.images.missingDimensions.push(file);
    if (!/\bloading\s*=/.test(attrs) && !/\bfetchpriority=["']high/i.test(attrs)) report.images.missingLoadingHint.push(file);
  }
  for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
    const href = match[1].trim();
    if (!href || /^(?:https?:|mailto:|tel:|sms:|javascript:|data:|#)/i.test(href)) continue;
    const relativeTarget = href.split(/[?#]/)[0];
    if (!relativeTarget) continue;
    let target;
    try {
      const decoded = decodeURIComponent(relativeTarget);
      target = path.resolve(root, decoded.startsWith('/') ? `.${decoded}` : path.join(path.dirname(file), decoded));
    }
    catch { report.brokenInternalLinks.push({ file, href, reason: 'invalid URL encoding' }); continue; }
    if (!fs.existsSync(target)) report.brokenInternalLinks.push({ file, href });
    else if (target.toLowerCase().endsWith('.html') && !file.startsWith('content/')) {
      const pageTarget = path.relative(root, target).split(path.sep).join('/');
      incomingLinks.set(pageTarget, (incomingLinks.get(pageTarget) || 0) + 1);
    }
  }
}

report.duplicateTitles = [...titlePages].filter(([, pages]) => pages.length > 1).map(([title, pages]) => ({ title, pages }));
report.duplicateDescriptions = [...descriptionPages].filter(([, pages]) => pages.length > 1).map(([description, pages]) => ({ description, pages }));

const sitemapFile = path.join(root, 'sitemap.xml');
if (fs.existsSync(sitemapFile)) {
  const sitemap = fs.readFileSync(sitemapFile, 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  report.sitemap.entries = urls.length;
  report.sitemap.duplicateUrls = urls.length - new Set(urls).size;
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const pathname = decodeURIComponent(parsed.pathname);
      const diskPath = pathname.endsWith('/') ? path.join(root, 'index.html') : path.join(root, pathname.replace(/^\//, ''));
      if (!fs.existsSync(diskPath)) report.sitemap.urlsWithoutPage.push(url);
      else {
        const relativePage = path.relative(root, diskPath).split(path.sep).join('/');
        if (!incomingLinks.has(relativePage)) report.sitemap.unlinkedPages.push(relativePage);
      }
    } catch { report.sitemap.urlsWithoutPage.push(url); }
  }
}

report.images.missingAlt = report.images.missingAlt.length;
report.images.missingDimensions = report.images.missingDimensions.length;
report.images.missingLoadingHint = report.images.missingLoadingHint.length;

console.log(JSON.stringify(report, null, 2));
