# Quzzar System Designer

Describe a system in code. Inspect its contracts in a read-only React Flow viewer.

Each node has Zod input/output schemas, a processing description, and optional visual content. Validation resolves the fields supplied by incoming connections, including fields nested inside objects and inputs assembled from multiple sources. It does not execute node processing.

## Run the example

```sh
bun install
bun run dev
```

Open http://127.0.0.1:5173. The example in `examples/checkout.ts` uses the public API to join a nested order quantity and a separate catalog price into a total-calculation node.

## Use the API

The package is not published to npm yet. Build and pack it locally:

```sh
bun run build:lib
bun pm pack
```

Install the resulting tarball in a web project using either package manager:

```sh
bun add /path/to/quzzar-system-designer-0.0.1.tgz
# or
npm install /path/to/quzzar-system-designer-0.0.1.tgz
```

React, React DOM, and Zod 4.6 are peer dependencies. Bun and Node can construct and validate graphs. Rendering requires a browser and a bundler that supports CSS imports, such as Vite.

```ts
import { z } from 'zod';
import { SystemDesigner } from 'quzzar-system-designer';
import 'quzzar-system-designer/style.css';

const sd = new SystemDesigner({ name: 'Calculate a total' });

sd.add({
  id: 'order',
  name: 'Order',
  input: z.object({}),
  output: z.object({ order: z.object({ quantity: z.number() }) }),
  processing: 'Supply the requested quantity.',
  render: [{ type: 'json', value: { order: { quantity: 2 } } }],
});

sd.add({
  id: 'catalog',
  name: 'Catalog',
  input: z.object({}),
  output: z.object({ priceCents: z.number() }),
  processing: 'Supply the unit price in cents.',
});

sd.add({
  id: 'total',
  name: 'Calculate total',
  input: z.object({ quantity: z.number(), priceCents: z.number() }),
  output: z.object({ totalCents: z.number() }),
  processing: 'Multiply quantity by priceCents.',
  additionalInfo: 'Prices use integer cents in the application.',
});

sd.connect('order', 'total');
sd.connect('catalog', 'total');

const result = sd.validate();
console.log(result.status, result.bindings, result.issues);

// <div id="diagram" style="height: 720px"></div>
const header = document.createElement('h1');
header.textContent = 'Calculate a total';
const mounted = await sd.render('diagram', { header, initialNodeId: 'total' });
// An HTMLElement works too: await sd.render(document.getElementById('diagram')!).
if (mounted.status === 'error') {
  console.error(mounted.message);
} else {
  // Later: mounted.unmount();
}
```

Give the mount element a height. `render()` accepts an element ID without `#`, or an HTMLElement. Rendering a second time into the same element replaces the previous viewer. `unmount()` is idempotent. The viewer displays a snapshot; after changing the instance, call `render()` again to refresh it. Invalid and unverified graphs can still be rendered for inspection.

## Examples

The demo navigation switches among ten graphs, each authored entirely through the package API:

- [Full-stack app](examples/full-stack-app.ts): nested frontend/backend sections, API and data-access functions, table nodes, and two task journeys.
- [Database design](examples/database-design.ts): row schemas, declared keys, cardinality, and a many-to-many join table.
- [Order checkout](examples/checkout.ts): separate suppliers and nested-field inference, with JSON and a catalog table.
- [Document review](examples/document-review.ts): fan-in and fan-out, text, schema blocks, and separate consumers.
- [Node groups](examples/grouped-system.ts): shaded frontend, backend, and database containers with cross-group connections.
- [Image delivery](examples/image-delivery.ts): an image preview, metadata table, and manifest contract.
- [Invalid contract](examples/invalid-contract.ts): ambiguous suppliers and a missing required field, with inspectable validation issues.
- [Stress test and variants](examples/stress-test.ts): 48 sources, 144 required incoming fields, a 53-node graph, and ambiguous/resolved versions that add a competing supplier.

Resolve an ambiguous input by mapping the intended output path on its existing connection:

```ts
sd.connect('order', 'total', {
  map: [{ from: ['order', 'quantity'], to: ['quantity'] }],
});
```

Mappings can select entire subtrees or rename fields. Explicit choices still undergo schema and optionality checks; they never silently switch to a different source. Full rules are in [contract inference](docs/contract-inference.md).

The example chooser belongs to the demo page. It is not injected by `render()`.

## What render() includes

The package supplies the React Flow canvas, automatic layout, node cards, connection labels, zoom/pan controls, validation view, and inspector. A single header row reserves its right side for validation status; the left side is caller-owned. Nodes cannot be dragged, connected, edited, or deleted in the viewer.

