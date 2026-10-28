import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { Maximize, Minus, Plus, GitFork, CheckCheck } from 'lucide-react';
import { Tooltip } from 'radix-ui';
import type { ReactNode } from 'react';
import type {
  DesignerGraph,
  DesignerOptions,
  HeaderContent,
} from '../lib/types';
import { validateGraph } from '../lib/validate';
import { layoutGraph } from '../lib/layout';
import { routeGraph } from '../lib/routing';
import { layoutGroupedGraph } from '../lib/group-layout';
import type { NodeSize } from '../lib/group-layout';
import { GroupNode } from './GroupNode';
import type { GroupFlowNode } from './GroupNode';
import { OperationNode } from './OperationNode';
import type { OperationFlowNode } from './OperationNode';
import { ConnectionEdge } from './ConnectionEdge';
import type { ConnectionFlowEdge } from './ConnectionEdge';
import { Inspector } from './Inspector';
import { ViewerHeader } from './ViewerHeader';
import type { Selection } from './Inspector';
import { tokens as t } from '../styles/tokens.css';
import * as s from '../styles/viewer.css';
import '@xyflow/react/dist/style.css';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/latin-400.css';

type ViewerFlowNode = OperationFlowNode | GroupFlowNode;
const nodeTypes = { operation: OperationNode, domainGroup: GroupNode };
const edgeTypes = { connection: ConnectionEdge };
const FIT_VIEW_OPTIONS = { padding: 0.14 };

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

function CanvasControls({ fitGraph }: { fitGraph: () => void }) {
  const { zoomIn, zoomOut } = useReactFlow();
  return (
    <div className={s.canvasControls} aria-label="Canvas controls">
      <IconButton label="Zoom out" onClick={() => void zoomOut()}>
        <Minus size={16} />
      </IconButton>
      <IconButton label="Zoom in" onClick={() => void zoomIn()}>
        <Plus size={16} />
      </IconButton>
      <div className={s.controlDivider} />
      <IconButton label="Fit graph to view" onClick={fitGraph}>
        <Maximize size={16} />
      </IconButton>
    </div>
  );
}

