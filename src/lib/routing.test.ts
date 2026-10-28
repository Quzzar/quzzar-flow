import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { SystemDesigner } from './system-designer';
import { EXAMPLES } from '../../examples';
import { layoutGraph } from './layout';
import { layoutGroupedGraph } from './group-layout';
import {
  routeGraph,
  roundedRoute,
  segmentIntersectsBox,
  directionMarkers,
} from './routing';

describe('obstacle routing', () => {
  for (const example of EXAMPLES) {
    test(`${example.id}: every connection reaches its target without crossing another card`, () => {
      const graph = example.create().getGraph();
      const grouped = graph.groups?.length
        ? layoutGroupedGraph(graph, new Map())
        : undefined;
      const positions = grouped?.positions ?? layoutGraph(graph);
      const routes = routeGraph(
        graph,
        positions,
        new Map(),
        grouped?.containers,
        grouped?.parents,
        grouped?.lanes,
      );
      expect(routes.size).toBe(graph.connections.length);
      for (const edge of graph.connections) {
        const route = routes.get(edge.id);
        expect(route?.status, `${edge.source} → ${edge.target}`).toBe(
          'success',
        );
        if (!route || route.status !== 'success') continue;
        expect(roundedRoute(route.points)).not.toContain('NaN');
        const collisions: string[] = [];
        for (let index = 1; index < route.points.length; index++) {
          const a = route.points[index - 1],
            b = route.points[index];
          if (!a || !b) continue;
          for (const node of graph.nodes) {
            if (node.id === edge.source || node.id === edge.target) continue;
            const position = positions.get(node.id);
            if (!position) continue;
            if (
              segmentIntersectsBox(a, b, {
                ...position,
                width: 248,
                height: 260,
              })
            )
              collisions.push(`${edge.id} crosses ${node.id}`);
          }
        }
        expect(collisions).toEqual([]);
      }
    });
  }
});

describe('automatic attachment sides', () => {
  function fixture() {
    const sd = new SystemDesigner();
    for (const id of ['a', 'b'])
      sd.add({
        id,
        name: id,
        input: z.object({}),
        output: z.object({}),
        processing: 'Describe.',
      });
    sd.connect('a', 'b');
    return sd;
  }
  test('right-to-left flow exits left and enters right without wrapping around the cards', () => {
    const route = routeGraph(
      fixture().getGraph(),
      new Map([
        ['a', { x: 500, y: 0 }],
        ['b', { x: 0, y: 0 }],
      ]),
      new Map(),
    ).get('connection-1');
    expect(route?.status).toBe('success');
    if (!route || route.status !== 'success') return;
    expect(route.sourceSide).toBe('left');
    expect(route.targetSide).toBe('right');
    expect(route.points).toEqual([
      { x: 500, y: 130 },
      { x: 248, y: 130 },
    ]);
  });
  test('vertical flow uses bottom and top attachments', () => {
    const route = routeGraph(
      fixture().getGraph(),
      new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 0, y: 500 }],
      ]),
      new Map(),
    ).get('connection-1');
    expect(route?.status).toBe('success');
    if (!route || route.status !== 'success') return;
    expect(route.sourceSide).toBe('bottom');
    expect(route.targetSide).toBe('top');
    expect(route.points).toEqual([
      { x: 124, y: 260 },
      { x: 124, y: 500 },
    ]);
  });
  test('a self-loop uses distinct ports and has a nonzero path', () => {
    const sd = fixture();
    sd.connect('a', 'a');
    const route = routeGraph(
      sd.getGraph(),
      new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 500, y: 0 }],
      ]),
      new Map(),
    ).get('connection-2');
    expect(route?.status).toBe('success');
    if (!route || route.status !== 'success') return;
    expect(route.sourceSide).not.toBe(route.targetSide);
    expect(route.points.length).toBeGreaterThan(2);
  });
});

describe('static direction chevrons', () => {
  test('short connections keep only their destination arrowhead', () => {
    expect(
      directionMarkers(
        [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
        ],
        { x: 100, y: 0 },
      ),
    ).toEqual([]);
  });
  for (const [end, angle] of [
    [{ x: 800, y: 0 }, 0],
    [{ x: -800, y: 0 }, 180],
    [{ x: 0, y: 800 }, 90],
    [{ x: 0, y: -800 }, -90],
  ] as const) {
    test(`markers point in source-to-target direction ${angle}`, () => {
      const markers = directionMarkers([{ x: 0, y: 0 }, end], {
        x: 1500,
        y: 1500,
      });
      expect(markers.length).toBeGreaterThan(1);
      expect(markers.every((marker) => marker.angle === angle)).toBe(true);
    });
  }
  test('markers avoid labels and corners on long bent paths', () => {
    const label = { x: 300, y: 250 };
    const markers = directionMarkers(
      [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 500 },
        { x: 900, y: 500 },
      ],
      label,
    );
    expect(markers.length).toBeGreaterThan(1);
    for (const marker of markers) {
      expect(
        Math.abs(marker.x - label.x) >= 52 ||
          Math.abs(marker.y - label.y) >= 40,
      ).toBe(true);
      expect(marker.y === 0 || marker.x === 300 || marker.y === 500).toBe(true);
    }
  });
});
