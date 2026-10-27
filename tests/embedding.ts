import { z } from 'zod';
import { SystemDesigner } from '../dist/index.js';
import type { RenderResult } from '../src/index';
import '../dist/style.css';

const sd = new SystemDesigner({ name: 'Embedded graph' });
sd.add({
  id: 'one',
  name: 'One',
  input: z.object({}),
  output: z.object({ message: z.string() }),
  processing: 'Explain the operation.',
  render: [
    { type: 'text', text: 'Embedded content' },
    { type: 'image', src: '/favicon.svg', alt: 'Example node image' },
  ],
});
let current: RenderResult | undefined;
const mount = document.getElementById('mount');
if (!(mount instanceof HTMLElement)) throw new Error('Missing fixture mount.');
document.getElementById('by-id')?.addEventListener('click', async () => {
  current = await sd.render('mount');
});
document.getElementById('by-element')?.addEventListener('click', async () => {
  current = await sd.render(mount);
});
document.getElementById('unmount')?.addEventListener('click', () => {
  if (current?.status === 'success') {
    current.unmount();
    current.unmount();
  }
});
document.getElementById('missing')?.addEventListener('click', async () => {
  const result = await sd.render('missing-element');
  const status = document.getElementById('status');
  if (status)
    status.textContent =
      result.status === 'error' ? result.message : 'Unexpected success';
});
