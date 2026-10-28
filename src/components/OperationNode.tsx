import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import type { DesignerNode } from '../lib/types';
import { ContentBlocks } from './ContentBlocks';
import { NodeSymbol } from './NodeSymbol';
import { SIDES } from '../lib/routing';
import type { Side } from '../lib/routing';
import * as s from '../styles/viewer.css';

export type OperationFlowNode = Node<
  {
    definition: DesignerNode;
    hasInput: boolean;
    hasOutput: boolean;
    hasError: boolean;
    inputSides: Side[];
    outputSides: Side[];
  },
  'operation'
>;

const POSITIONS: Record<Side, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

export function OperationNode({
  data,
  selected,
}: NodeProps<OperationFlowNode>) {
  const icon =
    data.definition.icon ??
    (!data.hasInput ? 'braces' : !data.hasOutput ? 'check' : 'function');
  return (
    <div className={`${s.node} ${selected ? s.nodeSelected : ''}`}>
      {SIDES.flatMap((side) =>
        [
          { type: 'target' as const, active: data.inputSides.includes(side) },
          { type: 'source' as const, active: data.outputSides.includes(side) },
        ].map(({ type, active }) => (
          <Handle
            key={`${type}-${side}`}
            id={`${type}-${side}`}
            className={`${s.handle} ${active ? '' : s.inactiveHandle}`}
            type={type}
            position={POSITIONS[side]}
            isConnectable={false}
          />
        )),
      )}
      <div className={s.nodeHeader}>
        {icon !== 'none' && (
          <span className={s.nodeIcon}>
            <NodeSymbol name={icon} />
          </span>
        )}
        <h2 className={s.nodeName}>{data.definition.name}</h2>
        {data.hasError && <span className={`${s.badge} ${s.bad}`}>Issue</span>}
      </div>
      <div className={s.nodeBody}>
        {data.definition.render ? (
          <ContentBlocks blocks={data.definition.render} compact />
        ) : (
          <p className={s.nodeDescription}>{data.definition.processing}</p>
        )}
      </div>
    </div>
  );
}
