import type { DesignerGraph } from './types';
import type { GroupBounds, NodeSize } from './group-layout';

export type Point = { x: number; y: number };
export type Route =
  | { status: 'success'; points: Point[]; label: Point }
  | { status: 'error'; message: string; label: Point };
type Box = GroupBounds;
const CLEARANCE = 10;
const LABEL_WIDTH = 80;

function inside(point: Point, box: Box) {
  return (
    point.x > box.x &&
    point.x < box.x + box.width &&
    point.y > box.y &&
    point.y < box.y + box.height
  );
}
/** Open interiors are obstacles; running along a clearance boundary is allowed. */
export function segmentIntersectsBox(a: Point, b: Point, box: Box): boolean {
  if (a.x === b.x)
    return (
      a.x > box.x &&
      a.x < box.x + box.width &&
      Math.max(a.y, b.y) > box.y &&
      Math.min(a.y, b.y) < box.y + box.height
    );
  if (a.y === b.y)
    return (
      a.y > box.y &&
      a.y < box.y + box.height &&
      Math.max(a.x, b.x) > box.x &&
      Math.min(a.x, b.x) < box.x + box.width
    );
  return true;
}
function compress(points: Point[]) {
  const result: Point[] = [];
  for (const point of points) {
    const previous = result.at(-1);
    if (previous?.x === point.x && previous.y === point.y) continue;
    const before = result.at(-2);
    if (
      before &&
      previous &&
      ((before.x === previous.x && previous.x === point.x) ||
        (before.y === previous.y && previous.y === point.y))
    )
      result.pop();
    result.push(point);
  }
  return result;
}

/** Small binary heap keeps dense fan-in routing bounded without a dependency. */
class Queue {
  private entries: { key: number; score: number }[] = [];
  push(key: number, score: number) {
    let index = this.entries.length;
    this.entries.push({ key, score });
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      const entry = this.entries[parent];
      if (!entry || entry.score <= score) break;
      this.entries[index] = entry;
      index = parent;
    }
    this.entries[index] = { key, score };
  }
  pop() {
    const first = this.entries[0];
    const last = this.entries.pop();
    if (!first || !last || !this.entries.length) return first;
    let index = 0;
    while (index * 2 + 1 < this.entries.length) {
      let child = index * 2 + 1;
      const right = this.entries[child + 1];
      if (right && right.score < (this.entries[child]?.score ?? Infinity))
        child++;
      const entry = this.entries[child];
      if (!entry || entry.score >= last.score) break;
      this.entries[index] = entry;
      index = child;
    }
    this.entries[index] = last;
    return first;
  }
}

