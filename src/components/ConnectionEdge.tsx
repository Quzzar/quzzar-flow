import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useViewport,
} from '@xyflow/react';
import type { Edge, EdgeProps } from '@xyflow/react';
import * as s from '../styles/viewer.css';

export type ConnectionFlowEdge = Edge<
  {
    inspect: () => void;
    fields: string[];
    bypassY?: number;
    kind?: 'connection' | 'relationship';
  },
  'connection'
>;

export function ConnectionEdge(props: EdgeProps<ConnectionFlowEdge>) {
  const { zoom } = useViewport();
  const normal = getBezierPath(props);
  const lane = props.data?.bypassY;
  const [path, x, y] =
    lane === undefined
      ? normal
      : ([
          `M ${props.sourceX} ${props.sourceY} C ${props.sourceX + 48} ${props.sourceY}, ${props.sourceX + 48} ${lane}, ${props.sourceX + 96} ${lane} L ${props.targetX - 96} ${lane} C ${props.targetX - 48} ${lane}, ${props.targetX - 48} ${props.targetY}, ${props.targetX} ${props.targetY}`,
          (props.sourceX + props.targetX) / 2,
          lane,
        ] as const);
  const label =
    props.label ??
    (props.data?.fields.length
      ? props.data.fields.join(', ')
      : 'Inspect contract');
  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})}
        {...(props.style ? { style: props.style } : {})}
        interactionWidth={24}
      />
      {(zoom >= 0.4 || props.selected) && (
        <EdgeLabelRenderer>
          <button
            type="button"
            aria-label={`Inspect ${props.data?.kind ?? 'connection'}: ${String(label)}`}
            className={`${s.edgeLabel} ${props.data?.kind === 'relationship' ? s.relationshipLabel : ''} ${props.selected ? s.edgeLabelSelected : ''} nodrag nopan`}
            style={{
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
            }}
            onClick={props.data?.inspect}
          >
            {typeof label === 'string' ? label.replaceAll(', ', '\n') : label}
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
