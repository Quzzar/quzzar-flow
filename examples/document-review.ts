import { z } from 'zod';
import { SystemDesigner } from '../src/index';

/** Fan-out: a reviewed document feeds both a readable summary and an archive. */
export function createDocumentReviewExample(): SystemDesigner {
  const sd = new SystemDesigner({
    name: 'Document review',
  });
  const documentSchema = z.object({ title: z.string(), body: z.string() });
  const reviewedSchema = z.object({
    title: z.string(),
    wordCount: z.number().int(),
    approved: z.boolean(),
  });
  sd.add({
    id: 'document',
    name: 'Draft document',
    icon: 'file',
    input: z.object({}),
    output: z.object({ content: documentSchema }),
    processing: 'Supply the title and text of a draft.',
    render: [
      {
        type: 'text',
        title: 'Illustrative document',
        text: 'Designing a better handoff',
      },
      {
        type: 'text',
        text: 'A short guide to making system boundaries explicit.',
      },
    ],
  });
  sd.add({
    id: 'policy',
    name: 'Review policy',
    icon: 'database',
    input: z.object({}),
    output: z.object({
      settings: z.object({ maxWords: z.number().int().min(1) }),
    }),
    processing: 'Supply a maximum word count for the review.',
    render: [
      {
        type: 'table',
        title: 'Illustrative policy',
        columns: ['Rule', 'Value'],
        rows: [['Max. words', 500]],
      },
    ],
  });
  sd.add({
    id: 'review',
    name: 'Review document',
    icon: 'function',
    input: z.object({
      content: documentSchema,
      maxWords: z.number().int().min(1),
    }),
    output: z.object({ reviewed: reviewedSchema }),
    processing:
      'Count the words and compare the draft against the review policy.',
    additionalInfo:
      'The processing is described, not executed. The diagram infers title and body from the document, and maxWords from the policy.',
    render: [
      { type: 'schema', title: 'Reviewed document', schema: reviewedSchema },
    ],
  });
  sd.add({
    id: 'summary',
    name: 'Review summary',
    icon: 'check',
    input: z.object({ reviewed: reviewedSchema }),
    output: z.object({ message: z.string() }),
    processing: 'Present the review decision to the author.',
    render: [
      {
        type: 'json',
        title: 'Illustrative summary',
        value: {
          title: 'Designing a better handoff',
          wordCount: 9,
          approved: true,
        },
      },
    ],
  });
  sd.add({
    id: 'archive',
    name: 'Archive record',
    icon: 'database',
    input: z.object({ reviewed: reviewedSchema }),
    output: z.object({ recordId: z.string() }),
    processing: 'Describe an archive write of the reviewed document.',
    additionalInfo: 'No database write is performed by this viewer.',
    render: [
      {
        type: 'text',
        text: 'Store the review decision with the original title.',
      },
    ],
  });
  sd.connect('document', 'review', { label: 'title, body' }).connect(
    'policy',
    'review',
    { label: 'maxWords' },
  );
  sd.connect('review', 'summary', { label: 'reviewed' }).connect(
    'review',
    'archive',
    { label: 'reviewed' },
  );
  return sd;
}
