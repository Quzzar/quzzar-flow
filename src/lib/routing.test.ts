import { describe, expect, test } from 'bun:test';
import { EXAMPLES } from '../../examples';
import { layoutGraph } from './layout';
import { layoutGroupedGraph } from './group-layout';
import { routeGraph, roundedRoute, segmentIntersectsBox } from './routing';

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
