import type { Node, NodeProps } from '@xyflow/react';
import type { DesignerGroup } from '../lib/types';
import { groupAppearance } from '../lib/group-colors';
import { NodeSymbol } from './NodeSymbol';
import * as s from '../styles/viewer.css';

export type GroupFlowNode = Node<{ definition: DesignerGroup }, 'domainGroup'>;

export function GroupNode({ data }: NodeProps<GroupFlowNode>) {
  const appearance = groupAppearance(data.definition.color);
  return (
    <div
      className={s.groupContainer}
      style={
        appearance.status === 'success'
          ? { background: appearance.fill, borderColor: appearance.border }
          : undefined
      }
    >
      <div
        className={s.groupHeading}
        style={
          appearance.status === 'success'
            ? { color: appearance.ink }
            : undefined
        }
      >
        <NodeSymbol name={data.definition.icon ?? 'layers'} />
        <h2 className={s.groupName} title={data.definition.name}>
          {data.definition.name}
        </h2>
        {appearance.status === 'error' && (
          <span className={s.bad}>Invalid color</span>
        )}
      </div>
    </div>
  );
}
