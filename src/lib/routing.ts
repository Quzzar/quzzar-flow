import type { DesignerGraph } from './types';
import type { GroupBounds, NodeSize } from './group-layout';

export const SIDES = ['right', 'left', 'bottom', 'top'] as const;
export type Side = (typeof SIDES)[number];
export type Point = { x: number; y: number };
export type Route =
  | {
      status: 'success';
      points: Point[];
      label: Point;
      sourceSide: Side;
      targetSide: Side;
    }
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
  visibility: { points: Map<number, boolean>; segments: Map<string, boolean> },
): { points: Point[]; cost: number } | undefined {
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
    let free = visibility.points.get(index);
    if (free === undefined) {
      free = !obstacles.some((box) => inside(p, box));
      visibility.points.set(index, free);
    }
    const valid =
      p.x >= bounds.x &&
      p.x <= bounds.x + bounds.width &&
      p.y >= bounds.y &&
      p.y <= bounds.y + bounds.height &&
      free;
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
      const segmentKey = edgeKey(index, neighbor);
      let clear = visibility.segments.get(segmentKey);
      if (clear === undefined) {
        clear = !obstacles.some((box) =>
          segmentIntersectsBox(current, next, box),
        );
        visibility.segments.set(segmentKey, clear);
      }
      if (!clear) continue;
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
  return { points: indices.map(point), cost: costs.get(terminal) ?? Infinity };
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
  function ports(box: Box, bounds: Box) {
    return SIDES.map((side) => {
      const anchor =
        side === 'left'
          ? { x: box.x, y: box.y + box.height / 2 }
          : side === 'right'
            ? { x: box.x + box.width, y: box.y + box.height / 2 }
            : side === 'top'
              ? { x: box.x + box.width / 2, y: box.y }
              : { x: box.x + box.width / 2, y: box.y + box.height };
      const point = {
        x: Math.max(
          bounds.x,
          Math.min(
            bounds.x + bounds.width,
            anchor.x + (side === 'right' ? 24 : side === 'left' ? -24 : 0),
          ),
        ),
        y: Math.max(
          bounds.y,
          Math.min(
            bounds.y + bounds.height,
            anchor.y + (side === 'bottom' ? 24 : side === 'top' ? -24 : 0),
          ),
        ),
      };
      return { side, anchor, point };
    }).filter((port) => !obstacles.some((box) => inside(port.point, box)));
  }
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
        sources: ports(source, bounds),
        targets: ports(target, bounds),
      },
    ];
  });
  const xs = [
    ...new Set([
      global.x,
      global.x + global.width,
      ...obstacles.flatMap((box) => [box.x, box.x + box.width]),
      ...endpoints.flatMap((item) => [
        ...item.sources.map((port) => port.point.x),
        ...item.targets.map((port) => port.point.x),
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
        ...item.sources.map((port) => port.point.y),
        ...item.targets.map((port) => port.point.y),
        item.bounds.y,
        item.bounds.y + item.bounds.height,
      ]),
    ]),
  ].sort((a, b) => a - b);
  const routes = new Map<string, Route>();
  const usage = new Map<string, number>();
  const labels: Box[] = [];
  const visibility = {
    points: new Map<number, boolean>(),
    segments: new Map<string, boolean>(),
  };
  const distance = (a: Point, b: Point) =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  for (const { edge, source, bounds, sources, targets } of endpoints) {
    const lane = lanes.get(edge.id);
    const candidates = sources
      .flatMap((from) =>
        targets.map((to) => ({
          from,
          to,
          lowerBound:
            distance(from.point, to.point) +
            distance(from.anchor, from.point) +
            distance(to.anchor, to.point),
        })),
      )
      .sort((a, b) => a.lowerBound - b.lowerBound);
    let best:
      | {
          cost: number;
          path: Point[];
          from: (typeof sources)[number];
          to: (typeof targets)[number];
        }
      | undefined;
    for (const { from, to, lowerBound } of candidates) {
      if (edge.source === edge.target && from.side === to.side) continue;
      if (best && lowerBound >= best.cost) continue;
      const stops =
        lane === undefined
          ? [from.point, to.point]
          : [
              from.point,
              { x: from.point.x, y: lane },
              { x: to.point.x, y: lane },
              to.point,
            ];
      const path: Point[] = [];
      let cost =
        distance(from.anchor, from.point) + distance(to.anchor, to.point);
      for (let index = 1; index < stops.length; index++) {
        const a = stops[index - 1],
          b = stops[index];
        if (!a || !b) continue;
        const part = findPath(
          a,
          b,
          xs,
          ys,
          obstacles,
          bounds,
          usage,
          visibility,
        );
        if (!part) {
          cost = Infinity;
          break;
        }
        path.push(...part.points);
        cost += part.cost;
      }
      if (Number.isFinite(cost) && (!best || cost < best.cost))
        best = { cost, path, from, to };
    }
    if (!best) {
      routes.set(edge.id, {
        status: 'error',
        message: 'No clear connection route is available within this layout.',
        label: { x: source.x + source.width, y: source.y + source.height / 2 },
      });
      continue;
    }
    for (let index = 1; index < best.path.length; index++) {
      const a = best.path[index - 1],
        b = best.path[index];
      if (!a || !b || distance(a, b) === 0) continue;
      const ai = ys.indexOf(a.y) * xs.length + xs.indexOf(a.x),
        bi = ys.indexOf(b.y) * xs.length + xs.indexOf(b.x);
      const key = ai < bi ? `${ai}:${bi}` : `${bi}:${ai}`;
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
    const start = best.from.point;
    const points = compress([best.from.anchor, ...best.path, best.to.anchor]);
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
    routes.set(edge.id, {
      status: 'success',
      points,
      label,
      sourceSide: best.from.side,
      targetSide: best.to.side,
    });
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

export type DirectionMarker = Point & { angle: number };

/** Static chevrons follow source-to-target order, clear of corners, endpoints, and labels. */
export function directionMarkers(
  points: Point[],
  label: Point,
): DirectionMarker[] {
  let offset = 0;
  const segments = points.slice(1).flatMap((b, index) => {
    const a = points[index];
    if (!a) return [];
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    const segment = { a, b, length, start: offset };
    offset += length;
    return [segment];
  });
  if (offset < 240) return [];
  const count = Math.min(8, Math.max(1, Math.floor(offset / 360)));
  const markers: DirectionMarker[] = [];
  for (let index = 1; index <= count; index++) {
    const preferred = (offset * index) / (count + 1);
    for (const adjustment of [0, -70, 70, -110, 110]) {
      const distance = preferred + adjustment;
      if (distance < 48 || distance > offset - 48) continue;
      const segment = segments.find(
        (segment) =>
          distance >= segment.start + 20 &&
          distance <= segment.start + segment.length - 20,
      );
      if (!segment) continue;
      const ratio = (distance - segment.start) / segment.length;
      const point = {
        x: segment.a.x + (segment.b.x - segment.a.x) * ratio,
        y: segment.a.y + (segment.b.y - segment.a.y) * ratio,
      };
      if (Math.abs(point.x - label.x) < 52 && Math.abs(point.y - label.y) < 40)
        continue;
      if (
        markers.some(
          (marker) =>
            Math.abs(marker.x - point.x) + Math.abs(marker.y - point.y) < 100,
        )
      )
        continue;
      markers.push({
        ...point,
        angle:
          (Math.atan2(segment.b.y - segment.a.y, segment.b.x - segment.a.x) *
            180) /
          Math.PI,
      });
      break;
    }
  }
  return markers;
}
