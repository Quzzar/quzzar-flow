import { z } from 'zod';
import { SystemDesigner } from '../src/index';
import { addTaskTables, membershipRow, taskRow } from './task-model';

/** Two documented journeys: creating a task and loading the board. No code or queries execute. */
export function createFullStackAppExample(): SystemDesigner {
  const sd = new SystemDesigner({ name: 'Task app: full stack' });
  for (const group of [
    {
      id: 'frontend',
      name: 'Frontend',
      icon: 'monitor' as const,
      color: 'blue' as const,
    },
    {
      id: 'workspace',
      parent: 'frontend',
      name: 'Workspace UI',
      icon: 'layers' as const,
      color: 'blue' as const,
    },
    {
      id: 'backend',
      name: 'Backend',
      icon: 'server' as const,
      color: 'green' as const,
    },
    {
      id: 'api',
      parent: 'backend',
      name: 'API',
      icon: 'server' as const,
      color: 'green' as const,
    },
    {
      id: 'data-access',
      parent: 'backend',
      name: 'Data access',
      icon: 'function' as const,
      color: 'neutral' as const,
    },
    {
      id: 'database',
      name: 'Database',
      icon: 'database' as const,
      color: 'amber' as const,
    },
  ])
    sd.addGroup(group);
  const command = z.object({ projectId: z.string(), title: z.string() });
  const draft = z.object({
    projectId: z.string(),
    title: z.string(),
    authorId: z.string(),
  });
  const empty = z.object({});
  sd.add({
    id: 'new-task',
    name: 'New task form',
    group: 'workspace',
    icon: 'monitor',
    input: empty,
    output: z.object({ command }),
    processing: 'Collect a task title and selected project.',
    render: [
      {
        type: 'json',
        title: 'Illustrative submission',
        value: { command: { projectId: 'prj_01', title: 'Review contract' } },
      },
    ],
  });
  sd.add({
    id: 'session',
    name: 'Session',
    group: 'workspace',
    icon: 'braces',
    input: empty,
    output: z.object({ actor: z.object({ userId: z.string() }) }),
    processing: 'Describe an authenticated actor. The server must verify it.',
    render: [
      {
        type: 'json',
        title: 'Illustrative actor',
        value: { actor: { userId: 'usr_01' } },
      },
    ],
  });
  sd.add({
    id: 'authorize',
    name: 'Authorize task creation',
    group: 'api',
    icon: 'function',
    input: z.object({
      command,
      actor: z.object({ userId: z.string() }),
      membership: membershipRow,
    }),
    output: z.object({ draft }),
    processing:
      'Verify actor identity and project membership, then assign authorId from the actor.',
    additionalInfo:
      'Authorization is described, not proven. The membership supplier models a scoped lookup; filtering and identity checks require implementation review.',
    render: [
      {
        type: 'text',
        title: 'Create task',
        text: 'Verify actor → check membership → prepare draft',
      },
    ],
  });
  sd.add({
    id: 'insert-task',
    name: 'Insert task',
    group: 'data-access',
    icon: 'database',
    input: z.object({ draft }),
    output: z.object({ task: taskRow }),
    processing:
      'Describe an insert into tasks, generating id and setting completed=false. No database write executes.',
    render: [{ type: 'schema', title: 'Returned row', schema: taskRow }],
  });
  sd.add({
    id: 'receipt',
    name: 'Build task response',
    group: 'api',
    icon: 'function',
    input: z.object({ task: taskRow }),
    output: z.object({
      notice: z.object({ taskId: z.string(), title: z.string() }),
    }),
    processing: 'Project the saved task into a confirmation notice.',
    render: [
      {
        type: 'text',
        text: 'task.id → notice.taskId\ntask.title → notice.title',
      },
    ],
  });
  sd.add({
    id: 'confirmation',
    name: 'Task confirmation',
    group: 'workspace',
    icon: 'check',
    input: z.object({
      notice: z.object({ taskId: z.string(), title: z.string() }),
    }),
    output: z.object({ displayed: z.boolean() }),
    processing: 'Show the saved task notice.',
    render: [{ type: 'text', text: 'Task created: Review contract' }],
  });
  sd.add({
    id: 'load-board',
    name: 'Load project board',
    group: 'data-access',
    icon: 'function',
    input: taskRow,
    output: z.object({ tasks: z.array(taskRow) }),
    processing:
      'Model one illustrative task-row supplier, scoped querying, and assembly of the board collection.',
    additionalInfo:
      'A row contract is not a query engine. This graph does not prove project scoping, ordering, or actual row counts.',
    render: [
      {
        type: 'text',
        text: 'Read rows → apply project scope → assemble tasks[]',
      },
    ],
  });
  sd.add({
    id: 'board',
    name: 'Project board',
    group: 'workspace',
    icon: 'monitor',
    input: z.object({ tasks: z.array(taskRow) }),
    output: z.object({ rendered: z.boolean() }),
    processing: 'Render task cards from the returned collection.',
    render: [
      {
        type: 'table',
        title: 'Illustrative board',
        columns: ['Task', 'State'],
        rows: [
          ['Review contract', 'Open'],
          ['Add smoke test', 'Done'],
        ],
      },
    ],
  });
  addTaskTables(sd, 'database');
  sd.connect('new-task', 'authorize', { label: 'Create command' });
  sd.connect('session', 'authorize', { label: 'Actor context' });
  sd.connect('memberships', 'authorize', {
    label: 'Scoped membership',
    map: [{ from: [], to: ['membership'] }],
  });
  sd.connect('authorize', 'insert-task', { label: 'Authorized draft' });
  sd.connect('insert-task', 'receipt', { label: 'Saved task' });
  sd.connect('receipt', 'confirmation', { label: 'Task notice' });
  sd.connect('tasks', 'load-board', { label: 'Task row contract' });
  sd.connect('load-board', 'board', { label: 'Board collection' });
  sd.connect('projects', 'tasks', { label: '1:M · contains' });
  return sd;
}
