import { SystemDesigner } from '../src/index';
import { addTaskRelationships, addTaskTables } from './task-model';

/** Database design: row contracts, declared keys, and conceptual and physical relationships. */
export function createDatabaseDesignExample(): SystemDesigner {
  const sd = new SystemDesigner({ name: 'Task app database' });
  sd.addGroup({
    id: 'database',
    name: 'Database',
    icon: 'database',
    color: 'amber',
  });
  sd.addGroup({
    id: 'tables',
    parent: 'database',
    name: 'Application tables',
    icon: 'table',
    color: 'neutral',
  });
  addTaskTables(sd, 'tables', true);
  addTaskRelationships(sd);
  sd.relate('users', 'profiles', {
    cardinality: 'one-to-one',
    label: 'profile',
    sourceKey: ['id'],
    targetKey: ['userId'],
    description:
      'Each profile belongs to one user. A unique userId limits each user to at most one profile. Optionality is described here, not encoded by the cardinality label.',
  });
  return sd;
}
