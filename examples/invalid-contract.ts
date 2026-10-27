import { z } from 'zod';
import { SystemDesigner } from '../src/index';

/** Deliberately invalid: multiple quantity suppliers and no priceCents supplier. */
export function createInvalidContractExample(): SystemDesigner {
  const sd = new SystemDesigner({
    name: 'A contract that does not fit',
  });
  for (const [id, name, quantity] of [
    ['order', 'Order quantity', 2],
    ['warehouse', 'Warehouse quantity', 40],
  ] as const) {
    sd.add({
      id,
      name,
      icon: 'braces',
      input: z.object({}),
      output: z.object({ quantity: z.number() }),
      processing: 'Expose a quantity without specifying its business meaning.',
      render: [
        { type: 'json', title: 'Illustrative value', value: { quantity } },
      ],
    });
  }
  sd.add({
    id: 'total',
    name: 'Calculate total',
    icon: 'function',
    input: z.object({ quantity: z.number(), priceCents: z.number() }),
    output: z.object({ totalCents: z.number() }),
    processing: 'Multiply the chosen quantity by its unit price.',
    additionalInfo:
      'Both sources supply quantity, so the validator refuses to guess. Neither source supplies priceCents.',
    render: [
      {
        type: 'schema',
        title: 'Required inputs',
        schema: z.object({ quantity: z.number(), priceCents: z.number() }),
      },
    ],
  });
  sd.connect('order', 'total', { label: 'quantity?' });
  sd.connect('warehouse', 'total', { label: 'quantity?' });
  return sd;
}