function findPath(
  start: Point,
  end: Point,
  xs: number[],
  ys: number[],
  obstacles: Box[],
  bounds: Box,
  usage: Map<string, number>,
): Point[] | undefined {
  const columns = xs.length;
  const startIndex = ys.indexOf(start.y) * columns + xs.indexOf(start.x);
  const endIndex = ys.indexOf(end.y) * columns + xs.indexOf(end.x);
  const point = (index: number): Point => ({
    x: xs[index % columns] ?? 0,
    y: ys[Math.floor(index / columns)] ?? 0,
  });
  const allowed = new Map<number, boolean>();
  function available(index: number) {
    const cached = allowed.get(index);
    if (cached !== undefined) return cached;
    const p = point(index);
    const valid =
      p.x >= bounds.x &&
      p.x <= bounds.x + bounds.width &&
      p.y >= bounds.y &&
      p.y <= bounds.y + bounds.height &&
      !obstacles.some((box) => inside(p, box));
    allowed.set(index, valid);
    return valid;
  }
  if (!available(startIndex) || !available(endIndex)) return undefined;
  const queue = new Queue();
  const costs = new Map<number, number>();
  const previous = new Map<number, number>();
  const edgeKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  for (const direction of [0, 1]) {
    costs.set(startIndex * 2 + direction, 0);
    queue.push(startIndex * 2 + direction, 0);
  }
  let terminal: number | undefined;
  const visited = new Set<number>();
  while (true) {
    const item = queue.pop();
    if (!item) break;
    if (visited.has(item.key)) continue;
    visited.add(item.key);
    const index = Math.floor(item.key / 2);
    if (index === endIndex) {
      terminal = item.key;
      break;
    }
    const current = point(index);
    const neighbors = [
      index % columns > 0 ? index - 1 : -1,
      index % columns < columns - 1 ? index + 1 : -1,
      index - columns,
      index + columns,
    ];
    for (const neighbor of neighbors) {
      if (
        neighbor < 0 ||
        neighbor >= xs.length * ys.length ||
        !available(neighbor)
      )
        continue;
      const next = point(neighbor);
      if (obstacles.some((box) => segmentIntersectsBox(current, next, box)))
        continue;
      const direction = current.y === next.y ? 0 : 1;
      const nextKey = neighbor * 2 + direction;
      const distance =
        Math.abs(current.x - next.x) + Math.abs(current.y - next.y);
      const score =
        (costs.get(item.key) ?? Infinity) +
        distance +
        (item.key % 2 === direction ? 0 : 20) +
        (usage.get(edgeKey(index, neighbor)) ?? 0) * distance * 0.8;
      if (score >= (costs.get(nextKey) ?? Infinity)) continue;
      costs.set(nextKey, score);
      previous.set(nextKey, item.key);
      queue.push(
        nextKey,
        score + Math.abs(end.x - next.x) + Math.abs(end.y - next.y),
      );
    }
  }
  if (terminal === undefined) return undefined;
  const indices: number[] = [];
  let cursor: number | undefined = terminal;
  while (cursor !== undefined) {
    indices.push(Math.floor(cursor / 2));
    cursor = previous.get(cursor);
  }
  indices.reverse();
  for (let index = 1; index < indices.length; index++) {
    const a = indices[index - 1],
      b = indices[index];
    if (a !== undefined && b !== undefined) {
      const key = edgeKey(a, b);
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
  }
  return indices.map(point);
}

function overlaps(a: Box, b: Box) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Orthogonal routes avoid card interiors and keep connections inside their common group. */
export function routeGraph(
  graph: DesignerGraph,
  positions: ReadonlyMap<string, Point>,
  sizes: ReadonlyMap<string, NodeSize>,
  containers: ReadonlyMap<string, GroupBounds> = new Map(),
  parents: ReadonlyMap<string, string> = new Map(),
  lanes: ReadonlyMap<string, number> = new Map(),
): Map<string, Route> {
  const cards = new Map(
    graph.nodes.map((node) => [
      node.id,
      {
        ...(positions.get(node.id) ?? { x: 0, y: 0 }),
        ...(sizes.get(node.id) ?? { width: 248, height: 260 }),
      },
    ]),
  );
  const obstacles: Box[] = [...cards.values()].map((box) => ({
    x: box.x - CLEARANCE,
    y: box.y - CLEARANCE,
    width: box.width + CLEARANCE * 2,
    height: box.height + CLEARANCE * 2,
  }));
  const headings = [...containers.values()].map((box) => ({
    x: box.x,
    y: box.y,
    width: box.width,
    height: 56,
  }));
  obstacles.push(...headings);
  function ancestry(id: string) {
    const result: string[] = [];
    let group = graph.nodes.find((node) => node.id === id)?.group;
    while (group && containers.has(group)) {
      result.push(group);
      group = parents.get(group);
    }
    return result;
  }
  const allBoxes = [...cards.values(), ...containers.values()];
  if (!allBoxes.length) return new Map();
  const left = Math.min(...allBoxes.map((box) => box.x)) - 48;
  const top = Math.min(...allBoxes.map((box) => box.y)) - 48;
  const global = {
    x: left,
    y: top,
    width: Math.max(...allBoxes.map((box) => box.x + box.width)) - left + 48,
    height: Math.max(...allBoxes.map((box) => box.y + box.height)) - top + 48,
  };
  const endpoints = graph.connections.flatMap((edge) => {
    const source = cards.get(edge.source),
      target = cards.get(edge.target);
    if (!source || !target) return [];
    const targetAncestors = ancestry(edge.target);
    const shared = ancestry(edge.source).find((id) =>
      targetAncestors.includes(id),
    );
    const group = shared ? containers.get(shared) : undefined;
    const bounds = group
      ? {
          x: group.x + 12,
          y: group.y + 64,
          width: group.width - 24,
          height: group.height - 76,
        }
      : global;
    return [
      {
        edge,
        source,
        target,
        bounds,
        start: {
          x: Math.min(source.x + source.width + 24, bounds.x + bounds.width),
          y: source.y + source.height / 2,
        },
        end: {
          x: Math.max(target.x - 24, bounds.x),
          y: target.y + target.height / 2,
        },
      },
    ];
  });
  const xs = [
    ...new Set([
      global.x,
      global.x + global.width,
      ...obstacles.flatMap((box) => [box.x, box.x + box.width]),
      ...endpoints.flatMap((item) => [
        item.start.x,
        item.end.x,
        item.bounds.x,
        item.bounds.x + item.bounds.width,
      ]),
    ]),
  ].sort((a, b) => a - b);
  const ys = [
    ...new Set([
      global.y,
      global.y + global.height,
      ...obstacles.flatMap((box) => [box.y, box.y + box.height]),
      ...lanes.values(),
      ...endpoints.flatMap((item) => [
        item.start.y,
        item.end.y,
        item.bounds.y,
        item.bounds.y + item.bounds.height,
      ]),
    ]),
  ].sort((a, b) => a - b);
  const routes = new Map<string, Route>();
  const usage = new Map<string, number>();
  const labels: Box[] = [];
  for (const { edge, source, target, start, end, bounds } of endpoints) {
    const lane = lanes.get(edge.id);
    const stops =
      lane === undefined
        ? [start, end]
        : [start, { x: start.x, y: lane }, { x: end.x, y: lane }, end];
    const path: Point[] = [];
    let blocked = false;
    for (let index = 1; index < stops.length; index++) {
      const a = stops[index - 1],
        b = stops[index];
      if (!a || !b) continue;
      const part = findPath(a, b, xs, ys, obstacles, bounds, usage);
      if (!part) {
        blocked = true;
        break;
      }
      path.push(...part);
    }
    if (blocked) {
      routes.set(edge.id, {
        status: 'error',
        message: 'No clear connection route is available within this layout.',
        label: start,
      });
      continue;
    }
    const points = compress([
      { x: source.x + source.width, y: start.y },
      ...path,
      { x: target.x, y: end.y },
    ]);
    const text = edge.label ?? 'Inspect contract';
    let lines = 1;
    let columns = 0;
    for (const word of String(text).split(/\s+/)) {
      if (columns && columns + word.length + 1 > 12) {
        lines++;
        columns = 0;
      }
      lines += Math.max(0, Math.ceil(word.length / 12) - 1);
      columns = (columns ? columns + 1 : 0) + (word.length % 12 || 12);
    }
    const height = Math.max(20, lines * 15 + 8);
    const segments = points
      .slice(1)
      .flatMap((b, index) => {
        const a = points[index];
        return a
          ? [{ a, b, length: Math.abs(a.x - b.x) + Math.abs(a.y - b.y) }]
          : [];
      })
      .sort((a, b) => b.length - a.length);
    let label: Point | undefined;
    for (const segment of segments) {
      for (const ratio of [0.5, 0.25, 0.75]) {
        const candidate = {
          x: segment.a.x + (segment.b.x - segment.a.x) * ratio,
          y: segment.a.y + (segment.b.y - segment.a.y) * ratio,
        };
        const box = {
          x: candidate.x - LABEL_WIDTH / 2,
          y: candidate.y - height / 2,
          width: LABEL_WIDTH,
          height,
        };
        if (
          box.x < bounds.x ||
          box.x + box.width > bounds.x + bounds.width ||
          box.y < bounds.y ||
          box.y + box.height > bounds.y + bounds.height
        )
          continue;
        if (
          !obstacles.some((other) => overlaps(box, other)) &&
          !labels.some((other) => overlaps(box, other))
        ) {
          label = candidate;
          labels.push(box);
          break;
        }
      }
      if (label) break;
    }
    // Short routes may have no room for an inline label; keep their label beside the source port.
    if (!label) label = { x: start.x, y: start.y - 24 };
    routes.set(edge.id, { status: 'success', points, label });
  }
  return routes;
}

/** Round orthogonal corners without changing the obstacle-free corridor. */
export function roundedRoute(points: Point[]): string {
  const first = points[0];
  if (!first) return '';
  let path = `M ${first.x} ${first.y}`;
  for (let index = 1; index < points.length; index++) {
    const current = points[index],
      next = points[index + 1],
      previous = points[index - 1];
    if (!current || !previous) continue;
    if (!next) {
      path += ` L ${current.x} ${current.y}`;
      continue;
    }
    const radius = Math.min(
      8,
      (Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y)) / 2,
      (Math.abs(next.x - current.x) + Math.abs(next.y - current.y)) / 2,
    );
    const before = {
      x: current.x - Math.sign(current.x - previous.x) * radius,
      y: current.y - Math.sign(current.y - previous.y) * radius,
    };
    const after = {
      x: current.x + Math.sign(next.x - current.x) * radius,
      y: current.y + Math.sign(next.y - current.y) * radius,
    };
    path += ` L ${before.x} ${before.y} Q ${current.x} ${current.y} ${after.x} ${after.y}`;
  }
  return path;
}
