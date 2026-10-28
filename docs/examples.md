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

Use **Inspect → Sections → Backend** to frame that section. Choose a node to focus it and open its overview, or choose a connection to inspect exactly which output fields supply the consumer. For example, `connection-3` shows the explicit `memberships` projection. **Fit graph to view** returns to the complete design. Close the inspector to give the canvas more room.

## Database design

Source: [database-design.ts](../examples/database-design.ts), reusing the same row schemas and table content.

The database example has five tables, six relationships, and no data-flow connections. Each table uses a Zod row schema as its output contract and an empty input contract. Its center renders a table of column names, types, and declared PK/FK/UNIQUE labels. The inspector's Output tab shows the expandable row schema.

| Association                | Cardinality  | Meaning                                                          |
| -------------------------- | ------------ | ---------------------------------------------------------------- |
| users → projects, owns     | one-to-many  | A user can own multiple projects.                                |
| projects → tasks, contains | one-to-many  | Tasks belong to a project.                                       |
| users → memberships        | one-to-many  | A user can have multiple membership rows.                        |
| projects → memberships     | one-to-many  | A project can have multiple membership rows.                     |
| users ↔ projects, members  | many-to-many | Conceptual membership through the join table.                    |
| users → profiles           | one-to-one   | A unique profile userId limits each user to at most one profile. |

The many-to-many association and its two join-table relationships deliberately show both the conceptual model and its physical representation. Memberships declares a composite primary key `(userId, projectId)`. Project ownership is a different association from membership, even though both connect users and projects.

Relationships are dashed and labeled `1:1`, `1:N`, `N:1`, or `N:N`, read from source to target. Select one to see its description and key paths, then jump to either endpoint. These labels declare multiplicity; they do not encode minimum participation. Describe optionality in `description`. Real foreign keys, uniqueness, indexes, cascading actions, migrations, and row-level authorization remain implementation concerns.

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

## Choose a connection or a relationship

Use `connect()` when a source supplies fields to a consumer's input contract:

```ts
sd.connect('memberships', 'authorize', {
  label: 'Scoped membership',
  map: [{ from: [], to: ['membership'] }],
});
```

Use `relate()` for a structural association:

```ts
sd.relate('projects', 'tasks', {
  cardinality: 'one-to-many',
  label: 'contains',
  sourceKey: ['id'],
  targetKey: ['projectId'],
  description: 'One project can contain many tasks.',
});
```

`sourceKey` and `targetKey` are optional, paired paths into the endpoints' **output** schemas. Omit both for a conceptual association. Supply arrays of literal property names for nested keys, just like explicit connection mappings. Do not point a relationship at a group.

Validation checks relationship IDs, endpoints, cardinality values, paired key configuration, and the existence of declared key paths. It does not infer bindings from a relationship, count it as a checked data-flow connection, prove SQL constraints, or prove the relationship's cardinality. `valid` means the supported structural and contract checks passed. An association cannot satisfy a node's required input; use a real `connect()` for that.

## Render a design

In a consuming app, install the package when published, import its stylesheet once, give a mount element a height, then call `render`. Within this repository the examples import `../src/index` so they run directly in Vite.

```ts
import { SystemDesigner } from 'quzzar-system-designer';
import 'quzzar-system-designer/style.css';

const sd = new SystemDesigner({ name: 'My application' });
// Add groups, nodes, connections, and relationships as above.
const validation = sd.validate();
console.log(validation.status, validation.issues);
const header = document.createElement('h1');
header.textContent = 'My application';
const result = await sd.render('diagram', { header });
if (result.status === 'error') console.error(result.message);
```

`header` accepts React content or an HTMLElement. The UI stays read-only; change the authored graph and render it again to change the design.
