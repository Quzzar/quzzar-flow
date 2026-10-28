import { describeSchema } from './schema';
import { groupParents } from './group-layout';
import { groupAppearance } from './group-colors';
import type {
  DesignerGraph,
  InputBinding,
  JsonSchema,
  ValidationIssue,
  ValidationResult,
} from './types';

type Difference = {
  kind: 'error' | 'unverified';
  path: string;
  message: string;
};
type Schema = JsonSchema | boolean;

const SUPPORTED_KEYS = new Set([
  '$schema',
  'title',
  'description',
  'examples',
  'deprecated',
  'readOnly',
  'writeOnly',
  'type',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'anyOf',
  'enum',
  'const',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
]);

function difference(
  kind: Difference['kind'],
  path: string,
  message: string,
): Difference[] {
  return [{ kind, path, message }];
}

function branches(schema: JsonSchema): JsonSchema[] | undefined {
  if (schema.anyOf) {
    const { anyOf, ...base } = schema;
    return anyOf.map((part) => ({ ...base, ...part }));
  }
  if (Array.isArray(schema.type))
    return schema.type.map((type) => ({ ...schema, type }));
  return undefined;
}

/** A conservative containment check: every possible source value must fit the target. */
function compare(source: Schema, target: Schema, path: string): Difference[] {
  if (source === false || target === true) return [];
  if (target === false)
    return difference('error', path, 'The destination accepts no values.');
  if (source === true)
    return difference(
      'unverified',
      path,
      'The source has an unconstrained contract.',
    );

  const unsupported = [...Object.keys(source), ...Object.keys(target)].find(
    (key) => !SUPPORTED_KEYS.has(key),
  );
  if (unsupported)
    return difference(
      'unverified',
      path,
      `Cannot prove compatibility for JSON Schema keyword “${unsupported}”.`,
    );

  const sourceBranches = branches(source);
  if (sourceBranches)
    return sourceBranches.flatMap((branch) => compare(branch, target, path));
  const targetBranches = branches(target);
  if (targetBranches) {
    const alternatives = targetBranches.map((branch) =>
      compare(source, branch, path),
    );
    if (alternatives.some((issues) => issues.length === 0)) return [];
    return difference(
      alternatives.some((issues) =>
        issues.some((issue) => issue.kind === 'unverified'),
      )
        ? 'unverified'
        : 'error',
      path,
      'The source is not contained in a destination union branch.',
    );
  }

  const targetValues =
    target.enum ?? (target.const !== undefined ? [target.const] : undefined);
  const sourceValues =
    source.enum ?? (source.const !== undefined ? [source.const] : undefined);
  if (
    targetValues &&
    (!sourceValues ||
      sourceValues.some((value) => !targetValues.includes(value)))
  ) {
    return difference(
      'error',
      path,
      'The source can produce values outside the destination’s allowed values.',
    );
  }

  if (
    target.type &&
    source.type !== target.type &&
    !(source.type === 'integer' && target.type === 'number')
  ) {
    return difference(
      source.type ? 'error' : 'unverified',
      path,
      `Expected ${String(target.type)}; source provides ${String(source.type ?? 'an unconstrained value')}.`,
    );
  }

  const issues: Difference[] = [];
  if (target.type === 'object') {
    const sourceProperties = source.properties ?? {};
    const sourceRequired = new Set(source.required ?? []);
    const targetRequired = new Set(target.required ?? []);
    for (const [key, targetProperty] of Object.entries(
      target.properties ?? {},
    )) {
      const fieldPath = `${path}.${key}`;
      if (targetRequired.has(key) && !sourceRequired.has(key)) {
        issues.push({
          kind: 'error',
          path: fieldPath,
          message: 'Required input field is missing or optional in the output.',
        });
      }
      const sourceProperty =
        sourceProperties[key] ?? source.additionalProperties ?? true;
      if (sourceProperty !== false)
        issues.push(...compare(sourceProperty, targetProperty, fieldPath));
    }
    for (const [key, sourceProperty] of Object.entries(sourceProperties)) {
      if (Object.hasOwn(target.properties ?? {}, key)) continue;
      if (target.additionalProperties === false)
        issues.push({
          kind: 'error',
          path: `${path}.${key}`,
          message: 'The strict destination rejects this extra output field.',
        });
      else if (target.additionalProperties !== undefined)
        issues.push(
          ...compare(
            sourceProperty,
            target.additionalProperties,
            `${path}.${key}`,
          ),
        );
    }
    if (
      source.additionalProperties !== false &&
      target.additionalProperties !== undefined &&
      target.additionalProperties !== true
    ) {
      issues.push(
        ...compare(
          source.additionalProperties ?? true,
          target.additionalProperties,
          `${path}.*`,
        ),
      );
    }
  }

  if (target.type === 'array' && target.items !== undefined) {
    if (Array.isArray(source.items) || Array.isArray(target.items)) {
      issues.push({
        kind: 'unverified',
        path,
        message: 'Tuple item compatibility requires manual verification.',
      });
    } else {
      issues.push(...compare(source.items ?? true, target.items, `${path}[]`));
    }
  }

  for (const [minimum, maximum] of [
    ['minLength', 'maxLength'],
    ['minItems', 'maxItems'],
    ['minimum', 'maximum'],
  ] as const) {
    if (
      target[minimum] !== undefined &&
      (source[minimum] === undefined || source[minimum] < target[minimum])
    ) {
      issues.push({
        kind: 'error',
        path,
        message: `Output does not guarantee the input’s ${minimum} of ${target[minimum]}.`,
      });
    }
    if (
      target[maximum] !== undefined &&
      (source[maximum] === undefined || source[maximum] > target[maximum])
    ) {
      issues.push({
        kind: 'error',
        path,
        message: `Output does not guarantee the input’s ${maximum} of ${target[maximum]}.`,
      });
    }
  }
  for (const key of ['exclusiveMinimum', 'exclusiveMaximum'] as const) {
    if (target[key] !== undefined && source[key] !== target[key]) {
      issues.push({
        kind: 'unverified',
        path,
        message: `Exclusive numeric bound “${key}” differs; verify manually.`,
      });
    }
  }
  return issues;
}

