import { layoutGraph } from './layout';
import type { DesignerGraph } from './types';

export type NodeSize = { width: number; height: number };
export type GroupBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Group containers follow declaration order; internal members keep their own flow layout. */
export function layoutGroupedGraph(
  graph: DesignerGraph,
  sizes: ReadonlyMap<string, NodeSize>,
) {
  const positions = new Map<string, { x: number; y: number }>();
  const containers = new Map<string, GroupBounds>();
  let offset = 0;
  for (const group of graph.groups ?? []) {
    const members = graph.nodes.filter((node) => node.group === group.id);
    const ids = new Set(members.map((node) => node.id));
    const local = layoutGraph({
      nodes: members,
      connections: graph.connections.filter(
        (edge) => ids.has(edge.source) && ids.has(edge.target),
      ),
    });
    const columns = new Map<number, string[]>();
    for (const [id, point] of local)
      columns.set(point.x, [...(columns.get(point.x) ?? []), id]);
    let width = 312;
    let height = 120;
    for (const [x, children] of columns) {
      children.sort(
        (left, right) => (local.get(left)?.y ?? 0) - (local.get(right)?.y ?? 0),
      );
      let y = 72;
      for (const id of children) {
        const size = sizes.get(id) ?? { width: 248, height: 260 };
        positions.set(id, { x: offset + 32 + x, y });
        width = Math.max(width, 32 + x + size.width + 32);
        height = Math.max(height, y + size.height + 32);
        y += size.height + 48;
      }
    }
    containers.set(group.id, { x: offset, y: 0, width, height });
    offset += width + 112;
  }
  const ungrouped = graph.nodes.filter(
    (node) => !node.group || !containers.has(node.group),
  );
  const ungroupedIds = new Set(ungrouped.map((node) => node.id));
  const loosePositions = layoutGraph({
    nodes: ungrouped,
    connections: graph.connections.filter(
      (edge) => ungroupedIds.has(edge.source) && ungroupedIds.has(edge.target),
    ),
  });
  for (const [id, point] of loosePositions)
    positions.set(id, { x: offset + point.x, y: point.y + 72 });
  return { positions, containers };
}
