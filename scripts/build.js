const path = require('path');
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

esbuild.build({
  sourcemap: true,
  bundle: true,
  minify: true,
  format: 'cjs',
  platform: 'node',
  target: 'node14',
  entryPoints: [path.join(__dirname, '../src/index.ts')],
  outfile: path.join(__dirname, '../lib/index.js'),
  plugins: [nodeExternalsPlugin()],
});
