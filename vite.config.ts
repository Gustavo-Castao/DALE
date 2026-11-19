import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

export default defineConfig(({command}) => {
  const isBuild = command === 'build';
  return {
    base: isBuild ? './' : '/',
    plugins: [
      react(),
      tailwindcss(),
      ...(isBuild ? [viteSingleFile()] : []),
      {
        name: 'copy-unbundled-src-assets-and-docs',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }

          // Export single-file build to docs/index.html for direct GitHub Pages hosting
          const distIndex = path.resolve(distDir, 'index.html');
          const docsDir = path.resolve(__dirname, 'docs');
          if (fs.existsSync(distIndex)) {
            fs.mkdirSync(docsDir, {recursive: true});
            fs.copyFileSync(distIndex, path.resolve(docsDir, 'index.html'));
            fs.writeFileSync(path.resolve(docsDir, '.nojekyll'), '');
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
