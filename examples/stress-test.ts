import { z } from 'zod';
import { SystemDesigner } from '../src/index';

type StressMode = 'inferred' | 'ambiguous' | 'resolved';

/** 48 independently connected, nested data sources feed a single decision contract. */
export function createStressExample(
  mode: StressMode = 'inferred',
): SystemDesigner {
  const sd = new SystemDesigner({
    name:
      mode === 'inferred'
        ? '48-source stress test'
        : mode === 'ambiguous'
          ? 'Stress test: ambiguous inputs'
          : 'Stress test: explicit mappings',
  });
  const signal = z.object({
    value: z.number().int().min(0),
    observedAt: z.string(),
    quality: z.enum(['fresh', 'stale']),
  });
  const inputs: Record<string, typeof signal> = {};

  for (let index = 1; index <= 48; index++) {
    const key = `signal${String(index).padStart(2, '0')}`;
    inputs[key] = signal;
    sd.add({
      id: key,
      name: `Signal ${String(index).padStart(2, '0')}`,
      icon: index % 3 === 0 ? 'database' : 'braces',
      input: z.object({}),
      output: z.object({
        signals: z.object({ [key]: signal }),
        sourceId: z.string(),
      }),
      processing: `Supply ${key}: its value, observation time, and freshness.`,
      render: [
        {
          type: 'text',
          title: 'Illustrative observation',
          text: `${index * 7} · fresh`,
        },
      ],
    });
    const map =
      mode === 'resolved' && index === 1
        ? [{ from: ['signals', key], to: ['signals', key] }]
        : undefined;
    sd.connect(key, 'decision', { label: key, ...(map ? { map } : {}) });
  }

  if (mode !== 'inferred') {
    sd.add({
      id: 'duplicate',
      name: 'Alternate signal 01',
      icon: 'database',
      input: z.object({}),
      output: z.object({ signals: z.object({ signal01: signal }) }),
      processing: 'Offer an equally typed signal with the same field paths.',
      render: [
        { type: 'text', title: 'Competing observation', text: '99 · stale' },
      ],
    });
    sd.connect('duplicate', 'decision', { label: 'signal01 (alternative)' });
  }

  const decision = z.object({
    status: z.enum(['ready', 'review']),
    sourceCount: z.number().int().min(0),
    accepted: z.boolean(),
  });
  sd.add({
    id: 'decision',
    name: 'Combine observations',
    icon: 'function',
    input: z.object({ signals: z.object(inputs) }),
    output: z.object({ decision }),
    processing:
      'Consider all supplied observations and describe a combined decision.',
    additionalInfo:
      mode === 'resolved'
        ? 'An explicit subtree mapping chooses signal01 for all three fields. The alternate connection remains available but is not consumed.'
        : 'Every source supplies three required nested fields. Matching uses complete paths, so repeated leaf names do not create ambiguity across different signals.',
    render: [
      {
        type: 'table',
        title: 'Contract size',
        columns: ['Sources', 'Required fields'],
        rows: [[48, 144]],
      },
      { type: 'schema', title: 'Decision output', schema: decision },
    ],
  });
  for (const channel of ['dashboard', 'archive', 'notification', 'audit']) {
    sd.add({
      id: channel,
      name: `${channel[0]?.toUpperCase()}${channel.slice(1)}`,
      icon: channel === 'archive' ? 'database' : 'check',
      input: z.object({ decision }),
      output: z.object({ channel: z.literal(channel), delivered: z.boolean() }),
      processing: `Describe how the decision would be consumed by ${channel}.`,
      additionalInfo:
        'This is a contract example. No notification, database write, or other side effect runs.',
      render: [
        { type: 'text', text: 'Consumes the shared decision contract.' },
      ],
    });
    sd.connect('decision', channel, { label: 'decision' });
  }
  return sd;
}
