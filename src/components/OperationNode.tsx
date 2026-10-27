import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import {
  Braces,
  Check,
  FunctionSquare,
  Database,
  Image,
  Table2,
  FileText,
} from 'lucide-react';
import type { DesignerNode } from '../lib/types';
import { ContentBlocks } from './ContentBlocks';
import * as s from '../styles/viewer.css';

export type OperationFlowNode = Node<
  {
    definition: DesignerNode;
    hasInput: boolean;
    hasOutput: boolean;
    hasError: boolean;
  },
  'operation'
>;

export function OperationNode({
  data,
  selected,
}: NodeProps<OperationFlowNode>) {
  const icons = {
    braces: Braces,
    check: Check,
    function: FunctionSquare,
    database: Database,
    image: Image,
    table: Table2,
    file: FileText,
  };
  const icon =
    data.definition.icon ??
    (!data.hasInput ? 'braces' : !data.hasOutput ? 'check' : 'function');
  const Icon = icon === 'none' ? undefined : icons[icon];
  return (
    <div className={`${s.node} ${selected ? s.nodeSelected : ''}`}>
      {data.hasInput && (
        <Handle
          className={s.handle}
          type="target"
          position={Position.Left}
          isConnectable={false}
        />
      )}
      <div className={s.nodeHeader}>
        {Icon && (
          <span className={s.nodeIcon}>
            <Icon size={17} />
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
      {data.hasOutput && (
        <Handle
          className={s.handle}
          type="source"
          position={Position.Right}
          isConnectable={false}
        />
      )}
    </div>
  );
}
