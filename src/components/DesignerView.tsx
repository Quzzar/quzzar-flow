import { useId, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import {
  CircuitBoard,
  ScanLine,
  LockKeyhole,
  CodeXml,
  Maximize,
  Minus,
  Plus,
  MousePointer2,
  GitFork,
  CheckCheck,
} from 'lucide-react';
import { Tooltip } from 'radix-ui';
import type { ReactNode } from 'react';
import type { DesignerGraph, DesignerOptions } from '../lib/types';
import { validateGraph } from '../lib/validate';
import { COLUMN_WIDTH, layoutGraph } from '../lib/layout';
import { OperationNode } from './OperationNode';
import type { OperationFlowNode } from './OperationNode';
import { ConnectionEdge } from './ConnectionEdge';
import type { ConnectionFlowEdge } from './ConnectionEdge';
import { Inspector } from './Inspector';
import type { Selection } from './Inspector';
import { tokens as t } from '../styles/tokens.css';
import * as s from '../styles/viewer.css';
import '@xyflow/react/dist/style.css';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/latin-400.css';

const nodeTypes = { operation: OperationNode };
const edgeTypes = { connection: ConnectionEdge };

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          className={s.iconButton}
          aria-label={label}
          type="button"
          onClick={onClick}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" sideOffset={8} className={s.tooltip}>
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <div className={s.canvasControls} aria-label="Canvas controls">
      <IconButton label="Zoom out" onClick={() => void zoomOut()}>
        <Minus size={16} />
      </IconButton>
      <IconButton label="Zoom in" onClick={() => void zoomIn()}>
        <Plus size={16} />
      </IconButton>
      <div className={s.controlDivider} />
      <IconButton
        label="Fit graph to view"
        onClick={() => void fitView({ padding: 0.14 })}
      >
        <Maximize size={16} />
      </IconButton>
    </div>
  );
}

