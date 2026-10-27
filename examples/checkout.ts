import { z } from 'zod';
import { SystemDesigner } from '../src/index';

/** Fan-in: resolve a nested quantity and a separate price into one consumer. */
export function createCheckoutExample(): SystemDesigner {
  const sd = new SystemDesigner({
    name: 'Order checkout',
  });

  sd.add({
    id: 'order',
    name: 'Order request',
    input: z.object({}),
    output: z.object({
      order: z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      }),
    }),
    processing: 'Supply the requested product and quantity.',
    additionalInfo:
      'Illustrative request data. This graph describes contracts; it does not execute an order.',
    render: [
      {
        type: 'json',
        title: 'Illustrative payload',
        value: { order: { productId: 'notebook', quantity: 2 } },
      },
    ],
  });

  sd.add({
    icon: 'database',
    id: 'catalog',
    name: 'Product price',
    input: z.object({}),
    output: z.object({
      pricing: z.object({ priceCents: z.number().int().min(0) }),
    }),
    processing: 'Supply a unit price from the product catalog.',
    additionalInfo:
      'Prices are modeled in integer cents. No catalog request is performed.',
    render: [
      {
        type: 'table',
        title: 'Illustrative catalog entry',
        columns: ['Product', 'Price (¢)'],
        rows: [['Notebook', 1800]],
      },
    ],
  });

  sd.add({
    id: 'calculate-total',
    name: 'Calculate total',
    input: z.object({
      quantity: z.number().int().min(1),
      priceCents: z.number().int().min(0),
    }),
    output: z.object({
      totalCents: z.number().int().min(0),
      currency: z.literal('USD'),
    }),
    processing: 'Multiply quantity by priceCents to produce the total.',
    additionalInfo:
      'quantity is inferred from order.order.quantity; priceCents comes from catalog.pricing.priceCents. Extra source fields are not required.',
    render: [
      {
        type: 'json',
        title: 'Illustrative result',
        value: { totalCents: 3600, currency: 'USD' },
      },
    ],
  });

  sd.add({
    id: 'confirmation',
    name: 'Confirmation',
    input: z.object({
      totalCents: z.number().int().min(0),
      currency: z.literal('USD'),
    }),
    output: z.object({ total: z.string(), status: z.literal('ready') }),
    processing: 'Format the total for a confirmation screen.',
    render: [
      {
        type: 'text',
        title: 'Illustrative display',
        text: '2 notebooks · $36.00',
      },
      {
        type: 'schema',
        title: 'Output contract',
        schema: z.object({ total: z.string(), status: z.literal('ready') }),
      },
    ],
  });

  sd.connect('order', 'calculate-total', { label: 'quantity' });
  sd.connect('catalog', 'calculate-total', { label: 'priceCents' });
  sd.connect('calculate-total', 'confirmation', {
    label: 'totalCents, currency',
  });

  return sd;
}
