import { z } from 'zod';
import { SystemDesigner } from '../src/index';

export const userRow = z.object({ id: z.string(), email: z.string() });
export const profileRow = z.object({
  userId: z.string(),
  displayName: z.string(),
});
export const projectRow = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
});
export const membershipRow = z.object({
  userId: z.string(),
  projectId: z.string(),
  role: z.enum(['owner', 'member']),
});
export const taskRow = z.object({
  id: z.string(),
  projectId: z.string(),
  authorId: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

/** Tables expose row contracts. Input is empty because a table is not a function invocation. */
export function addTaskTables(
  sd: SystemDesigner,
  group: string,
  includeProfile = false,
) {
  const definitions = [
    {
      id: 'users',
      schema: userRow,
      rows: [
        ['id', 'string', 'PK'],
        ['email', 'string', 'UNIQUE'],
      ],
    },
    {
      id: 'projects',
      schema: projectRow,
      rows: [
        ['id', 'string', 'PK'],
        ['name', 'string', ''],
        ['ownerId', 'string', 'FK users.id'],
      ],
    },
    {
      id: 'memberships',
      schema: membershipRow,
      rows: [
        ['userId', 'string', 'PK · FK users.id'],
        ['projectId', 'string', 'PK · FK projects.id'],
        ['role', 'owner | member', ''],
      ],
    },
    {
      id: 'tasks',
      schema: taskRow,
      rows: [
        ['id', 'string', 'PK'],
        ['projectId', 'string', 'FK projects.id'],
        ['authorId', 'string', 'FK users.id'],
        ['title', 'string', ''],
        ['completed', 'boolean', ''],
      ],
    },
    ...(includeProfile
      ? [
          {
            id: 'profiles',
            schema: profileRow,
            rows: [
              ['userId', 'string', 'PK · FK users.id'],
              ['displayName', 'string', ''],
            ],
          },
        ]
      : []),
  ];
  for (const table of definitions)
    sd.add({
      id: table.id,
      name: table.id,
      group,
      icon: 'database',
      input: z.object({}),
      output: table.schema,
      processing: `Describe the ${table.id} row shape and declared keys.`,
      additionalInfo:
        'PK, FK, and UNIQUE labels document intended database constraints. This package does not create or enforce them.',
      render: [
        { type: 'table', columns: ['Column', 'Type', 'Key'], rows: table.rows },
      ],
    });
}

/** The join table is the concrete implementation of the conceptual users/projects association. */
export function addTaskRelationships(sd: SystemDesigner) {
  sd.relate('users', 'projects', {
    cardinality: 'one-to-many',
    label: 'owns',
    sourceKey: ['id'],
    targetKey: ['ownerId'],
    description: 'One user can own many projects; each project has one owner.',
  });
  sd.relate('projects', 'tasks', {
    cardinality: 'one-to-many',
    label: 'contains',
    sourceKey: ['id'],
    targetKey: ['projectId'],
    description:
      'A project contains many tasks; each task belongs to one project.',
  });
  sd.relate('users', 'memberships', {
    cardinality: 'one-to-many',
    label: 'user memberships',
    sourceKey: ['id'],
    targetKey: ['userId'],
  });
  sd.relate('projects', 'memberships', {
    cardinality: 'one-to-many',
    label: 'project memberships',
    sourceKey: ['id'],
    targetKey: ['projectId'],
  });
  sd.relate('users', 'projects', {
    cardinality: 'many-to-many',
    label: 'members via memberships',
    description:
      'Conceptual association implemented by memberships(userId, projectId), with a composite primary key. This is separate from project ownership.',
  });
}
