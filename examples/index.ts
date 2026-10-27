import { createCheckoutExample } from './checkout';
import { createDocumentReviewExample } from './document-review';
import { createImageDeliveryExample } from './image-delivery';
import { createInvalidContractExample } from './invalid-contract';

export const EXAMPLES = [
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
];
