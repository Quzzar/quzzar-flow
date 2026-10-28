import { createFullStackAppExample } from './full-stack-app';
import { createDatabaseDesignExample } from './database-design';
import { createCheckoutExample } from './checkout';
import { createDocumentReviewExample } from './document-review';
import { createImageDeliveryExample } from './image-delivery';
import { createInvalidContractExample } from './invalid-contract';
import { createStressExample } from './stress-test';
import { createGroupedSystemExample } from './grouped-system';

export const EXAMPLES = [
  {
    id: 'full-stack-app',
    name: 'Full-stack app',
    source: 'full-stack-app.ts',
    create: createFullStackAppExample,
    selectedNode: 'authorize',
  },
  {
    id: 'database-design',
    name: 'Database design',
    source: 'database-design.ts',
    create: createDatabaseDesignExample,
    selectedNode: 'memberships',
  },
  {
    id: 'checkout',
    name: 'Order checkout',
    source: 'checkout.ts',
    create: createCheckoutExample,
    selectedNode: 'calculate-total',
  },
  {
    id: 'document-review',
    name: 'Document review',
    source: 'document-review.ts',
    create: createDocumentReviewExample,
    selectedNode: 'review',
  },
  {
    id: 'image-delivery',
    name: 'Image delivery',
    source: 'image-delivery.ts',
    create: createImageDeliveryExample,
    selectedNode: 'metadata',
  },
  {
    id: 'invalid-contract',
    name: 'Invalid contract',
    source: 'invalid-contract.ts',
    create: createInvalidContractExample,
    selectedNode: 'total',
  },
  {
    id: 'stress-test',
    name: 'Stress test',
    source: 'stress-test.ts',
    create: () => createStressExample('inferred'),
    selectedNode: 'decision',
  },
  {
    id: 'stress-ambiguous',
    name: 'Stress: ambiguous',
    source: 'stress-test.ts',
    create: () => createStressExample('ambiguous'),
    selectedNode: 'decision',
  },
  {
    id: 'stress-resolved',
    name: 'Stress: resolved',
    source: 'stress-test.ts',
    create: () => createStressExample('resolved'),
    selectedNode: 'decision',
  },
  {
    id: 'grouped-system',
    name: 'Node groups',
    source: 'grouped-system.ts',
    create: createGroupedSystemExample,
    selectedNode: 'calculate',
  },
];
