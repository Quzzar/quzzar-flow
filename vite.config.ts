import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig(({ mode }) => ({
  plugins: [react(), vanillaExtractPlugin()],
  build:
    mode === 'library'
      ? {
          lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: 'index',
            cssFileName: 'style',
          },
          rolldownOptions: {
            external: [
              'react',
              'react/jsx-runtime',
              'react-dom',
              'react-dom/client',
              'zod',
              '@xyflow/react',
              'lucide-react',
              'radix-ui',
            ],
          },
          cssCodeSplit: false,
          copyPublicDir: false,
        }
      : { outDir: 'dist-demo' },
}));
