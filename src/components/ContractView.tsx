import { ChevronRight } from 'lucide-react';
import type { JsonSchema } from '../lib/types';
import { schemaLabel } from '../lib/schema';
import * as s from '../styles/viewer.css';

type Schema = JsonSchema | boolean;
type Field = { name: string; schema: Schema; required?: boolean };

function childrenOf(schema: Schema): Field[] {
  if (typeof schema === 'boolean') return [];
  const required = new Set(schema.required ?? []);
  const fields: Field[] = Object.entries(schema.properties ?? {}).map(
    ([name, child]) => ({ name, schema: child, required: required.has(name) }),
  );
  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties === 'object'
  ) {
    fields.push({
      name: 'Additional fields',
      schema: schema.additionalProperties,
      required: false,
    });
  }
  const tuple =
    schema.prefixItems ??
    (Array.isArray(schema.items) ? schema.items : undefined);
  if (tuple)
    tuple.forEach((child, index) =>
      fields.push({ name: `Item ${index + 1}`, schema: child }),
    );
  else if (schema.items !== undefined && !Array.isArray(schema.items))
    fields.push({ name: 'Each item', schema: schema.items });
  for (const [key, label] of [
    ['anyOf', 'Option'],
    ['oneOf', 'Exclusive option'],
    ['allOf', 'Must satisfy'],
  ] as const) {
    schema[key]?.forEach((child, index) =>
      fields.push({
        name: `${label} ${index + 1}`,
        schema: child,
      }),
    );
  }
  if (schema.not !== undefined)
    fields.push({
      name: 'Must not match',
      schema: schema.not,
    });
  return fields;
}

function constraintsOf(schema: Schema): string[] {
  if (typeof schema === 'boolean') return [];
  const constraints: string[] = [];
  if (
    schema.minimum !== undefined &&
    schema.minimum !== Number.MIN_SAFE_INTEGER
  )
    constraints.push(`At least ${schema.minimum.toLocaleString('en-US')}`);
  if (
    schema.maximum !== undefined &&
    schema.maximum !== Number.MAX_SAFE_INTEGER
  )
    constraints.push(`At most ${schema.maximum.toLocaleString('en-US')}`);
  if (typeof schema.exclusiveMinimum === 'number')
    constraints.push(`Greater than ${schema.exclusiveMinimum}`);
  if (typeof schema.exclusiveMaximum === 'number')
    constraints.push(`Less than ${schema.exclusiveMaximum}`);
  if (schema.minLength !== undefined)
    constraints.push(`Min. ${schema.minLength} characters`);
  if (schema.maxLength !== undefined)
    constraints.push(`Max. ${schema.maxLength} characters`);
  if (schema.minItems !== undefined)
    constraints.push(`Min. ${schema.minItems} items`);
  if (schema.maxItems !== undefined)
    constraints.push(`Max. ${schema.maxItems} items`);
  if (schema.multipleOf !== undefined)
    constraints.push(`Multiple of ${schema.multipleOf}`);
  if (schema.format) constraints.push(`Format: ${schema.format}`);
  if (schema.pattern) constraints.push(`Pattern: ${schema.pattern}`);
  if (schema.uniqueItems) constraints.push('Unique items');
  if (schema.additionalProperties === false)
    constraints.push('No additional fields');
  if (schema.minProperties !== undefined)
    constraints.push(`Min. ${schema.minProperties} fields`);
  if (schema.maxProperties !== undefined)
    constraints.push(`Max. ${schema.maxProperties} fields`);
  if (schema.$ref) constraints.push(`Reference: ${schema.$ref}`);
  if (schema.default !== undefined)
    constraints.push(`Default: ${JSON.stringify(schema.default)}`);
  return constraints;
}

function SchemaField({
  field,
  depth,
  compact,
}: {
  field: Field;
  depth: number;
  compact: boolean;
}) {
  const children = childrenOf(field.schema);
  const constraints = compact ? [] : constraintsOf(field.schema);
  const description =
    typeof field.schema === 'object' ? field.schema.description : undefined;
  const heading = (
    <>
      <ChevronRight
        size={13}
        className={children.length ? s.schemaChevron : s.schemaLeafMarker}
      />
      <span className={s.schemaFieldName}>{field.name}</span>
      {field.required !== undefined && (
        <span className={s.schemaRequirement}>
          {field.required ? 'required' : 'optional'}
        </span>
      )}
      <span className={s.fieldType}>{schemaLabel(field.schema)}</span>
    </>
  );
  const notes = (
    <>
      {description && <p className={s.schemaDescription}>{description}</p>}
      {constraints.length > 0 && (
        <div className={s.schemaConstraints}>
          {constraints.map((constraint) => (
            <span key={constraint}>{constraint}</span>
          ))}
        </div>
      )}
    </>
  );
  return children.length ? (
    <details className={s.schemaBranch} open={!compact && depth === 0}>
      <summary
        className={s.schemaRow}
        aria-label={`${field.name}: ${schemaLabel(field.schema)}`}
      >
        {heading}
      </summary>
      {notes}
      <div className={s.schemaChildren}>
        {children.map((child, index) => (
          <SchemaField
            key={`${child.name}-${index}`}
            field={child}
            depth={depth + 1}
            compact={compact}
          />
        ))}
      </div>
    </details>
  ) : (
    <div className={s.schemaBranch}>
      <div className={s.schemaRow}>{heading}</div>
      {notes}
    </div>
  );
}

/** Expandable schema fields with readable types, requirements, and constraints. */
export function ContractView({
  schema,
  compact = false,
}: {
  schema: JsonSchema;
  compact?: boolean;
}) {
  const fields = childrenOf(schema);
  const rootConstraints = compact ? [] : constraintsOf(schema);
  return (
    <div className={`${s.schemaTree} nodrag nopan`}>
      {fields.length > 0 && schema.description && (
        <p className={s.schemaDescription}>{schema.description}</p>
      )}
      {rootConstraints.length > 0 && fields.length > 0 && (
        <div className={s.schemaConstraints}>
          {rootConstraints.map((constraint) => (
            <span key={constraint}>{constraint}</span>
          ))}
        </div>
      )}
      {fields.length ? (
        fields.map((field, index) => (
          <SchemaField
            key={`${field.name}-${index}`}
            field={field}
            depth={0}
            compact={compact}
          />
        ))
      ) : (
        <SchemaField
          field={{ name: schema.title ?? 'Value', schema }}
          depth={0}
          compact={compact}
        />
      )}
    </div>
  );
}
