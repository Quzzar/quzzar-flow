import { z } from 'zod';
import type { JsonSchema } from './types';

export type SchemaDescription =
  | { status: 'success'; schema: JsonSchema; warnings: string[] }
  | { status: 'error'; message: string };

/** Convert contracts without replacing unrepresentable Zod types with `any`. */
export function describeSchema(
  schema: z.ZodType,
  io: 'input' | 'output',
): SchemaDescription {
  const warnings = new Set<string>();
  try {
    const json = z.toJSONSchema(schema, {
      io,
      cycles: 'throw',
      reused: 'inline',
      unrepresentable: 'throw',
      override: ({ zodSchema }) => {
        const definition = zodSchema._zod.def;
        if (
          [
            'pipe',
            'transform',
            'catch',
            'default',
            'prefault',
            'custom',
            'intersection',
            'success',
          ].includes(definition.type)
        ) {
          warnings.add(
            `${definition.type} semantics require manual verification.`,
          );
        }
        if ('coerce' in definition && definition.coerce) {
          warnings.add('Coercion requires manual verification.');
        }
        if (
          definition.checks?.some(
            (check) =>
              check._zod.def.check === 'custom' ||
              check._zod.def.check === 'overwrite',
          )
        ) {
          warnings.add(
            'Custom refinements or overwrites require manual verification.',
          );
        }
      },
    });
    // Zod 4.6 attaches a Standard Schema adapter to the returned object.
    // It is runtime metadata, not part of the JSON Schema contract.
    const jsonSchema: JsonSchema = { ...json };
    delete jsonSchema['~standard'];
    if (schema._zod.def.type === 'optional') {
      warnings.add('Top-level undefined values require manual verification.');
    }
    return { status: 'success', schema: jsonSchema, warnings: [...warnings] };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Readable contract label for node summaries. Full contracts remain inspectable. */
export function schemaLabel(schema: JsonSchema | boolean): string {
  if (schema === false) return 'never';
  if (schema === true) return 'unknown';
  if (schema.const !== undefined) return JSON.stringify(schema.const);
  if (schema.enum)
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  if (schema.anyOf) return schema.anyOf.map(schemaLabel).join(' | ');
  if (Array.isArray(schema.type)) return schema.type.join(' | ');
  if (schema.type === 'array') {
    const item = schema.items;
    return `${item !== undefined && !Array.isArray(item) ? schemaLabel(item) : 'unknown'}[]`;
  }
  return schema.type ?? 'unknown';
}