type Field = { segments: string[]; schema: Schema; required: boolean };
const fieldPath = (segments: string[]) =>
  segments.reduce(
    (path, segment) => `${path}[${JSON.stringify(segment)}]`,
    '$',
  );

/** Objects expose named fields recursively; arrays remain a single typed collection. */
function fields(
  schema: Schema,
  source: boolean,
  segments: string[] = [],
  required = true,
): Field[] {
  if (
    typeof schema === 'boolean' ||
    schema.type !== 'object' ||
    !schema.properties ||
    Object.keys(schema.properties).length === 0
  ) {
    return [{ segments, schema, required }];
  }
  const requiredKeys = new Set(schema.required ?? []);
  const children = Object.entries(schema.properties).flatMap(
    ([key, property]) =>
      fields(
        property,
        source,
        [...segments, key],
        required && requiredKeys.has(key),
      ),
  );
  return source ? [{ segments, schema, required }, ...children] : children;
}

/** Validate graph references and directed contract compatibility without running node logic. */
export function validateGraph(graph: DesignerGraph): ValidationResult {
  const issues: ValidationIssue[] = [];
  const groups = new Set<string>();
  for (const group of graph.groups ?? []) {
    if (
      !group.id.trim() ||
      groups.has(group.id) ||
      graph.nodes.some((node) => node.id === group.id)
    )
      issues.push({
        kind: 'error',
        code: 'group-id',
        groupId: group.id,
        path: '$.groups',
        message:
          'Group IDs must be nonempty, unique, and distinct from node IDs.',
      });
    groups.add(group.id);
    const appearance = groupAppearance(group.color);
    if (appearance.status === 'error')
      issues.push({
        kind: 'error',
        code: 'group-color',
        groupId: group.id,
        path: '$.color',
        message: appearance.message,
      });
  }
  const parents = groupParents(graph);
  for (const group of graph.groups ?? []) {
    if (group.parent !== undefined && !parents.has(group.id))
      issues.push({
        kind: 'error',
        code: 'group-parent',
        groupId: group.id,
        path: '$.parent',
        message:
          'Group parent must exist and its ancestry must not contain a cycle.',
      });
  }
  const nodes = new Map<string, DesignerGraph['nodes'][number]>();
  const contracts = new Map<
    string,
    {
      input: ReturnType<typeof describeSchema>;
      output: ReturnType<typeof describeSchema>;
    }
  >();

  for (const node of graph.nodes) {
    if (node.group !== undefined && !groups.has(node.group))
      issues.push({
        kind: 'error',
        code: 'missing-group',
        nodeId: node.id,
        path: '$.group',
        message: `Group “${node.group}” does not exist.`,
      });
    if (!node.id.trim() || nodes.has(node.id)) {
      issues.push({
        kind: 'error',
        code: 'node-id',
        nodeId: node.id,
        path: '$',
        message: 'Node IDs must be nonempty and unique.',
      });
    }
    nodes.set(node.id, node);
    const descriptions = {
      input: describeSchema(node.input, 'input'),
      output: describeSchema(node.output, 'output'),
    };
    contracts.set(node.id, descriptions);
    for (const [direction, description] of Object.entries(descriptions)) {
      const messages =
        description.status === 'error'
          ? [description.message]
          : description.warnings;
      for (const message of messages)
        issues.push({
          kind: 'unverified',
          code: 'unsupported-schema',
          nodeId: node.id,
          path: `$.${direction}`,
          message,
        });
    }
    for (const block of node.render ?? []) {
      if (
        block.type === 'table' &&
        block.rows.some((row) => row.length !== block.columns.length)
      ) {
        issues.push({
          kind: 'error',
          code: 'table-shape',
          nodeId: node.id,
          path: '$.render',
          message: 'Each table row must match the column count.',
        });
      }
      if (
        block.type === 'image' &&
        !/^(https?:\/\/|\/[^/]|\.\.?\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(
          block.src,
        )
      ) {
        issues.push({
          kind: 'error',
          code: 'image-source',
          nodeId: node.id,
          path: '$.render',
          message:
            'Use an HTTP(S) image, a local path, or a raster image data URL.',
        });
      }
    }
  }

  const seenConnections = new Set<string>();
  let connectionsChecked = 0;
  for (const connection of graph.connections) {
    if (seenConnections.has(connection.id))
      issues.push({
        kind: 'error',
        code: 'connection-id',
        connectionId: connection.id,
        path: '$',
        message: 'Connection IDs must be unique.',
      });
    seenConnections.add(connection.id);
    const source = contracts.get(connection.source);
    const target = contracts.get(connection.target);
    if (!source || !target) {
      issues.push({
        kind: 'error',
        code: 'missing-node',
        connectionId: connection.id,
        path: '$',
        message: `Connection references missing node “${!source ? connection.source : connection.target}”.`,
      });
      continue;
    }
    if (source.output.status !== 'success' || target.input.status !== 'success')
      continue;
    connectionsChecked++;
    const supplied = fields(source.output.schema, true);
    const accepted = fields(target.input.schema, true);
    for (const mapping of connection.map ?? []) {
      if (
        !supplied.some(
          (field) =>
            JSON.stringify(field.segments) === JSON.stringify(mapping.from),
        )
      ) {
        issues.push({
          kind: 'error',
          code: 'mapping-source',
          connectionId: connection.id,
          path: fieldPath(mapping.from),
          message: 'The explicitly mapped output path does not exist.',
        });
      }
      if (
        !accepted.some(
          (field) =>
            JSON.stringify(field.segments) === JSON.stringify(mapping.to),
        )
      ) {
        issues.push({
          kind: 'error',
          code: 'mapping-target',
          connectionId: connection.id,
          path: fieldPath(mapping.to),
          message: 'The explicitly mapped input path does not exist.',
        });
      }
    }
  }

  const bindings: InputBinding[] = [];
  for (const node of graph.nodes) {
    const target = contracts.get(node.id)?.input;
    if (!target || target.status !== 'success') continue;
    const incoming = graph.connections.filter(
      (connection) => connection.target === node.id,
    );
    const candidates = incoming.flatMap((connection) => {
      const source = contracts.get(connection.source)?.output;
      if (!source || source.status !== 'success') return [];
      return fields(source.schema, true).map((field) => ({
        ...field,
        connection,
      }));
    });
    const byPath = new Map<string, typeof candidates>();
    const byName = new Map<string, typeof candidates>();
    for (const candidate of candidates) {
      const key = JSON.stringify(candidate.segments);
      const pathCandidates = byPath.get(key);
      if (pathCandidates) pathCandidates.push(candidate);
      else byPath.set(key, [candidate]);
      const name = candidate.segments.at(-1);
      if (name !== undefined) {
        const namedCandidates = byName.get(name);
        if (namedCandidates) namedCandidates.push(candidate);
        else byName.set(name, [candidate]);
      }
    }
    for (const field of fields(target.schema, false)) {
      if (
        typeof field.schema !== 'boolean' &&
        field.schema.type === 'object' &&
        !Object.keys(field.schema.properties ?? {}).length
      )
        continue;
      const overrides = incoming.flatMap((connection) =>
        (connection.map ?? [])
          .filter(
            (mapping) =>
              mapping.to.length <= field.segments.length &&
              mapping.to.every((part, index) => field.segments[index] === part),
          )
          .map((mapping) => ({ connection, mapping })),
      );
      if (overrides.length) {
        const specificity = Math.max(
          ...overrides.map(({ mapping }) => mapping.to.length),
        );
        const preferred = overrides.filter(
          ({ mapping }) => mapping.to.length === specificity,
        );
        if (preferred.length > 1) {
          issues.push({
            kind: 'error',
            code: 'ambiguous-mapping',
            nodeId: node.id,
            path: fieldPath(field.segments),
            message:
              'More than one explicit mapping selects this input. Keep one mapping at this specificity.',
          });
          continue;
        }
        const choice = preferred[0];
        if (!choice) continue;
        const outputSegments = [
          ...choice.mapping.from,
          ...field.segments.slice(choice.mapping.to.length),
        ];
        const candidate = byPath
          .get(JSON.stringify(outputSegments))
          ?.find((item) => item.connection.id === choice.connection.id);
        if (!candidate) {
          if (field.required)
            issues.push({
              kind: 'error',
              code: 'mapping-source',
              nodeId: node.id,
              connectionId: choice.connection.id,
              path: fieldPath(field.segments),
              message: `The chosen source does not supply ${fieldPath(outputSegments)}.`,
            });
          continue;
        }
        const differences = compare(
          candidate.schema,
          field.schema,
          fieldPath(field.segments),
        );
        if (field.required && !candidate.required)
          differences.push({
            kind: 'error',
            path: fieldPath(field.segments),
            message:
              'The chosen output field is optional and cannot guarantee this input.',
          });
        if (differences.length)
          issues.push(
            ...differences.map((issue) => ({
              ...issue,
              code: 'mapping-incompatible',
              nodeId: node.id,
              connectionId: choice.connection.id,
            })),
          );
        else
          bindings.push({
            nodeId: node.id,
            inputPath: fieldPath(field.segments),
            connectionId: choice.connection.id,
            sourceNodeId: choice.connection.source,
            outputPath: fieldPath(outputSegments),
            mode: 'explicit',
          });
        continue;
      }
      const exact = byPath.get(JSON.stringify(field.segments)) ?? [];
      const name = field.segments.at(-1);
      const sameName = name === undefined ? [] : (byName.get(name) ?? []);
      const matches = exact.length > 0 ? exact : sameName;
      const assessed = matches.map((candidate) => ({
        candidate,
        differences: compare(
          candidate.schema,
          field.schema,
          fieldPath(field.segments),
        ),
      }));
      const compatible = assessed.filter(
        ({ candidate, differences }) =>
          differences.length === 0 && (!field.required || candidate.required),
      );
      if (compatible.length === 1) {
        const uncertain = assessed.some(
          ({ candidate, differences }) =>
            (!field.required || candidate.required) &&
            differences.some((issue) => issue.kind === 'unverified') &&
            !differences.some((issue) => issue.kind === 'error'),
        );
        if (uncertain) {
          issues.push({
            kind: 'unverified',
            code: 'unverified-input',
            nodeId: node.id,
            path: fieldPath(field.segments),
            message:
              'Another candidate cannot be ruled out. Use an explicit field mapping to select the intended source.',
          });
          continue;
        }
        const match = compatible[0];
        if (match)
          bindings.push({
            nodeId: node.id,
            inputPath: fieldPath(field.segments),
            connectionId: match.candidate.connection.id,
            sourceNodeId: match.candidate.connection.source,
            outputPath: fieldPath(match.candidate.segments),
            mode: 'inferred',
          });
      } else if (compatible.length > 1) {
        issues.push({
          kind: 'error',
          code: 'ambiguous-input',
          nodeId: node.id,
          path: fieldPath(field.segments),
          message: `Multiple connected outputs can supply this field: ${compatible.map(({ candidate }) => `${candidate.connection.source}${fieldPath(candidate.segments).slice(1)}`).join(', ')}.`,
          suggestions: compatible.map(({ candidate }) => ({
            connectionId: candidate.connection.id,
            sourceNodeId: candidate.connection.source,
            mapping: { from: [...candidate.segments], to: [...field.segments] },
          })),
        });
      } else if (matches.length > 0) {
        const unverified = assessed.some(({ differences }) =>
          differences.some((issue) => issue.kind === 'unverified'),
        );
        issues.push({
          kind: unverified ? 'unverified' : 'error',
          code: 'incompatible-input',
          nodeId: node.id,
          path: fieldPath(field.segments),
          message: assessed
            .flatMap(({ candidate, differences }) =>
              differences.length
                ? differences.map((issue) => issue.message)
                : [
                    `${candidate.connection.source} does not guarantee this required field.`,
                  ],
            )
            .join(' '),
        });
      } else if (field.required) {
        issues.push({
          kind: 'error',
          code: 'missing-input',
          nodeId: node.id,
          path: fieldPath(field.segments),
          message:
            'No connected output guarantees a compatible field with this name.',
        });
      }
    }
  }
  const status = issues.some((issue) => issue.kind === 'error')
    ? 'invalid'
    : issues.length
      ? 'unverified'
      : 'valid';
  return {
    status,
    valid: status === 'valid',
    issues,
    connectionsChecked,
    bindings,
  };
}
