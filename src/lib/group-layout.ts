import { layoutGraph } from './layout';
import type { DesignerGraph } from './types';

export type NodeSize = { width: number; height: number };
export type GroupBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Only acyclic, existing parent references can be rendered as containment. Validation reports the rest. */
export function groupParents(graph: DesignerGraph): Map<string, string> {
  const groups = new Map(
    (graph.groups ?? []).map((group) => [group.id, group]),
  );
  const parents = new Map<string, string>();
  for (const group of groups.values()) {
    const seen = new Set([group.id]);
    let ancestor = group.parent;
    let valid = true;
    while (ancestor !== undefined) {
      if (seen.has(ancestor) || !groups.has(ancestor)) {
        valid = false;
        break;
      }
      seen.add(ancestor);
      ancestor = groups.get(ancestor)?.parent;
    }
    if (valid && group.parent !== undefined)
      parents.set(group.id, group.parent);
  }
  return parents;
}

/** Measure from leaves upward, then position from roots downward. All returned coordinates are absolute. */
export function layoutGroupedGraph(
  graph: DesignerGraph,
  sizes: ReadonlyMap<string, NodeSize>,
) {
  const parents = groupParents(graph);
  const positions = new Map<string, { x: number; y: number }>();
  const containers = new Map<string, GroupBounds>();
  const groups = graph.groups ?? [];
  function place(
    groupId: string | undefined,
    originX: number,
    originY: number,
  ): NodeSize {
    const members = graph.nodes.filter((node) =>
      groupId === undefined
        ? !node.group || !groups.some((group) => group.id === node.group)
        : node.group === groupId,
    );
    const ids = new Set(members.map((node) => node.id));
    const local = layoutGraph({
      nodes: members,
      connections: graph.connections.filter(
        (edge) => ids.has(edge.source) && ids.has(edge.target),
      ),
      relationships: (graph.relationships ?? []).filter(
        (edge) => ids.has(edge.source) && ids.has(edge.target),
      ),
    });
    const columns = new Map<number, string[]>();
    for (const [id, point] of local)
      columns.set(point.x, [...(columns.get(point.x) ?? []), id]);
    let width = groupId === undefined ? 0 : 312;
    let height = groupId === undefined ? 0 : 120;
    const inset = groupId === undefined ? 0 : 32;
    const top = groupId === undefined ? 0 : 72;
    for (const [x, children] of columns) {
      children.sort((a, b) => (local.get(a)?.y ?? 0) - (local.get(b)?.y ?? 0));
      let y = top;
      for (const id of children) {
        const size = sizes.get(id) ?? { width: 248, height: 260 };
        positions.set(id, { x: originX + inset + x, y: originY + y });
        width = Math.max(width, inset + x + size.width + inset);
        height = Math.max(height, y + size.height + inset);
        y += size.height + 48;
      }
    }
    let nextX = members.length ? width + 80 : inset;
    const nested = groups.filter((group) =>
      groupId === undefined
        ? !parents.has(group.id)
        : parents.get(group.id) === groupId,
    );
    for (const child of nested) {
      const x = originX + nextX;
      const y = originY + top;
      const size = place(child.id, x, y);
      containers.set(child.id, { x, y, ...size });
      width = Math.max(width, nextX + size.width + inset);
      height = Math.max(height, top + size.height + inset);
      nextX += size.width + (groupId === undefined ? 112 : 48);
    }
    return { width, height };
  }
  place(undefined, 0, 0);
  // React Flow requires every parent before its children, regardless of declaration order.
  const ordered = new Map<string, GroupBounds>();
  function order(parent: string | undefined) {
    for (const group of groups.filter(
      (group) => parents.get(group.id) === parent,
    )) {
      const bounds = containers.get(group.id);
      if (bounds) ordered.set(group.id, bounds);
      order(group.id);
    }
  }
  order(undefined);
  return { positions, containers: ordered, parents };
}