function Viewer({
  graph,
  options,
  initialNodeId,
  header,
}: {
  graph: DesignerGraph;
  options: DesignerOptions;
  initialNodeId: string | undefined;
  header: HeaderContent;
}) {
  const validationButton = useRef<HTMLButtonElement>(null);
  const { fitView, fitBounds, viewportInitialized } = useReactFlow();
  const [selection, setSelection] = useState<Selection | null>(() => {
    const id = initialNodeId ?? graph.nodes[0]?.id;
    return id ? { type: 'node', id } : null;
  });
  const result = useMemo(() => validateGraph(graph), [graph]);
  const hasGroups = Boolean(graph.groups?.length);
  const canvasRef = useRef<HTMLDivElement>(null);
  const focusedNode = useRef<string | null>(null);
  const [nodeSizes, setNodeSizes] = useState<ReadonlyMap<string, NodeSize>>(
    () => new Map(),
  );
  const groupedLayout = useMemo(
    () => (hasGroups ? layoutGroupedGraph(graph, nodeSizes) : null),
    [graph, hasGroups, nodeSizes],
  );
  const positions = useMemo(
    () => groupedLayout?.positions ?? layoutGraph(graph),
    [graph, groupedLayout],
  );
  const routes = useMemo(
    () =>
      routeGraph(
        graph,
        positions,
        nodeSizes,
        groupedLayout?.containers,
        groupedLayout?.parents,
        groupedLayout?.lanes,
      ),
    [graph, positions, nodeSizes, groupedLayout],
  );
  const hasInitialViewFit = useRef(false);
  const operations: OperationFlowNode[] = graph.nodes.map((node) => {
    const measured = nodeSizes.get(node.id);
    const point = positions.get(node.id) ?? { x: 0, y: 0 };
    const parent = node.group
      ? groupedLayout?.containers.get(node.group)
      : undefined;
    return {
      id: node.id,
      type: 'operation',
      ...(measured ? { measured } : {}),
      position: parent
        ? { x: point.x - parent.x, y: point.y - parent.y }
        : point,
      ...(parent && node.group
        ? { parentId: node.group, extent: 'parent' as const }
        : {}),
      zIndex: 2,
      selected: selection?.type === 'node' && selection.id === node.id,
      data: {
        definition: node,
        inputSides: graph.connections.flatMap((edge) => {
          const route = routes.get(edge.id);
          return edge.target === node.id && route?.status === 'success'
            ? [route.targetSide]
            : [];
        }),
        outputSides: graph.connections.flatMap((edge) => {
          const route = routes.get(edge.id);
          return edge.source === node.id && route?.status === 'success'
            ? [route.sourceSide]
            : [];
        }),
        hasInput: graph.connections.some((edge) => edge.target === node.id),
        hasOutput: graph.connections.some((edge) => edge.source === node.id),
        hasError: result.issues.some(
          (issue) => issue.nodeId === node.id && issue.kind === 'error',
        ),
      },
    };
  });
  const containers: GroupFlowNode[] = [
    ...(groupedLayout?.containers ?? []),
  ].flatMap(([id, box]) => {
    const group = graph.groups?.find((group) => group.id === id);
    if (!group) return [];
    const parentId = groupedLayout?.parents.get(id);
    const parent = parentId
      ? groupedLayout?.containers.get(parentId)
      : undefined;
    return [
      {
        id,
        type: 'domainGroup' as const,
        position: { x: box.x - (parent?.x ?? 0), y: box.y - (parent?.y ?? 0) },
        ...(parent && parentId ? { parentId, extent: 'parent' as const } : {}),
        data: { definition: group },
        width: box.width,
        height: box.height,
        selectable: false,
        focusable: false,
        draggable: false,
        connectable: false,
        zIndex: 0,
      },
    ];
  });
  const nodes: ViewerFlowNode[] = [...containers, ...operations];
  const edges: ConnectionFlowEdge[] = graph.connections
    .filter((edge) => positions.has(edge.source) && positions.has(edge.target))
    .map((edge) => {
      const isSelected =
        selection?.type === 'connection' && selection.id === edge.id;
      const route = routes.get(edge.id);
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
        sourceHandle: `source-${route?.status === 'success' ? route.sourceSide : 'right'}`,
        targetHandle: `target-${route?.status === 'success' ? route.targetSide : 'left'}`,
        zIndex: hasGroups ? 1 : 0,
        selected: isSelected,
        data: {
          inspect: () => setSelection({ type: 'connection', id: edge.id }),
          fields,
          route: routes.get(edge.id),
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
  const fitGraph = useCallback(() => {
    focusedNode.current = null;
    const boxes = [
      ...[...(groupedLayout?.containers.values() ?? [])],
      ...[...routes.values()].flatMap((route) =>
        (route.status === 'success' ? route.points : [route.label]).map(
          (point) => ({ ...point, width: 0, height: 0 }),
        ),
      ),
      ...graph.nodes.map((node) => ({
        ...(positions.get(node.id) ?? { x: 0, y: 0 }),
        ...(nodeSizes.get(node.id) ?? { width: 248, height: 260 }),
      })),
    ];
    if (!boxes.length) return;
    const x = Math.min(...boxes.map((box) => box.x));
    const y = Math.min(...boxes.map((box) => box.y));
    const bounds = {
      x,
      y,
      width: Math.max(...boxes.map((box) => box.x + box.width)) - x,
      height: Math.max(...boxes.map((box) => box.y + box.height)) - y,
    };
    const top = bounds.y - 32;
    void fitBounds(
      {
        x: bounds.x - 32,
        y: top,
        width: bounds.width + 64,
        height: bounds.y + bounds.height - top + 32,
      },
      { padding: 0.14 },
    );
  }, [fitBounds, graph, routes, groupedLayout, positions, nodeSizes]);
  useEffect(() => {
    if (
      viewportInitialized &&
      nodeSizes.size >= graph.nodes.length &&
      !hasInitialViewFit.current
    ) {
      hasInitialViewFit.current = true;
      if (graph.nodes.length > 24 && selection?.type === 'node') {
        focusedNode.current = selection.id;
        void fitView({
          nodes: [{ id: selection.id }],
          maxZoom: 1,
          padding: 0.6,
        });
      } else fitGraph();
    }
  }, [
    viewportInitialized,
    nodeSizes.size,
    graph.nodes.length,
    selection,
    fitView,
    fitGraph,
  ]);
  const fitLatest = useRef(fitGraph);
  useEffect(() => {
    fitLatest.current = fitGraph;
  }, [fitGraph]);
  useEffect(() => {
    const element = canvasRef.current;
    if (!element || !viewportInitialized) return;
    let previousWidth = element.clientWidth;
    let previousHeight = element.clientHeight;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (
        Math.abs(width - previousWidth) < 1 &&
        Math.abs(height - previousHeight) < 1
      )
        return;
      previousWidth = width;
      previousHeight = height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (focusedNode.current)
          void fitView({
            nodes: [{ id: focusedNode.current }],
            maxZoom: 1,
            padding: 0.6,
          });
        else fitLatest.current();
      });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [viewportInitialized, fitView]);
  return (
    <Tooltip.Provider delayDuration={250}>
      <div className={s.studio}>
        <header className={s.header}>
          <ViewerHeader content={header} />
          <button
            ref={validationButton}
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
        </header>
        <main
          className={`${s.main} ${!selection ? s.mainExpanded : ''}`}
          aria-label={options.name ?? 'System graph'}
        >
          <div className={s.canvasColumn}>
            <div className={s.canvas} ref={canvasRef}>
              {nodes.length > 0 ? (
                <ReactFlow<ViewerFlowNode, ConnectionFlowEdge>
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  edgesReconnectable={false}
                  deleteKeyCode={null}
                  onPaneClick={() => setSelection(null)}
                  selectionOnDrag={false}
                  zoomOnDoubleClick={false}
                  onNodeDoubleClick={(_, node) => {
                    if (node.type === 'operation') {
                      setSelection({ type: 'node', id: node.id });
                      focusedNode.current = node.id;
                      void fitView({
                        nodes: [{ id: node.id }],
                        padding: 0.6,
                        maxZoom: 1,
                      });
                    }
                  }}
                  elevateNodesOnSelect={false}
                  elevateEdgesOnSelect={false}
                  zIndexMode="manual"
                  onNodeClick={(_, node) =>
                    setSelection(
                      node.type === 'operation'
                        ? { type: 'node', id: node.id }
                        : null,
                    )
                  }
                  onEdgeClick={(_, edge) =>
                    setSelection({
                      type: 'connection',
                      id: edge.id,
                    })
                  }
                  onNodesChange={(changes) => {
                    if (
                      changes.some((change) => change.type === 'dimensions')
                    ) {
                      setNodeSizes((previous) => {
                        const next = new Map(previous);
                        let changed = false;
                        for (const change of changes) {
                          if (
                            change.type !== 'dimensions' ||
                            !change.dimensions ||
                            !graph.nodes.some((node) => node.id === change.id)
                          )
                            continue;
                          const old = previous.get(change.id);
                          if (
                            old?.height !== change.dimensions.height ||
                            old.width !== change.dimensions.width
                          ) {
                            next.set(change.id, change.dimensions);
                            changed = true;
                          }
                        }
                        return changed ? next : previous;
                      });
                    }
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
                      setSelection({
                        type: 'connection',
                        id: selected.id,
                      });
                  }}
                  fitViewOptions={FIT_VIEW_OPTIONS}
                  minZoom={0.02}
                  maxZoom={1.8}
                  style={{ background: t.color.canvas }}
                  colorMode="dark"
                  proOptions={{ hideAttribution: true }}
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
              <CanvasControls fitGraph={fitGraph} />
            </div>
          </div>
          {selection && (
            <Inspector
              graph={graph}
              selection={selection}
              result={result}
              onSelect={(next) => {
                setSelection(next);
                if (next.type === 'node') {
                  focusedNode.current = next.id;
                  void fitView({
                    nodes: [{ id: next.id }],
                    maxZoom: 1,
                    padding: 0.5,
                  });
                }
              }}
              onClose={() => {
                setSelection(null);
                validationButton.current?.focus({ preventScroll: true });
              }}
            />
          )}
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
  header: HeaderContent;
}) {
  return (
    <ReactFlowProvider>
      <Viewer {...props} />
    </ReactFlowProvider>
  );
}
