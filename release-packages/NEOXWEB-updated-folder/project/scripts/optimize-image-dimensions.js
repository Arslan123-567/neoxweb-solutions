/* Add intrinsic dimensions to local HTML images to reduce layout shifts. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const apply = process.argv.includes('--apply');
const files = [];
let checked = 0;
let updated = 0;
let skipped = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') walk(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(file);
  }
}
walk(root);

function imageSize(file) {
  const data = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png' && data.length >= 24 && data.toString('ascii', 1, 4) === 'PNG') {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    let offset = 2;
    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) { offset++; continue; }
      const marker = data[offset + 1];
      const length = data.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7) };
      }
      if (length < 2) break;
      offset += 2 + length;
    }
  }
  if (ext === '.svg') {
    const svg = data.toString('utf8', 0, Math.min(data.length, 4096));
    const viewBox = svg.match(/\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i);
    if (viewBox) return { width: Math.round(Number(viewBox[1])), height: Math.round(Number(viewBox[2])) };
    const width = svg.match(/\bwidth=["']([\d.]+)(?:px)?["']/i);
    const height = svg.match(/\bheight=["']([\d.]+)(?:px)?["']/i);
    if (width && height) return { width: Math.round(Number(width[1])), height: Math.round(Number(height[1])) };
  }
  return null;
}

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  after = after.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\bwidth\s*=/.test(tag) && /\bheight\s*=/.test(tag)) return tag;
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src || /^(?:https?:|data:|blob:|\/\/)/i.test(src) || /\{\{|\$\{|<%/.test(src)) { skipped++; return tag; }
    checked++;
    let imagePath;
    const referenceBase = file.includes(`${path.sep}content${path.sep}`) ? root : path.dirname(file);
    try { imagePath = path.resolve(referenceBase, decodeURIComponent(src.split(/[?#]/)[0])); }
    catch { skipped++; return tag; }
    if (!fs.existsSync(imagePath)) { skipped++; return tag; }
    const size = imageSize(imagePath);
    if (!size || size.width < 1 || size.height < 1) { skipped++; return tag; }
    updated++;
    let result = tag;
    if (!/\bwidth\s*=/.test(result)) result = result.replace(/<img\b/i, `<img width="${size.width}"`);
    if (!/\bheight\s*=/.test(result)) result = result.replace(/<img\b/i, `<img height="${size.height}"`);
    return result;
  });
  if (apply && after !== before) fs.writeFileSync(file, after, 'utf8');
}

console.log(JSON.stringify({ mode: apply ? 'applied' : 'dry-run', checked, updated, skipped }, null, 2));
