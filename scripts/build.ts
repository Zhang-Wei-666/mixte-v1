import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import fs from 'fs-extra';
import { alias } from '../meta/alias';
import { packages } from '../meta/packages';

const __dirname = dirname(fileURLToPath(import.meta.url));

fs.removeSync(resolve(__dirname, '../packages/auto-imports.d.ts'));
fs.removeSync(resolve(__dirname, '../packages/.eslintrc-auto-import.json'));

const externals = [
  'vue-demi',
  '@vueuse/core',
];

(async () => {
  for (const info of packages) {
    await build({
      resolve: {
        alias,
      },
      build: {
        outDir: info.outputDir,
        lib: {
          entry: info.input,
          formats: ['es', 'cjs'],
          fileName: format => `${info.outputFileName ?? 'index'}.${format === 'es' ? 'mjs' : format}`,
        },
        minify: false,
        emptyOutDir: false,
        rollupOptions: {
          external: externals.concat(info.external ?? []),
        },
      },
    });
  }
})();
