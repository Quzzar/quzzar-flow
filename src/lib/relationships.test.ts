import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { SystemDesigner } from './system-designer';
import { validateGraph } from './validate';

describe('structural relationships', () => {
  function fixture() {
    const sd = new SystemDesigner();
    sd.add({
      id: 'users',
      name: 'Users',
      input: z.object({}),
      output: z.object({ id: z.string() }),
      processing: 'Row schema.',
    });
    sd.add({
      id: 'tasks',
      name: 'Tasks',
      input: z.object({ userId: z.string() }),
      output: z.object({ userId: z.string() }),
      processing: 'Row schema.',
    });
    return sd;
  }
  test('relationships never supply required inputs or increment connection coverage', () => {
    const sd = fixture().relate('users', 'tasks', {
      cardinality: 'one-to-many',
      sourceKey: ['id'],
      targetKey: ['userId'],
    });
    const result = sd.validate();
    expect(result.issues.map((issue) => issue.code)).toEqual(['missing-input']);
    expect(result.bindings).toEqual([]);
    expect(result.connectionsChecked).toBe(0);
  });
  test('validates endpoints, declared keys, paired key paths, and runtime cardinality', () => {
    const sd = fixture();
    sd.relate('unknown', 'tasks', { cardinality: 'many-to-one' });
    sd.relate('users', 'tasks', {
      cardinality: 'one-to-many',
      sourceKey: ['missing'],
      targetKey: ['userId'],
    });
    sd.relate('users', 'tasks', {
      cardinality: 'one-to-one',
      sourceKey: ['id'],
    });
    const graph = sd.getGraph();
    const relationship = graph.relationships?.[0];
    if (!relationship) throw new Error('Missing fixture relationship');
    Object.assign(relationship, { cardinality: 'invalid' });
    expect(validateGraph(graph).issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'relationship-node',
        'relationship-key',
        'relationship-cardinality',
      ]),
    );
  });
  test('captures key paths by value when authored and when snapshots are returned', () => {
    const sourceKey = ['id'];
    const sd = fixture().relate('users', 'tasks', {
      cardinality: 'one-to-many',
      sourceKey,
      targetKey: ['userId'],
    });
    sourceKey.push('bad');
    sd.getGraph().relationships?.[0]?.sourceKey?.push('also bad');
    expect(sd.getGraph().relationships?.[0]?.sourceKey).toEqual(['id']);
  });
});
