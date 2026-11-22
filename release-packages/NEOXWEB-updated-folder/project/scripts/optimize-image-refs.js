/* Point HTML and CSS at existing smaller optimized image variants. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const apply = process.argv.includes('--apply');
const extensions = new Set(['.html', '.css']);
const candidates = new Map();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') walk(file);
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
      const source = fs.readFileSync(file, 'utf8');
      let output = source;
      for (const match of source.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+\.(?:jpe?g|png))["']/gi)) {
        const ref = match[1];
        if (/^(?:https?:|data:)/i.test(ref) || /\.opt\./i.test(ref)) continue;
        const absolute = path.resolve(path.dirname(file), ref);
        const ext = path.extname(absolute);
        const stem = absolute.slice(0, -ext.length);
        const alternatives = [`${stem}.opt${ext}`, `${stem}.opt.jpg`, `${stem}.opt.png`];
        const optimized = alternatives.find((candidate) => fs.existsSync(candidate));
        if (!optimized) continue;
        const originalBytes = fs.statSync(absolute).size;
        const optimizedBytes = fs.statSync(optimized).size;
        if (optimizedBytes >= originalBytes) continue;
        const rel = path.relative(root, absolute).split(path.sep).join('/');
        const nextRef = path.relative(path.dirname(file), optimized).split(path.sep).join('/');
        candidates.set(rel, { originalBytes, optimizedBytes, references: (candidates.get(rel)?.references || 0) + 1 });
        output = output.split(ref).join(nextRef);
      }
      if (apply && output !== source) fs.writeFileSync(file, output, 'utf8');
    }
  }
}

walk(root);
const originals = [...candidates.values()].reduce((n, item) => n + item.originalBytes, 0);
const optimized = [...candidates.values()].reduce((n, item) => n + item.optimizedBytes, 0);
console.log(JSON.stringify({ mode: apply ? 'applied' : 'dry-run', imageVariants: candidates.size,
  references: [...candidates.values()].reduce((n, item) => n + item.references, 0),
  estimatedBytesSaved: originals - optimized,
  savedPercent: originals ? Math.round((originals - optimized) / originals * 100) : 0,
  files: [...candidates.keys()] }, null, 2));