Per-node configuration:

- `name`: the visible node title.
- `icon`: optional `braces`, `function`, `database`, `check`, `image`, `table`, `file`, `monitor`, `server`, `layers`, or `none`. Omit it to choose an icon from the node’s position in the graph.
- `render`: the content blocks that fill the center of the card. Supplying this array replaces the default processing-text preview.
- `processing`: the explanation shown when inspecting the node; also the card preview when `render` is omitted.
- `additionalInfo`: optional context shown in the inspector.

The shared dark studio shell and card structure are built into this initial version. Custom node templates and per-instance themes are not exposed yet. Node cards have no input/output text footer; the viewer has no branding, tagline, or global status footer.

Pass optional `header` content to `render()`: an HTMLElement or a React node. With no header content, only the validation status is shown. Constructor `name` is graph metadata, not an automatic heading. A supplied DOM element moves into the header slot and detaches when the viewer unmounts. React content mounts and unmounts with the viewer.

```tsx
await sd.render('diagram', {
  header: <h1>Payment processing</h1>,
});
```

Input and output contracts use an expandable schema tree with readable types, required/optional property labels, nested object and array fields, and constraints such as minimum quantities. Raw JSON Schema is not dumped into the interface.

Define visual boundaries with `addGroup`, then set `group` on each member node:

```ts
sd.addGroup({
  id: 'backend',
  name: 'Backend',
  icon: 'server',
  color: 'green',
});
// Include group: 'backend' in the nodes added with sd.add(...).
```

Groups accept the same icons as nodes. Their color can be `blue`, `green`, `amber`, `purple`, `neutral` (the default), or a six-digit hex color such as `#9081d7`. The color produces a subtle background, border, and readable heading. Groups support a `parent` group ID, are arranged in declaration order, and size around their members and nested groups. Ungrouped nodes remain outside the containers. Membership does not change contract inference: connections work within or across groups. Validation reports unknown groups, duplicate IDs, node/group ID collisions, and invalid colors. Group containers are read-only. Missing or cyclic parent ancestry is a validation error.

Use `sd.connect(source, target, { label })` for any labeled connection. Labels are arbitrary display text: `1:M`, `Membership`, or `Create task request` are all ordinary strings. The package does not interpret their meaning. Input/output validation always follows the declared contracts, independently of labels. See the [app and database walkthrough](docs/examples.md) for complete examples and navigation.

Select a node for its overview and contracts. Close the inspector with its X to clear the selection and use the full canvas. Clicking the blank canvas also clears the selection. Large graphs expose an Inspect chooser that zooms to a selected node; wide layers use multiple columns, and edge labels appear as you zoom in or select a connection. Large input lists are grouped by source. Select a connection to see its inferred consumed fields, the available upstream output, the consumer’s complete input contract, and inputs supplied by other connections. The viewer shows declared contracts and illustrative content, not live runtime payloads.

## Visual content

`render` on a node is an optional array of declarative blocks:

```ts
render: [
  { type: 'text', text: 'Display a useful explanation.' },
  { type: 'json', title: 'Illustrative result', value: { totalCents: 3600 } },
  {
    type: 'schema',
    title: 'Result schema',
    schema: z.object({ totalCents: z.number() }),
  },
  { type: 'table', columns: ['Quantity', 'Price'], rows: [[2, 1800]] },
  { type: 'image', src: '/diagram.png', alt: 'Description of the diagram' },
];
```

Content is rendered inside the node and in its inspector. Values are illustrative content, not executed outputs or validated sample payloads. Image paths resolve relative to the embedding page. HTTP(S), local paths beginning with `/`, `./`, or `../`, and raster image data URLs are supported. Text and JSON are escaped; arbitrary HTML is not accepted.

## Validation semantics

See [contract inference](docs/contract-inference.md) for the supported rules and limitations. `valid` is true only for `status: 'valid'`. Check `status` to distinguish a proven mismatch (`invalid`) from constraints requiring manual verification (`unverified`). Each binding names the source node, source field path, destination field path, and connection.

## Checks

```sh
bun run typecheck
bun run lint
bun test src/lib
bun run test:e2e
bun run build
```

Browser tests use Playwright Chromium. Install it with `bunx playwright install chromium` if needed. `build:lib` emits ESM, declarations, and CSS into `dist/`; `build:demo` emits the runnable example into `dist-demo/`.

Project-scoped Impeccable tools are local development tooling. To install them for Codex, run `bunx impeccable install -y --providers=codex --scope=project`. They are excluded from Git and from the npm tarball.
