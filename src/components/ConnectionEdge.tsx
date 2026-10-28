import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import type { Edge, EdgeProps } from '@xyflow/react';
import { roundedRoute } from '../lib/routing';
import type { Route } from '../lib/routing';
import * as s from '../styles/viewer.css';

export type ConnectionFlowEdge = Edge<
  {
    inspect: () => void;
    fields: string[];
    route: Route | undefined;
  },
  'connection'
>;

export function ConnectionEdge(props: EdgeProps<ConnectionFlowEdge>) {
  const route = props.data?.route;
  const label =
    props.label ??
    (props.data?.fields.length
      ? props.data.fields.join(', ')
      : 'Inspect contract');
  const points = route?.status === 'success' ? [...route.points] : [];
  if (points.length) {
    const start = points[0],
      next = points[1];
    if (start && next && points.length > 2) {
      if (Math.abs(next.y - start.y) < 1)
        points[1] = { x: next.x, y: props.sourceY };
      else if (Math.abs(next.x - start.x) < 1)
        points[1] = { x: props.sourceX, y: next.y };
    }
    const end = points.at(-1),
      previous = points.at(-2);
    if (end && previous && points.length > 2) {
      if (Math.abs(previous.y - end.y) < 1)
        points[points.length - 2] = { x: previous.x, y: props.targetY };
      else if (Math.abs(previous.x - end.x) < 1)
        points[points.length - 2] = { x: props.targetX, y: previous.y };
    }
    points[0] = { x: props.sourceX, y: props.sourceY };
    points[points.length - 1] = { x: props.targetX, y: props.targetY };
  }
  const position = route?.label ?? { x: props.sourceX, y: props.sourceY };
  const error =
    route?.status === 'error'
      ? route.message
      : !route
        ? 'Connection route is not available.'
        : undefined;
  return (
    <>
      <BaseEdge
        id={props.id}
        path={roundedRoute(points)}
        {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})}
        {...(props.style ? { style: props.style } : {})}
        interactionWidth={24}
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          aria-label={`Inspect connection: ${String(label)}`}
          title={error ?? String(label)}
          className={`${s.edgeLabel} ${props.selected ? s.edgeLabelSelected : ''} ${error ? s.bad : ''} nodrag nopan`}
          style={{
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
          }}
          onClick={props.data?.inspect}
        >
          {error ? `Routing unavailable: ${String(label)}` : label}
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
