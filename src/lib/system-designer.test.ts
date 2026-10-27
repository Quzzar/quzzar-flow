import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { SystemDesigner } from './system-designer';

function source(sd: SystemDesigner, id: string, output: z.ZodType) {
  sd.add({
    id,
    name: id,
    input: z.object({}),
    output,
    processing: 'Supply values.',
  });
}

function target(sd: SystemDesigner, input: z.ZodType) {
  sd.add({
    id: 'target',
    name: 'Target',
    input,
    output: z.object({}),
    processing: 'Describe a transformation.',
  });
}

describe('contract inference', () => {
  test('combines required fields from separate deeply nested sources and ignores unrelated data', () => {
    const sd = new SystemDesigner();
    source(
      sd,
      'order',
      z.object({
        request: z.object({
          item: z.object({ quantity: z.number() }),
          note: z.string(),
        }),
      }),
    );
    source(
      sd,
      'price',
      z.object({ catalog: z.object({ priceCents: z.number() }) }),
    );
    target(sd, z.object({ quantity: z.number(), priceCents: z.number() }));
    sd.connect('order', 'target').connect('price', 'target');
    const result = sd.validate();
    expect(result.status).toBe('valid');
    expect(result.bindings).toEqual([
      {
        nodeId: 'target',
        inputPath: '$["quantity"]',
        sourceNodeId: 'order',
        outputPath: '$["request"]["item"]["quantity"]',
        connectionId: 'connection-1',
        mode: 'inferred',
      },
      {
        nodeId: 'target',
        inputPath: '$["priceCents"]',
        sourceNodeId: 'price',
        outputPath: '$["catalog"]["priceCents"]',
        connectionId: 'connection-2',
        mode: 'inferred',
      },
    ]);
  });

  test('matches nested keys independently of declaration order', () => {
    const sd = new SystemDesigner();
    source(
      sd,
      'source',
      z.object({
        shipping: z.object({ city: z.string(), zip: z.string() }),
        quantity: z.number(),
      }),
    );
    target(
      sd,
      z.object({
        quantity: z.number(),
        shipping: z.object({ zip: z.string(), city: z.string() }),
      }),
    );
    sd.connect('source', 'target');
    expect(sd.validate().valid).toBe(true);
    expect(sd.validate().bindings).toHaveLength(3);
  });

  test('validates objects inside arrays and reports nested type mismatches', () => {
    const sd = new SystemDesigner();
    source(
      sd,
      'source',
      z.object({ items: z.array(z.object({ quantity: z.string() })) }),
    );
    target(
      sd,
      z.object({ items: z.array(z.object({ quantity: z.number() })) }),
    );
    sd.connect('source', 'target');
    expect(sd.validate().status).toBe('invalid');
    expect(sd.validate().issues[0]?.message).toContain('Expected number');
  });

  test('reports missing inputs even if five unrelated fields are available', () => {
    const sd = new SystemDesigner();
    source(
      sd,
      'source',
      z.object({
        a: z.number(),
        b: z.number(),
        c: z.number(),
        d: z.number(),
        e: z.number(),
      }),
    );
    target(sd, z.object({ quantity: z.number() }));
    sd.connect('source', 'target');
    expect(sd.validate().issues).toContainEqual(
      expect.objectContaining({ code: 'missing-input', path: '$["quantity"]' }),
    );
  });

  test('does not guess between equally compatible sources', () => {
    const sd = new SystemDesigner();
    source(sd, 'warehouse', z.object({ quantity: z.number() }));
    source(sd, 'order', z.object({ quantity: z.number() }));
    target(sd, z.object({ quantity: z.number() }));
    sd.connect('warehouse', 'target').connect('order', 'target');
    expect(sd.validate().issues[0]?.code).toBe('ambiguous-input');
    expect(sd.validate().bindings).toHaveLength(0);
  });

  test('prefers an exact full path over another same-named nested field', () => {
    const sd = new SystemDesigner();
    source(
      sd,
      'source',
      z.object({
        order: z.object({ quantity: z.number() }),
        warehouse: z.object({ quantity: z.number() }),
      }),
    );
    target(sd, z.object({ order: z.object({ quantity: z.number() }) }));
    sd.connect('source', 'target');
    expect(sd.validate().valid).toBe(true);
    expect(sd.validate().bindings[0]?.outputPath).toBe(
      '$["order"]["quantity"]',
    );
  });

  test('an optional output or optional ancestor cannot guarantee a required input', () => {
    for (const output of [
      z.object({ quantity: z.number().optional() }),
      z.object({ item: z.object({ quantity: z.number() }).optional() }),
    ]) {
      const sd = new SystemDesigner();
      source(sd, 'source', output);
      target(sd, z.object({ quantity: z.number() }));
      sd.connect('source', 'target');
      expect(sd.validate().valid).toBe(false);
      expect(sd.validate().issues[0]?.code).toBe('incompatible-input');
    }
  });

  test('allows unsupplied optional inputs and rejects required inputs with no connections', () => {
    const optional = new SystemDesigner();
    target(optional, z.object({ quantity: z.number().optional() }));
    expect(optional.validate().valid).toBe(true);
    const required = new SystemDesigner();
    target(required, z.object({ quantity: z.number() }));
    expect(required.validate().status).toBe('invalid');
  });

  test('accepts narrower enums and rejects broader enum outputs', () => {
    for (const [output, input, expected] of [
      [z.literal('USD'), z.enum(['USD', 'EUR']), true],
      [z.enum(['USD', 'EUR']), z.literal('USD'), false],
    ] as const) {
      const sd = new SystemDesigner();
      source(sd, 'source', z.object({ currency: output }));
      target(sd, z.object({ currency: input }));
      sd.connect('source', 'target');
      expect(sd.validate().valid).toBe(expected);
    }
  });

  test('checks numeric bounds instead of accepting every number contract', () => {
    const sd = new SystemDesigner();
    source(sd, 'source', z.object({ quantity: z.number().min(0) }));
    target(sd, z.object({ quantity: z.number().min(1) }));
    sd.connect('source', 'target');
    expect(sd.validate().valid).toBe(false);
  });

  test('does not execute custom refinements or processing and reports unverified semantics', () => {
    let calls = 0;
    const sd = new SystemDesigner();
    source(
      sd,
      'source',
      z.object({
        quantity: z.number().refine(() => {
          calls++;
          return true;
        }),
      }),
    );
    target(sd, z.object({ quantity: z.number() }));
    sd.connect('source', 'target');
    expect(sd.validate().status).toBe('unverified');
    expect(calls).toBe(0);
  });

  test('unsupported transforms, coercion, patterns, and recursive schemas never silently pass', () => {
    const recursive: z.ZodType = z.lazy(() => z.object({ child: recursive }));
    for (const schema of [
      z.string().transform((value) => value.length),
      z.coerce.number(),
      z.string().regex(/hello/),
      recursive,
    ]) {
      const sd = new SystemDesigner();
      source(sd, 'source', z.object({ value: schema }));
      target(sd, z.object({ value: z.unknown() }));
      sd.connect('source', 'target');
      expect(sd.validate().valid).toBe(false);
    }
  });

  test('supports scalar contracts directly across a connection', () => {
    const sd = new SystemDesigner();
    source(sd, 'source', z.string());
    target(sd, z.string());
    sd.connect('source', 'target');
    expect(sd.validate().valid).toBe(true);
  });
});

