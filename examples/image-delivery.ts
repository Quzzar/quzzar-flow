import { z } from 'zod';
import { SystemDesigner } from '../src/index';

/** Image content, metadata tables, and schema blocks share the same node renderer. */
export function createImageDeliveryExample(): SystemDesigner {
  const sd = new SystemDesigner({
    name: 'Image delivery',
    description:
      'Preview an image alongside its metadata and delivery contract.',
  });
  const assetSchema = z.object({
    url: z.string(),
    width: z.number().int(),
    height: z.number().int(),
  });
  sd.add({
    id: 'asset',
    name: 'Uploaded image',
    icon: 'image',
    input: z.object({}),
    output: z.object({ asset: assetSchema }),
    processing: 'Supply an image URL and its dimensions.',
    render: [
      {
        type: 'image',
        title: 'Example: workbench capture',
        src: '/examples/workbench.png',
        alt: 'Screenshot of the Quzzar System Designer checkout example',
      },
    ],
  });
  sd.add({
    id: 'metadata',
    name: 'Image metadata',
    icon: 'table',
    input: z.object({ asset: assetSchema }),
    output: z.object({
      width: z.number().int(),
      height: z.number().int(),
      aspectRatio: z.number(),
    }),
    processing: 'Read width and height and calculate the aspect ratio.',
    render: [
      {
        type: 'table',
        title: 'Illustrative metadata',
        columns: ['Property', 'Value'],
        rows: [
          ['Width', 1440],
          ['Height', 960],
          ['Ratio', 1.5],
        ],
      },
    ],
  });
  sd.add({
    id: 'delivery',
    name: 'Delivery manifest',
    icon: 'file',
    input: z.object({ asset: assetSchema, aspectRatio: z.number() }),
    output: z.object({ imageUrl: z.string(), aspectRatio: z.number() }),
    processing: 'Combine the original asset URL with derived metadata.',
    additionalInfo:
      'This graph describes the transformation. It does not upload, resize, or send an image.',
    render: [
      {
        type: 'schema',
        title: 'Manifest contract',
        schema: z.object({ imageUrl: z.string(), aspectRatio: z.number() }),
      },
    ],
  });
  sd.connect('asset', 'metadata', { label: 'asset' });
  sd.connect('asset', 'delivery', { label: 'asset' });
  sd.connect('metadata', 'delivery', { label: 'aspectRatio' });
  return sd;
}
