import { z } from 'zod';
import { SystemDesigner } from '../src/index';

/** Frontend, backend, and database boundaries with cross-group connections. */
export function createGroupedSystemExample(): SystemDesigner {
  const sd = new SystemDesigner({ name: 'Grouped checkout system' });
  sd.addGroup({
    id: 'frontend',
    name: 'Frontend',
    icon: 'monitor',
    color: 'blue',
  });
  sd.addGroup({
    id: 'backend',
    name: 'Backend',
    icon: 'server',
    color: 'green',
  });
  sd.addGroup({
    id: 'database',
    name: 'Database',
    icon: 'database',
    color: 'amber',
  });
  const receipt = z.object({
    receiptId: z.string(),
    totalCents: z.number().int().min(0),
  });

  sd.add({
    id: 'checkout-form',
    group: 'frontend',
    name: 'Checkout form',
    icon: 'monitor',
    input: z.object({}),
    output: z.object({
      customerId: z.string(),
      quantity: z.number().int().min(1),
    }),
    processing: 'Collect the customer and requested quantity.',
    render: [
      {
        type: 'json',
        title: 'Illustrative request',
        value: { customerId: 'cus_1042', quantity: 2 },
      },
    ],
  });
  sd.add({
    id: 'confirmation-screen',
    group: 'frontend',
    name: 'Confirmation screen',
    icon: 'check',
    input: receipt,
    output: z.object({ displayed: z.boolean() }),
    processing: 'Display the saved receipt to the customer.',
    render: [{ type: 'text', text: 'Order confirmed · $36.00' }],
  });
  sd.add({
    id: 'calculate',
    group: 'backend',
    name: 'Calculate total',
    icon: 'function',
    input: z.object({
      customerId: z.string(),
      quantity: z.number().int().min(1),
      priceCents: z.number().int().min(0),
    }),
    output: z.object({
      customerId: z.string(),
      totalCents: z.number().int().min(0),
    }),
    processing:
      'Combine the request with the catalog price to calculate the total.',
    render: [
      {
        type: 'schema',
        title: 'Order to save',
        schema: z.object({
          customerId: z.string(),
          totalCents: z.number().int().min(0),
        }),
      },
    ],
  });
  sd.add({
    id: 'response',
    group: 'backend',
    name: 'Build response',
    icon: 'server',
    input: receipt,
    output: receipt,
    processing: 'Shape the saved receipt for the frontend.',
    render: [{ type: 'schema', title: 'Response contract', schema: receipt }],
  });
  sd.add({
    id: 'catalog',
    group: 'database',
    name: 'Product catalog',
    icon: 'database',
    input: z.object({}),
    output: z.object({ priceCents: z.number().int().min(0) }),
    processing: 'Supply the selected product’s unit price.',
    render: [
      {
        type: 'table',
        title: 'Illustrative catalog row',
        columns: ['Product', 'Price (¢)'],
        rows: [['Notebook', 1800]],
      },
    ],
  });
  sd.add({
    id: 'orders',
    group: 'database',
    name: 'Orders',
    icon: 'database',
    input: z.object({
      customerId: z.string(),
      totalCents: z.number().int().min(0),
    }),
    output: receipt,
    processing:
      'Describe storing the order and returning a receipt. No write is executed.',
    render: [
      {
        type: 'json',
        title: 'Illustrative saved row',
        value: { receiptId: 'rcpt_2048', totalCents: 3600 },
      },
    ],
  });
  sd.connect('checkout-form', 'calculate', { label: 'Request' });
  sd.connect('catalog', 'calculate', { label: 'Unit price' });
  sd.connect('calculate', 'orders', { label: 'Order to save' });
  sd.connect('orders', 'response', { label: 'Saved receipt' });
  sd.connect('response', 'confirmation-screen', { label: 'Confirmation' });
  return sd;
}
