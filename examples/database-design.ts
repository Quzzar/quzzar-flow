import { SystemDesigner } from '../src/index';
import { addTaskConnections, addTaskTables } from './task-model';

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
  addTaskConnections(sd);
  sd.connect('users', 'profiles', { label: '1:1 · profile' });
  return sd;
}
