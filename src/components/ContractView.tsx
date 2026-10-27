import type { JsonSchema } from '../lib/types';
import { schemaLabel } from '../lib/schema';
import * as s from '../styles/viewer.css';

/** Compact field list with the complete JSON Schema available below it. */
export function ContractView({
  schema,
  compact = false,
}: {
  schema: JsonSchema;
  compact?: boolean;
}) {
  const required = new Set(schema.required ?? []);
  const entries = Object.entries(schema.properties ?? {});
  return (
    <>
      {entries.length > 0 ? (
        entries.map(([key, value]) => (
          <div key={key} className={s.contractField}>
            <span>
              {key}
              {!required.has(key) && <span className={s.optional}>?</span>}
            </span>
            <span className={s.fieldType}>{schemaLabel(value)}</span>
          </div>
        ))
      ) : (
        <code className={s.code}>{schemaLabel(schema)}</code>
      )}
      {!compact && (
        <details className={s.details}>
          <summary className={s.muted}>Full JSON Schema</summary>
          <pre className={s.code}>{JSON.stringify(schema, null, 2)}</pre>
        </details>
      )}
    </>
  );
}
