import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

// Font bytes are embedded in the library CSS, so distribute their licenses too.
mkdirSync('dist/licenses', { recursive: true });
copyFileSync(
  'node_modules/@fontsource-variable/manrope/LICENSE',
  'dist/licenses/manrope-OFL.txt',
);
copyFileSync(
  'node_modules/@fontsource/ibm-plex-mono/LICENSE',
  'dist/licenses/ibm-plex-mono-OFL.txt',
);

copyFileSync(
  'node_modules/@xyflow/react/LICENSE',
  'dist/licenses/react-flow-MIT.txt',
);

// ESM declarations must resolve in both Bundler and NodeNext TypeScript projects.
function normalizeDeclarations(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) normalizeDeclarations(path);
    else if (entry.name.endsWith('.d.ts')) {
      const source = readFileSync(path, 'utf8');
      const normalized = source.replace(
        /((?:from\s+|import\s*\(\s*|import\s*)['"])(\.\.?\/[^'"]+)(['"])/g,
        (_match: string, prefix: string, specifier: string, quote: string) =>
          `${prefix}${/\.(?:mjs|cjs|js|json)$/.test(specifier) ? specifier : `${specifier}.js`}${quote}`,
      );
      writeFileSync(path, normalized);
    }
  }
}
normalizeDeclarations('dist/types');
