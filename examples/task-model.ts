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
export function addTaskConnections(sd: SystemDesigner) {
  sd.connect('users', 'projects', { label: 'Owns projects (1:M)' });
  sd.connect('projects', 'tasks', { label: 'Contains tasks (1:M)' });
  sd.connect('users', 'memberships', { label: 'User memberships (1:M)' });
  sd.connect('projects', 'memberships', { label: 'Project memberships (1:M)' });
  sd.connect('users', 'projects', { label: 'Project membership (M:M)' });
}
