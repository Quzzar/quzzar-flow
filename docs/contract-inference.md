# Contract inference

## What a connection means

A directed connection makes the source node’s declared output fields available to the destination. It does not assert that the entire output object is the destination input. Validation collects all incoming connections and resolves each destination field from their combined supply.

The resulting bindings describe a projection and assembly of input data. The package does not execute that assembly, call node functions, prove processing descriptions, or compare the meaning of business concepts. The graph is a specification and read-only visual aid.

## Field resolution

1. Match the full field path, independently of object property order.
2. When there is no exact-path candidate, match the same field name at another object depth.
3. Check that each possible source value fits the destination field’s schema. Required inputs require guaranteed fields, including every ancestor object.
4. Bind a unique compatible candidate. Report multiple candidates as ambiguous, incompatible candidates as mismatches, and unsupplied required fields as missing.

Extra upstream fields are allowed because bindings select only the requested fields. Optional inputs may remain unsupplied. Exact-path candidates take precedence even when a differently nested same-named field would fit; inference does not silently choose a different meaning to repair a mismatch. Scalar-to-scalar connections are supported directly.

Paths in results use bracket notation, such as `$["order"]["quantity"]`, to preserve keys containing dots. Arrays are matched as collections, with recursive item-contract checks. Values are not extracted from individual array elements or combined across array items.

Names are part of the contract. `quantity` and `priceCents` are not interchangeable because both are numbers. Arbitrary renaming, semantic equivalence, reshaping arrays, and user-authored field mappings are not implemented. Distinct nested paths with repeated names become ambiguous if there is no exact match.

## Supported comparisons

The checker converts Zod 4 contracts to JSON Schema in the correct input/output direction, then conservatively checks containment. It supports JSON primitives, objects, required/optional fields, arrays, enum/literal subsets, nullable and union field types, string/array length bounds, and basic numeric bounds. Object fields recurse; array elements recurse through their full schema.

The implementation is intentionally conservative. Some mathematically compatible contracts can be reported as invalid or unverified when a containment proof is outside this initial rule set. Root object unions are not decomposed into their common fields for inference. Exclusive numeric bounds are only proven when directly matched. Numeric/string literal values are not used to derive length/range bounds.

Custom refinements, overwrites, coercions, defaults, catch behavior, intersections, transforms, top-level undefined values, recursive schemas, and unsupported JSON Schema keywords cannot silently produce a valid result. Unrepresentable contracts produce explicit issues. Runtime schema conversion is handled by Zod; no processing text is executed. The Zod `_zod.def` inspection is isolated in `schema.ts` and guarded by regression tests; the peer range starts at the tested Zod 4.6 release.

## Results

- `valid`: all checked references and input bindings are proven compatible by the supported rules.
- `invalid`: at least one structural, required-field, ambiguity, content-shape, or type-compatibility error exists.
- `unverified`: no definite error was found, but one or more constraints need manual verification.

`valid` is true only in the first case. An invalid result may also contain unverified issues. `connectionsChecked` counts existing connections whose schemas could be described; use `issues` and `bindings` to assess actual coverage.

Sources use an empty object as their input contract. Disconnected nodes with required input fields are reported as missing inputs. Cycles are displayed without simulating execution or claiming termination. Basic layout is deterministic and prioritizes acyclic flows; dense cyclic graph layout remains an area for later work.
