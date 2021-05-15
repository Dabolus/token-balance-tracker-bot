const path = require('path');
const chokidar = require('chokidar');
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const nodemon = require('nodemon');

let builder;

const build = async () => {
  builder = builder
    ? await builder.rebuild()
    : await esbuild.build({
        sourcemap: 'inline',
        incremental: true,
        bundle: true,
        format: 'cjs',
        platform: 'node',
        target: 'node14',
        entryPoints: [path.join(__dirname, '../src/dev.ts')],
        outfile: path.join(__dirname, '../lib/index.js'),
        plugins: [nodeExternalsPlugin()],
      });
};

const watcher = chokidar.watch(path.join(__dirname, '../src/**/*.ts'), {
  ignoreInitial: true,
});

watcher.on('all', build);
build().then(() => {
  nodemon({
    script: path.join(__dirname, '../lib/index.js'),
  });
});
