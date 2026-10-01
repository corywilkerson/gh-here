const esbuild = require('esbuild');
const fs = require('node:fs/promises');
const path = require('node:path');

async function build() {
  await fs.rm('public/licenses', { recursive: true, force: true });
  await fs.mkdir('public/licenses', { recursive: true });
  await fs.rm('public/build', { recursive: true, force: true });
  await fs.mkdir('public/fonts', { recursive: true });
  for (const name of ['geist', 'geist-mono']) {
    await fs.copyFile(
      path.join(
        'node_modules',
        '@fontsource-variable',
        name,
        'files',
        `${name}-latin-wght-normal.woff2`,
      ),
      `public/fonts/${name}.woff2`,
    );
    await fs.copyFile(
      path.join('node_modules', '@fontsource-variable', name, 'LICENSE'),
      `public/fonts/${name}-LICENSE.txt`,
    );
  }
  const result = await esbuild.build({
    entryPoints: ['client/main.js'],
    outdir: 'public/build',
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    minify: true,
    chunkNames: 'chunks/[name]-[hash]',
    logLevel: 'warning',
    metafile: true,
    // Fonts are served by Express from public/fonts, not bundled.
    external: ['/static/*'],
  });
  const packages = new Set(
    Object.keys(result.metafile.inputs)
      .map((input) => input.match(/^node_modules\/(?:@[^/]+\/)?[^/]+/)?.[0])
      .filter(Boolean),
  );
  for (const directory of packages) {
    const name = directory.slice('node_modules/'.length).replace('/', '-');
    for (const file of await fs.readdir(directory)) {
      if (/^(LICENSE|NOTICE|COPYING)(\.|$)/i.test(file)) {
        await fs.copyFile(
          path.join(directory, file),
          `public/licenses/${name}-${file}`,
        );
      }
    }
  }
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
