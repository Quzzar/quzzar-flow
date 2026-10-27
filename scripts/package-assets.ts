import { copyFileSync, mkdirSync } from 'node:fs';

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
