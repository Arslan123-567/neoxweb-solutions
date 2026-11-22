/**
 * Generate sitemap.xml from indexable HTML pages on the production domain.
 * Manual: node scripts/generate-sitemap.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const siteUrl = 'https://neoxweb.com';
const excludedFiles = new Set(['404.html', 'navbar.html', 'unified-footer.html', 'profile.html']);

function listHtmlFiles(directory, relative = '') {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);
        const relativePath = path.posix.join(relative, entry.name);

        if (entry.isDirectory() && entry.name !== 'node_modules') {
            return listHtmlFiles(entryPath, relativePath);
        }

        return entry.isFile() && entry.name.endsWith('.html') ? [relativePath] : [];
    });
}

function isIndexable(file) {
    if (excludedFiles.has(file)) return false;

    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const head = (html.match(/<head\b[\s\S]*?<\/head>/i) || [''])[0];
    const canonical = (head.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || [])[1];
    const expectedCanonical = file === 'index.html'
        ? `${siteUrl}/`
        : `${siteUrl}/${file.split('/').map(encodeURIComponent).join('/')}`;

    return /<title\b[^>]*>[\s\S]*?<\/title>/i.test(head)
        && /<meta\s+name=["']description["']\s+content=["'][^"']+["']/i.test(head)
        && canonical === expectedCanonical
        && !/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(head);
}

function priorityFor(file) {
    if (file === 'index.html') return '1.0';
    if (['contact.html', 'services.html', 'portfolio.html'].includes(file)) return '0.9';
    if (file === 'privacy-policy.html') return '0.3';
    return '0.7';
}

function escapeXml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const pages = listHtmlFiles(root)
    .filter(isIndexable)
    .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));

const urls = pages.map((file) => {
    const loc = file === 'index.html'
        ? `${siteUrl}/`
        : `${siteUrl}/${file.split('/').map(encodeURIComponent).join('/')}`;
    const changefreq = file === 'index.html' || ['blog.html', 'resources.html'].includes(file)
        ? 'weekly'
        : file === 'privacy-policy.html' ? 'yearly' : 'monthly';

    return `  <url><loc>${escapeXml(loc)}</loc><changefreq>${changefreq}</changefreq><priority>${priorityFor(file)}</priority></url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

fs.writeFileSync(path.join(root, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml updated for ${siteUrl} (${pages.length} pages)`);
