# Designing an app and its database

Run `bun install` and `bun run dev`, then choose **Full-stack app** or **Database design** in the example navigation. Both are authored through the public package API; the demo only supplies the navigation and header. Nothing executes application logic or database queries.

## Full-stack app

Source: [full-stack-app.ts](../examples/full-stack-app.ts), with shared table definitions in [task-model.ts](../examples/task-model.ts).

This task-management design contains twelve nodes across Frontend, Backend, and Database. Frontend contains Workspace UI; Backend contains API and Data access. Nesting describes the architecture, not execution order.

Follow task creation:

1. **New task form** supplies `command.projectId` and `command.title`.
2. **Session** supplies `actor.userId`. A real implementation must verify the actor on the server.
3. **memberships** supplies a row contract. An explicit root-to-subtree mapping places it under `membership` in **Authorize task creation**.
4. **Authorize task creation** describes checking the actor and project membership, then emitting an authorized draft.
5. **Insert task** describes generating a task ID and inserting the draft. Its output is the saved task contract.
6. **Build task response** projects that row into a notice for **Task confirmation**.

The separate board journey models **tasks → Load project board → Project board**. A table node exposes a row schema; the loader describes the scoped query and collection assembly. This is a contract-level illustration, not evidence of real authorization, filtering, query results, or persistence.

Click a table or function card to open its overview, then use Input and Output to inspect its contracts. Click a connection label or path to inspect which fields supply the consumer. Double-click a card to focus it, or pan and zoom for a closer look; **Fit graph to view** returns to the complete design. Close the inspector to give the canvas more room. Keyboard users can focus graph items and press Enter.

## Database design

Source: [database-design.ts](../examples/database-design.ts), reusing the same row schemas and table content.

The database example has five tables and six labeled connections. Each table uses a Zod row schema as its output contract and an empty input contract. Its center renders a table of column names, types, and declared PK/FK/UNIQUE labels. The inspector's Output tab shows the expandable row schema.

| Association                | Cardinality  | Meaning                                                          |
| -------------------------- | ------------ | ---------------------------------------------------------------- |
| users → projects, owns     | one-to-many  | A user can own multiple projects.                                |
| projects → tasks, contains | one-to-many  | Tasks belong to a project.                                       |
| users → memberships        | one-to-many  | A user can have multiple membership rows.                        |
| projects → memberships     | one-to-many  | A project can have multiple membership rows.                     |
| users ↔ projects, members  | many-to-many | Conceptual membership through the join table.                    |
| users → profiles           | one-to-one   | A unique profile userId limits each user to at most one profile. |

The many-to-many association and its two join-table relationships deliberately show both the conceptual model and its physical representation. Memberships declares a composite primary key `(userId, projectId)`. Project ownership is a different association from membership, even though both connect users and projects.

The labels use descriptive names such as `User memberships (1:M)` and `Project membership (M:M)`. Parallel and long table connections use reserved lanes inside Application tables; columns and rows leave room for labels. Labels remain rendered at every zoom level and scale with the graph. These are ordinary strings chosen by the example author. The package neither interprets them nor enforces database semantics. Select a connection to inspect its endpoints and contracts. Real foreign keys, uniqueness, indexes, cascading actions, migrations, and row-level authorization remain implementation concerns.

## Author nested groups

```ts
sd.addGroup({ id: 'backend', name: 'Backend', icon: 'server', color: 'green' });
sd.addGroup({
  id: 'api',
  parent: 'backend',
  name: 'API',
  icon: 'function',
  color: 'neutral',
});
// Set group: 'api' on a node to place it inside Backend → API.
```

Parents can be declared before or after their children. Containers size around measured descendants, including expanded content. A group has one parent; cyclic or missing ancestry is a validation error. Groups do not become connection endpoints or schema scopes.

## Label any connection

There is one connection API. Labels can describe a payload, a database relationship, or anything else:

```ts
sd.connect('projects', 'tasks', { label: '1:M' });
sd.connect('users', 'projects', { label: 'Membership' });
sd.connect('memberships', 'authorize', {
  label: 'Scoped membership',
  map: [{ from: [], to: ['membership'] }],
});
```

The label is displayed as plain text. It does not choose a connection type, infer database key paths, or change validation. Explicit `map` configuration still controls input field selection when needed.

Every connection validates source output against required destination input fields. Table nodes in this example have empty input objects, so their labeled connections resolve no consumer fields. Their row schemas are available for inspection, but a valid result does not prove foreign keys or multiplicity. Node `additionalInfo` and authored table content document the intended keys and constraints.

## Render a design

In a consuming app, install the package when published, import its stylesheet once, give a mount element a height, then call `render`. Within this repository the examples import `../src/index` so they run directly in Vite.

```ts
import { SystemDesigner } from 'quzzar-system-designer';
import 'quzzar-system-designer/style.css';

const sd = new SystemDesigner({ name: 'My application' });
// Add groups, nodes, and labeled connections as above.
const validation = sd.validate();
console.log(validation.status, validation.issues);
const header = document.createElement('h1');
header.textContent = 'My application';
const result = await sd.render('diagram', { header });
if (result.status === 'error') console.error(result.message);
```

`header` accepts React content or an HTMLElement. The UI stays read-only; change the authored graph and render it again to change the design.

## Dense graph navigation

Graphs above 24 nodes open focused on the selected operation so card content is readable. Fit graph shows the complete topology; double-click a card to focus it again. In a large fan-in inspector, expand a source and choose its Inspect button to jump to that supplier. These controls inspect the same graph without a selector row or editable canvas. Labels remain rendered at every zoom, so an overview is a topology map rather than a promise that all its text fits at reading size.

Connections use rounded orthogonal routes through gaps between measured card bounds. Internal long/parallel lanes remain inside their shared group. Routing avoids card interiors, includes connection extents in fit-to-view, and updates when content dimensions change. Canvas resizing refits the overview or preserves the focused node. If a layout cannot produce a clear route, the label reports a routing error. Dense channels may share segments; selecting a connection highlights it for inspection.