describe('graph and host boundaries', () => {
  test('reports duplicate IDs and missing endpoints', () => {
    const sd = new SystemDesigner();
    source(sd, 'same', z.string());
    source(sd, 'same', z.string());
    sd.connect('same', 'missing');
    expect(sd.validate().issues.map((issue) => issue.code)).toEqual([
      'node-id',
      'missing-node',
    ]);
  });

  test('rejects malformed table content and unsafe image sources', () => {
    const sd = new SystemDesigner().add({
      id: 'node',
      name: 'Node',
      input: z.object({}),
      output: z.object({}),
      processing: 'Explain.',
      render: [
        { type: 'table', columns: ['One'], rows: [[1, 2]] },
        { type: 'image', src: 'javascript:alert(1)', alt: 'Unsafe' },
      ],
    });
    expect(sd.validate().issues.map((issue) => issue.code)).toEqual([
      'table-shape',
      'image-source',
    ]);
  });

  test('render reports a missing browser DOM instead of requiring a server', async () => {
    const result = await new SystemDesigner().render('graph');
    expect(result.status).toBe('error');
  });
});

describe('explicit field mappings', () => {
  test('selects one source without suppressing its schema checks', () => {
    const sd = new SystemDesigner();
    source(sd, 'order', z.object({ quantity: z.number() }));
    source(sd, 'warehouse', z.object({ quantity: z.number() }));
    target(sd, z.object({ quantity: z.number() }));
    sd.connect('order', 'target', {
      map: [{ from: ['quantity'], to: ['quantity'] }],
    });
    sd.connect('warehouse', 'target');
    expect(sd.validate().valid).toBe(true);
    expect(sd.validate().bindings[0]).toMatchObject({
      sourceNodeId: 'order',
      mode: 'explicit',
    });
  });

  test('maps a renamed nested subtree and allows a more specific field override', () => {
    const sd = new SystemDesigner();
    source(
      sd,
      'profile',
      z.object({
        profile: z.object({ name: z.string(), quantity: z.number() }),
      }),
    );
    source(sd, 'order', z.object({ amount: z.number() }));
    target(
      sd,
      z.object({
        customer: z.object({ name: z.string(), quantity: z.number() }),
      }),
    );
    sd.connect('profile', 'target', {
      map: [{ from: ['profile'], to: ['customer'] }],
    });
    sd.connect('order', 'target', {
      map: [{ from: ['amount'], to: ['customer', 'quantity'] }],
    });
    const result = sd.validate();
    expect(result.valid).toBe(true);
    expect(result.bindings).toHaveLength(2);
    expect(
      result.bindings.find(
        (binding) => binding.inputPath === '$["customer"]["quantity"]',
      )?.sourceNodeId,
    ).toBe('order');
  });

  test('an incompatible explicit choice cannot silently use another compatible source', () => {
    const sd = new SystemDesigner();
    source(sd, 'chosen', z.object({ quantity: z.string() }));
    source(sd, 'other', z.object({ quantity: z.number() }));
    target(sd, z.object({ quantity: z.number() }));
    sd.connect('chosen', 'target', {
      map: [{ from: ['quantity'], to: ['quantity'] }],
    }).connect('other', 'target');
    expect(sd.validate().valid).toBe(false);
    expect(sd.validate().bindings).toHaveLength(0);
    expect(sd.validate().issues[0]?.code).toBe('mapping-incompatible');
  });

  test('reports nonexistent source and destination paths', () => {
    const sd = new SystemDesigner();
    source(sd, 'source', z.object({ quantity: z.number() }));
    target(sd, z.object({ quantity: z.number() }));
    sd.connect('source', 'target', {
      map: [
        { from: ['missing'], to: ['quantity'] },
        { from: ['quantity'], to: ['typo'] },
      ],
    });
    expect(sd.validate().valid).toBe(false);
    expect(sd.validate().issues.map((issue) => issue.code)).toContain(
      'mapping-source',
    );
    expect(sd.validate().issues.map((issue) => issue.code)).toContain(
      'mapping-target',
    );
  });

  test('refuses competing explicit choices and preserves optionality guarantees', () => {
    const sd = new SystemDesigner();
    source(sd, 'one', z.object({ quantity: z.number() }));
    source(sd, 'two', z.object({ quantity: z.number() }));
    target(sd, z.object({ quantity: z.number() }));
    const map = [{ from: ['quantity'], to: ['quantity'] }];
    sd.connect('one', 'target', { map }).connect('two', 'target', { map });
    expect(sd.validate().issues[0]?.code).toBe('ambiguous-mapping');
    const optional = new SystemDesigner();
    source(optional, 'one', z.object({ quantity: z.number().optional() }));
    target(optional, z.object({ quantity: z.number() }));
    optional.connect('one', 'target', { map });
    expect(optional.validate().issues[0]?.code).toBe('mapping-incompatible');
  });

  test('ambiguities provide usable suggestions without changing graph state', () => {
    const sd = new SystemDesigner();
    source(sd, 'one', z.object({ nested: z.object({ quantity: z.number() }) }));
    source(sd, 'two', z.object({ other: z.object({ quantity: z.number() }) }));
    target(sd, z.object({ quantity: z.number() }));
    sd.connect('one', 'target').connect('two', 'target');
    const issue = sd.validate().issues[0];
    expect(issue?.suggestions).toHaveLength(2);
    expect(issue?.suggestions?.[0]?.mapping).toEqual({
      from: ['nested', 'quantity'],
      to: ['quantity'],
    });
    expect(
      sd
        .getGraph()
        .connections.every((connection) => connection.map === undefined),
    ).toBe(true);
  });
});

describe('wide input coverage', () => {
  test('resolves 500 separately connected nested fields with repeated leaf names', () => {
    const sd = new SystemDesigner();
    const shapes: Record<string, z.ZodType> = {};
    for (let index = 0; index < 500; index++) {
      const key = `input${index}`;
      const shape = z.object({ value: z.number() });
      shapes[key] = shape;
      source(sd, key, z.object({ [key]: shape }));
      sd.connect(key, 'target');
    }
    target(sd, z.object(shapes));
    const result = sd.validate();
    expect(result.valid).toBe(true);
    expect(result.bindings).toHaveLength(500);
    expect(
      new Set(result.bindings.map((binding) => binding.sourceNodeId)).size,
    ).toBe(500);
  });

  test('an unverified candidate is not silently discarded in favor of a compatible one', () => {
    const sd = new SystemDesigner();
    source(sd, 'known', z.object({ code: z.string() }));
    source(sd, 'uncertain', z.object({ code: z.string().regex(/^X/) }));
    target(sd, z.object({ code: z.string() }));
    sd.connect('known', 'target').connect('uncertain', 'target');
    expect(sd.validate().status).toBe('unverified');
    expect(sd.validate().bindings).toHaveLength(0);
  });
});
