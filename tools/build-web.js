// Bundle the browser host: web/tads3js.js (the page) and web/tads3js-worker.js (the VM).
// usage: node tools/build-web.js [--dev]   (--dev: no minifying)
const esbuild = require('esbuild');
const path = require('path');

const dev = process.argv.includes('--dev');
const root = path.join(__dirname, '..');

esbuild.build({
  entryPoints: {
    'tads3js': path.join(root, 'src/web/page.ts'),
    'tads3js-worker': path.join(root, 'src/web/worker.ts'),
  },
  outdir: path.join(root, 'web'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2018',
  minify: !dev,

  sourcemap: true,
  logLevel: 'info',
}).catch(() => process.exit(1));