function Viewer({
  graph,
  options,
  initialNodeId,
}: {
  graph: DesignerGraph;
  options: DesignerOptions;
  initialNodeId: string | undefined;
}) {
  const pickerId = useId();
  const [selection, setSelection] = useState<Selection>(() => ({
    type: 'node',
    id: initialNodeId ?? graph.nodes[0]?.id ?? '',
  }));
  const result = useMemo(() => validateGraph(graph), [graph]);
  const positions = useMemo(() => layoutGraph(graph), [graph]);
  const nodes: OperationFlowNode[] = graph.nodes.map((node) => ({
    id: node.id,
    type: 'operation',
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    selected: selection.type === 'node' && selection.id === node.id,
    data: {
      definition: node,
      hasInput: graph.connections.some((edge) => edge.target === node.id),
      hasOutput: graph.connections.some((edge) => edge.source === node.id),
      hasError: result.issues.some(
        (issue) => issue.nodeId === node.id && issue.kind === 'error',
      ),
    },
  }));
  const edges: ConnectionFlowEdge[] = graph.connections
    .filter((edge) => positions.has(edge.source) && positions.has(edge.target))
    .map((edge, edgeIndex) => {
      const isSelected =
        selection.type === 'connection' && selection.id === edge.id;
      const sourcePosition = positions.get(edge.source);
      const targetPosition = positions.get(edge.target);
      const spansColumn =
        sourcePosition &&
        targetPosition &&
        targetPosition.x - sourcePosition.x > COLUMN_WIDTH;
      const fields = result.bindings
        .filter((binding) => binding.connectionId === edge.id)
        .map(
          (binding) =>
            binding.inputPath.match(/\["([^"\]]+)"\]$/)?.[1] ??
            binding.inputPath,
        );
      return {
        ...edge,
        type: 'connection',
        selected: isSelected,
        data: {
          inspect: () => setSelection({ type: 'connection', id: edge.id }),
          fields,
          ...(spansColumn
            ? {
                bypassY:
                  Math.min(
                    ...[...positions.values()].map((position) => position.y),
                  ) -
                  80 -
                  edgeIndex * 24,
              }
            : {}),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: isSelected ? t.color.blue : t.color.edge,
        },
        style: {
          stroke: isSelected ? t.color.blue : t.color.edge,
          strokeWidth: isSelected ? 2 : 1.4,
        },
      };
    });
  return (
    <Tooltip.Provider delayDuration={250}>
      <div className={s.studio}>
        <header className={s.header}>
          <div className={s.brand}>
            <span className={s.brandMark}>
              <CircuitBoard size={20} />
            </span>
            <span>
              Quzzar<span className={s.brandDivider}>/</span>
              <span className={s.brandSubtitle}>System Designer</span>
            </span>
          </div>
          <div className={s.row}>
            <span className={s.readOnly}>
              <LockKeyhole size={12} />
              Read-only
            </span>
            <span className={s.controlDivider} />
            <a
              className={s.iconButton}
              href="https://github.com/Quzzar/quzzar-system-designer"
              target="_blank"
              rel="noreferrer"
              aria-label="Open GitHub repository"
            >
              <CodeXml size={17} />
            </a>
          </div>
        </header>
        <div className={s.toolbar}>
          <div>
            <div className={s.row}>
              <h1 className={s.title}>{options.name ?? 'System graph'}</h1>
              <span className={s.badge}>Contract graph</span>
            </div>
            {options.description && (
              <p className={s.description}>{options.description}</p>
            )}
          </div>
          <button
            type="button"
            className={s.button}
            onClick={() => setSelection({ type: 'validation' })}
          >
            <CheckCheck
              size={16}
              className={result.valid ? s.good : s.warning}
            />
            {result.valid
              ? 'Valid graph'
              : result.status === 'invalid'
                ? 'Validation issues'
                : 'Unverified'}
          </button>
        </div>
        <main className={s.main}>
          <div className={s.canvasColumn}>
            <div className={s.mobilePicker}>
              <label htmlFor={pickerId}>Inspect</label>
              <select
                id={pickerId}
                className={s.inspectSelect}
                value={
                  selection.type === 'validation'
                    ? 'validation'
                    : `${selection.type}:${selection.id}`
                }
                onChange={(event) => {
                  const value = event.target.value;
                  if (value.startsWith('node:'))
                    setSelection({ type: 'node', id: value.slice(5) });
                  else if (value.startsWith('connection:'))
                    setSelection({ type: 'connection', id: value.slice(11) });
                  else setSelection({ type: 'validation' });
                }}
              >
                <optgroup label="Nodes">
                  {graph.nodes.map((node) => (
                    <option key={node.id} value={`node:${node.id}`}>
                      {node.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Connections">
                  {graph.connections.map((connection) => (
                    <option
                      key={connection.id}
                      value={`connection:${connection.id}`}
                    >
                      {graph.nodes.find((node) => node.id === connection.source)
                        ?.name ?? connection.source}{' '}
                      →{' '}
                      {graph.nodes.find((node) => node.id === connection.target)
                        ?.name ?? connection.target}
                    </option>
                  ))}
                </optgroup>
                <option value="validation">Graph validation</option>
              </select>
            </div>
            <div className={s.canvas}>
              {graph.nodes.length > 0 ? (
                <ReactFlow<OperationFlowNode, ConnectionFlowEdge>
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  edgesReconnectable={false}
                  deleteKeyCode={null}
                  selectionOnDrag={false}
                  elevateNodesOnSelect={false}
                  onNodeClick={(_, node) =>
                    setSelection({ type: 'node', id: node.id })
                  }
                  onEdgeClick={(_, edge) =>
                    setSelection({ type: 'connection', id: edge.id })
                  }
                  onNodesChange={(changes) => {
                    const selected = changes.find(
                      (change) => change.type === 'select' && change.selected,
                    );
                    if (selected?.type === 'select')
                      setSelection({ type: 'node', id: selected.id });
                  }}
                  onEdgesChange={(changes) => {
                    const selected = changes.find(
                      (change) => change.type === 'select' && change.selected,
                    );
                    if (selected?.type === 'select')
                      setSelection({ type: 'connection', id: selected.id });
                  }}
                  fitView
                  fitViewOptions={{ padding: 0.14 }}
                  minZoom={0.25}
                  maxZoom={1.8}
                  style={{ background: t.color.canvas }}
                  colorMode="dark"
                  aria-label="Read-only system contract graph"
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    bgColor={t.color.canvas}
                    color={t.color.dot}
                    gap={22}
                    size={1}
                  />
                </ReactFlow>
              ) : (
                <div className={s.emptyGraph}>
                  <div>
                    <h2 className={s.title}>No nodes yet</h2>
                    <p className={s.description}>
                      Add nodes through the SystemDesigner API.
                    </p>
                  </div>
                </div>
              )}
              <div className={s.canvasCaption}>
                <GitFork size={14} />
                {graph.nodes.length} nodes<span>·</span>
                {graph.connections.length} connections
              </div>
              <CanvasControls />
            </div>
            <footer className={s.footer}>
              <span className={s.row}>
                <ScanLine
                  size={14}
                  className={result.valid ? s.good : s.warning}
                />
                {result.bindings.length} input fields resolved
              </span>
              <span className={`${s.row} ${s.footerHint}`}>
                <MousePointer2 size={13} />
                Select a node or connection to inspect
              </span>
            </footer>
          </div>
          <Inspector
            graph={graph}
            selection={selection}
            result={result}
            onSelect={setSelection}
          />
        </main>
      </div>
    </Tooltip.Provider>
  );
}

/** The DOM renderer owns React; consumers only provide a mount element. */
export function DesignerView(props: {
  graph: DesignerGraph;
  options: DesignerOptions;
  initialNodeId: string | undefined;
}) {
  return (
    <ReactFlowProvider>
      <Viewer {...props} />
    </ReactFlowProvider>
  );
}
