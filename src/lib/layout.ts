import type { DesignerGraph } from './types';

export const COLUMN_WIDTH = 360;

/** Stable left-to-right layout. Cyclic components are displayed, never treated as executions. */
export function layoutGraph(
  graph: DesignerGraph,
): Map<string, { x: number; y: number }> {
  const layers = new Map<string, number>();
  const remaining = new Set(graph.nodes.map((node) => node.id));
  for (let pass = 0; pass < graph.nodes.length && remaining.size; pass++) {
    let changed = false;
    for (const id of remaining) {
      const parents = graph.connections
        .filter((edge) => edge.target === id)
        .map((edge) => edge.source);
      if (parents.every((parent) => layers.has(parent))) {
        layers.set(
          id,
          parents.length
            ? Math.max(...parents.map((parent) => layers.get(parent) ?? 0)) + 1
            : 0,
        );
        remaining.delete(id);
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const id of remaining) layers.set(id, 0);
  const columns = new Map<number, string[]>();
  for (const [id, layer] of layers)
    columns.set(layer, [...(columns.get(layer) ?? []), id]);
  const positions = new Map<string, { x: number; y: number }>();
  for (const [layer, ids] of columns)
    ids.forEach((id, index) =>
      positions.set(id, {
        x: layer * COLUMN_WIDTH,
        y: index * 350 - (ids.length - 1) * 175,
      }),
    );
  return positions;
}
