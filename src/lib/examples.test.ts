import { describe, expect, test } from 'bun:test';
import { EXAMPLES } from '../../examples';

describe('public API examples', () => {
  for (const example of EXAMPLES) {
    test(`${example.id} has its intended validation result`, () => {
      const result = example.create().validate();
      if (example.id === 'stress-ambiguous') {
        expect(result.status).toBe('invalid');
        expect(result.issues).toHaveLength(3);
        expect(
          result.issues.every((issue) => issue.code === 'ambiguous-input'),
        ).toBe(true);
      } else if (example.id === 'invalid-contract') {
        expect(result.status).toBe('invalid');
        expect(result.issues.map((issue) => issue.code)).toEqual([
          'ambiguous-input',
          'missing-input',
        ]);
      } else {
        expect(result.issues).toEqual([]);
        expect(result.valid).toBe(true);
        if (example.id === 'database-design') {
          expect(result.bindings).toEqual([]);
          expect(result.connectionsChecked).toBe(0);
          expect(example.create().getGraph().relationships).toHaveLength(6);
        } else expect(result.bindings.length).toBeGreaterThan(0);
      }
    });
  }
});
