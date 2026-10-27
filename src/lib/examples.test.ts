import { describe, expect, test } from 'bun:test';
import { EXAMPLES } from '../../examples';

describe('public API examples', () => {
  for (const example of EXAMPLES) {
    test(`${example.id} has its intended validation result`, () => {
      const result = example.create().validate();
      if (example.id === 'invalid-contract') {
        expect(result.status).toBe('invalid');
        expect(result.issues.map((issue) => issue.code)).toEqual([
          'ambiguous-input',
          'missing-input',
        ]);
      } else {
        expect(result.issues).toEqual([]);
        expect(result.valid).toBe(true);
        expect(result.bindings.length).toBeGreaterThan(0);
      }
    });
  }
});
