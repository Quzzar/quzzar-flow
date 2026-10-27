# Contract inference

## What a connection means

A directed connection makes the source node’s declared output fields available to the destination. It does not assert that the entire output object is the destination input. Validation collects all incoming connections and resolves each destination field from their combined supply.

The resulting bindings describe a projection and assembly of input data. The package does not execute that assembly, call node functions, prove processing descriptions, or compare the meaning of business concepts. The graph is a specification and read-only visual aid.

## Field resolution

1. Honor explicit connection mappings. A more specific destination path overrides a broader subtree mapping; equally specific competing choices are errors.
2. For unmapped inputs, match the full field path, independently of object property order.
3. When there is no exact-path candidate, match the same field name at another object depth.
4. Check that each possible source value fits the destination field’s schema. Required inputs require guaranteed fields, including every ancestor object.
5. Bind a unique compatible candidate. Report multiple candidates as ambiguous, incompatible candidates as mismatches, and unsupplied required fields as missing. A potentially compatible but unverified alternative cannot silently be ignored.

Extra upstream fields are allowed because bindings select only the requested fields. Optional inputs may remain unsupplied. Exact-path candidates take precedence even when a differently nested same-named field would fit; inference does not silently choose a different meaning to repair a mismatch. Scalar-to-scalar connections are supported directly.

Paths in results use bracket notation, such as `$["order"]["quantity"]`, to preserve keys containing dots. Arrays are matched as collections, with recursive item-contract checks. Values are not extracted from individual array elements or combined across array items.

Names are part of the contract. `quantity` and `priceCents` are not interchangeable because both are numbers. Automatic arbitrary renaming, semantic equivalence, and reshaping arrays are not implemented. Renaming requires an explicit mapping. Distinct nested paths with repeated names become ambiguous if there is no exact match.

## Explicit mappings

Set `map` on an existing connection declaration to select the intended source:

```ts
sd.connect('order', 'total', {
  map: [{ from: ['quantity'], to: ['quantity'] }],
});
sd.connect('warehouse', 'total');
```

The mapping chooses `order.quantity` even though `warehouse.quantity` has the same type. Other fields continue to infer normally. Paths are arrays of literal object keys, so `['customer.id']` names a single key while `['customer', 'id']` names a nested path. Use `[]` for the root value.

A subtree mapping such as `{ from: ['profile'], to: ['customer'] }` applies to all destination leaf fields below `customer`. A more specific mapping to `['customer', 'quantity']` can override that one field. Individual array elements are not addressable; map an array as a complete collection.

Explicit mappings are checked, not trusted. Missing source/destination paths, incompatible types, optional sources for required fields, and equally specific competing mappings are errors. An invalid explicit choice does not silently use an automatically inferred alternative. Each successful binding records `mode: 'explicit'` or `mode: 'inferred'`.

Ambiguous-input issues include structured `suggestions` containing a connection ID, source node, and proposed `FieldMapping`. The inspector shows read-only snippets for updating the corresponding existing connection. Resolving ambiguity happens in the authored graph definition, not by editing the displayed graph.

## Supported comparisons

The checker converts Zod 4 contracts to JSON Schema in the correct input/output direction, then conservatively checks containment. It supports JSON primitives, objects, required/optional fields, arrays, enum/literal subsets, nullable and union field types, string/array length bounds, and basic numeric bounds. Object fields recurse; array elements recurse through their full schema.

The implementation is intentionally conservative. Some mathematically compatible contracts can be reported as invalid or unverified when a containment proof is outside this initial rule set. Root object unions are not decomposed into their common fields for inference. Exclusive numeric bounds are only proven when directly matched. Numeric/string literal values are not used to derive length/range bounds.

Custom refinements, overwrites, coercions, defaults, catch behavior, intersections, transforms, top-level undefined values, recursive schemas, and unsupported JSON Schema keywords cannot silently produce a valid result. Unrepresentable contracts produce explicit issues. Runtime schema conversion is handled by Zod; no processing text is executed. The Zod `_zod.def` inspection is isolated in `schema.ts` and guarded by regression tests; the peer range starts at the tested Zod 4.6 release.

## Results

- `valid`: all checked references and input bindings are proven compatible by the supported rules.
- `invalid`: at least one structural, required-field, ambiguity, content-shape, or type-compatibility error exists.
- `unverified`: no definite error was found, but one or more constraints need manual verification.

`valid` is true only in the first case. An invalid result may also contain unverified issues. `connectionsChecked` counts existing connections whose schemas could be described; use `issues` and `bindings` to assess actual coverage.

Sources use an empty object as their input contract. Disconnected nodes with required input fields are reported as missing inputs. Cycles are displayed without simulating execution or claiming termination. Layout is deterministic and prioritizes acyclic flows. Wide layers are packed into columns of at most eight rows, and long edges use bypass lanes. The current stress fixture covers 48 sources and 144 required fan-in fields, with ambiguous and explicitly mapped variants. Dense cyclic layouts and arbitrary-size edge routing remain areas for later work.
