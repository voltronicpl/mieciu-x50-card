// Prosty bundler bez zależności: skleja moduły ESM w jeden plik dist/.
// Kolejność = kolejność zależności. Usuwa linie import i słowo "export".
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const order = [
  'src/util/parse.js',
  'src/translations/pl.js',
  'src/adapter/entities.js',
  'src/adapter/capability-detection.js',
  'src/adapter/commands.js',
  'src/adapter/map.js',
  'src/adapter/map-render.js',
  'src/graphics/assets.js',
  'src/state/visual-state.js',
  'src/graphics/station.js',
  'src/styles.js',
  'src/views/views.js',
  'src/mieciu-x50-card.js',
];

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
let out = `/*! Mieciu X50 Card v${pkg.version} | MIT | https://github.com/ — autorska karta Lovelace */\n(() => {\n'use strict';\n`;
for (const f of order) {
  const src = readFileSync(f, 'utf8')
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+(?=(const|function|class|let|async))/gm, '');
  if (/^\s*(import|export)\s/m.test(src)) throw new Error(`Nieobsłużony import/export w ${f}`);
  out += `\n// ===== ${f} =====\n${src}`;
}
out = out.replace("const VERSION = '0.1.0';", `const VERSION = '${pkg.version}';`);
out += '\n})();\n';
mkdirSync('dist', { recursive: true });
writeFileSync('dist/mieciu-x50-card.js', out);
console.log(`dist/mieciu-x50-card.js  ${(out.length / 1024).toFixed(1)} KB`);
