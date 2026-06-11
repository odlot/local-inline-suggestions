import * as esbuild from 'esbuild';

const watch      = process.argv.includes('--watch');
const production = process.argv.includes('--production');

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ['src/extension.ts'],
  bundle:      true,
  platform:    'node',
  format:      'cjs',
  target:      'node20',
  external:    ['vscode'],
  outfile:     'dist/extension.js',
  sourcemap:   !production,
  minify:      production,
};

if (watch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [{
      name: 'rebuild-notify',
      setup(build) {
        build.onEnd(result => {
          if (result.errors.length > 0) {
            console.error('Build failed:', result.errors);
          } else {
            console.log('Rebuilt successfully');
          }
        });
      },
    }],
  });
  await ctx.watch();
  console.log('Watching for changes…');
} else {
  await esbuild.build(options).catch(() => process.exit(1));
  console.log('Build complete →', options.outfile);
}
