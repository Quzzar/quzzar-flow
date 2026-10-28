import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { SystemDesigner } from './system-designer';
import { groupAppearance } from './group-colors';
import { layoutGroupedGraph } from './group-layout';
import { createGroupedSystemExample } from '../../examples/grouped-system';

describe('node groups', () => {
  test('visual membership preserves inference across frontend/backend/database boundaries', () => {
    const sd = createGroupedSystemExample();
    expect(sd.getGraph().groups).toHaveLength(3);
    expect(sd.validate().valid).toBe(true);
    expect(sd.validate().connectionsChecked).toBe(5);
    expect(
      sd
        .validate()
        .bindings.find(
          (binding) =>
            binding.nodeId === 'calculate' &&
            binding.inputPath === '$["priceCents"]',
        )?.sourceNodeId,
    ).toBe('catalog');
  });

  test('unknown groups, duplicate IDs, node/group collisions, and invalid colors are explicit errors', () => {
    const sd = new SystemDesigner();
    sd.addGroup({ id: 'same', name: 'One' }).addGroup({
      id: 'same',
      name: 'Two',
      color: '#oops',
    });
    sd.add({
      id: 'same',
      name: 'Node',
      group: 'missing',
      input: z.object({}),
      output: z.object({}),
      processing: 'Explain.',
    });
    const result = sd.validate();
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('group-id');
    expect(result.issues.map((issue) => issue.code)).toContain('missing-group');
    expect(result.issues.map((issue) => issue.code)).toContain('group-color');
  });

  test('palette and custom colors yield shaded surfaces without accepting arbitrary CSS', () => {
    expect(groupAppearance('blue').status).toBe('success');
    expect(groupAppearance('#aabbcc')).toMatchObject({
      status: 'success',
      fill: 'rgba(170, 187, 204, 0.07)',
    });
    expect(groupAppearance('#invalid').status).toBe('error');
  });

  test('measured child heights enlarge containers and move following members below them', () => {
    const sd = new SystemDesigner().addGroup({
      id: 'frontend',
      name: 'Frontend',
    });
    for (const id of ['first', 'second'])
      sd.add({
        id,
        name: id,
        group: 'frontend',
        input: z.object({}),
        output: z.object({}),
        processing: 'Explain.',
      });
    const layout = layoutGroupedGraph(
      sd.getGraph(),
      new Map([
        ['first', { width: 248, height: 680 }],
        ['second', { width: 248, height: 280 }],
      ]),
    );
    const first = layout.positions.get('first');
    const second = layout.positions.get('second');
    const group = layout.containers.get('frontend');
    if (!first || !second || !group) throw new Error('Expected group layout.');
    expect(first.y + 680).toBeLessThan(second.y);
    expect(second.y + 280).toBeLessThan(group.y + group.height);
    expect(first.x).toBeGreaterThan(group.x);
    expect(first.x + 248).toBeLessThan(group.x + group.width);
  });

  test('group snapshots do not expose the instance’s stored metadata', () => {
    const sd = new SystemDesigner().addGroup({ id: 'one', name: 'Original' });
    const snapshot = sd.getGraph();
    const group = snapshot.groups?.[0];
    if (group) group.name = 'Changed';
    expect(sd.getGraph().groups?.[0]?.name).toBe('Original');
  });
});

describe('nested containment', () => {
  test('orders parents before children and encloses descendants with measured sizes', () => {
    const sd = new SystemDesigner();
    sd.addGroup({ id: 'leaf', parent: 'middle', name: 'Leaf' });
    sd.addGroup({ id: 'root', name: 'Root' });
    sd.addGroup({ id: 'middle', parent: 'root', name: 'Middle' });
    sd.add({
      id: 'large',
      name: 'Large',
      group: 'leaf',
      input: z.object({}),
      output: z.object({}),
      processing: 'Describe.',
    });
    expect(sd.validate().valid).toBe(true);
    const layout = layoutGroupedGraph(
      sd.getGraph(),
      new Map([['large', { width: 248, height: 900 }]]),
    );
    expect([...layout.containers.keys()]).toEqual(['root', 'middle', 'leaf']);
    for (const [childId, parentId] of layout.parents) {
      const child = layout.containers.get(childId)!;
      const parent = layout.containers.get(parentId)!;
      expect(child.x).toBeGreaterThan(parent.x);
      expect(child.y).toBeGreaterThan(parent.y);
      expect(child.x + child.width).toBeLessThan(parent.x + parent.width);
      expect(child.y + child.height).toBeLessThan(parent.y + parent.height);
    }
  });
  test('cycles, self-parenting, and missing ancestry fail validation without hanging layout', () => {
    const sd = new SystemDesigner();
    sd.addGroup({ id: 'a', parent: 'b', name: 'A' });
    sd.addGroup({ id: 'b', parent: 'a', name: 'B' });
    sd.addGroup({ id: 'self', parent: 'self', name: 'Self' });
    sd.addGroup({ id: 'missing', parent: 'unknown', name: 'Missing' });
    expect(
      sd.validate().issues.filter((issue) => issue.code === 'group-parent'),
    ).toHaveLength(4);
    expect(layoutGroupedGraph(sd.getGraph(), new Map()).containers.size).toBe(
      4,
    );
  });
});
