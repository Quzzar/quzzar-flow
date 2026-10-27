import { z } from 'zod';
import { createElement } from 'react';
import { SystemDesigner } from '../dist/index.js';
import type { RenderResult } from '../src/index';
import '../dist/style.css';

const sd = new SystemDesigner({ name: 'Embedded graph' });
sd.add({
  id: 'one',
  name: 'One',
  input: z.object({}),
  output: z.object({
    message: z.string(),
    customer: z.object({
      name: z.string(),
      note: z.string().max(80).optional(),
      tags: z.array(z.enum(['alpha', 'beta'])).min(1),
    }),
  }),
  processing: 'Explain the operation.',
  render: [
    { type: 'text', text: 'Embedded content' },
    { type: 'image', src: '/favicon.svg', alt: 'Example node image' },
  ],
});
const header = document.createElement('h1');
header.textContent = 'Embedded graph';
let current: RenderResult | undefined;
const mount = document.getElementById('mount');
if (!(mount instanceof HTMLElement)) throw new Error('Missing fixture mount.');
document.getElementById('by-id')?.addEventListener('click', async () => {
  current = await sd.render('mount', { header });
});
document.getElementById('by-element')?.addEventListener('click', async () => {
  current = await sd.render(mount, { header });
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

document.getElementById('react-header')?.addEventListener('click', async () => {
  current = await sd.render('mount', {
    header: createElement('h1', null, 'React header'),
  });
});
