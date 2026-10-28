import { ArrowRight, CheckCheck, Link2, ScanLine, X } from 'lucide-react';
import { Tabs } from 'radix-ui';
import type { ReactNode } from 'react';
import type {
  DesignerGraph,
  DesignerNode,
  ValidationResult,
} from '../lib/types';
import { describeSchema } from '../lib/schema';
import { ContractView } from './ContractView';
import { ContentBlocks } from './ContentBlocks';
import { BindingList } from './BindingList';
import * as s from '../styles/viewer.css';

export type Selection =
  | { type: 'node'; id: string }
  | { type: 'connection'; id: string }
  | { type: 'validation' };

function InspectorFrame({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <aside
      className={s.inspector}
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className={s.inspectorControls}>
        <button
          type="button"
          className={`${s.iconButton} ${s.closeInspector}`}
          aria-label="Close inspector"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </aside>
  );
}

function NodeContract({
  node,
  direction,
  title,
}: {
  node: DesignerNode;
  direction: 'input' | 'output';
  title?: string;
}) {
  const result = describeSchema(node[direction], direction);
  return (
    <section className={s.section}>
      <h3 className={s.sectionHeading}>
        {title ??
          (direction === 'input' ? 'Input contract' : 'Output contract')}
      </h3>
      {result.status === 'success' ? (
        <>
          <ContractView schema={result.schema} />
          {result.warnings.map((warning) => (
            <p key={warning} className={s.warning}>
              {warning}
            </p>
          ))}
        </>
      ) : (
        <p className={s.warning}>{result.message}</p>
      )}
    </section>
  );
}

export function Inspector({
  graph,
  selection,
  result,
  onSelect,
  onClose,
}: {
  graph: DesignerGraph;
  selection: Selection;
  result: ValidationResult;
  onSelect: (selection: Selection) => void;
  onClose: () => void;
}) {
  if (selection.type === 'validation')
    return (
      <InspectorFrame label="Validation inspector" onClose={onClose}>
        <div className={s.inspectorHeader}>
          <div className={s.row}>
            <ScanLine size={17} className={s.muted} />
            <h2 className={s.sectionTitle}>Graph validation</h2>
          </div>
          <p className={s.description}>
            Structural compatibility and inferred field sources.
          </p>
        </div>
        <section className={s.section}>
          <div
            className={`${s.row} ${result.valid ? s.good : result.status === 'invalid' ? s.bad : s.warning}`}
          >
            <CheckCheck size={17} />
            <strong>
              {result.valid
                ? 'All contracts fit'
                : result.status === 'invalid'
                  ? 'Contract issues found'
                  : 'Manual verification needed'}
            </strong>
          </div>
          <p className={s.description}>
            {result.connectionsChecked} connections checked ·{' '}
            {result.bindings.length} fields resolved
          </p>
          <p className={s.paragraph}>
            Processing descriptions are not executed or verified.
          </p>
          {result.issues.map((issue, index) => (
            <div key={index} className={s.issue}>
              <div className={issue.kind === 'error' ? s.bad : s.warning}>
                {issue.kind === 'error' ? 'Mismatch' : 'Unverified'} ·{' '}
                {issue.code}
              </div>
              <code className={s.bindingPath}>{issue.path}</code>
              <p className={s.paragraph}>{issue.message}</p>
              {issue.suggestions?.map((suggestion) => (
                <div
                  className={s.mappingSuggestion}
                  key={`${suggestion.connectionId}-${JSON.stringify(suggestion.mapping)}`}
                >
                  <span className={s.muted}>
                    Choose {suggestion.sourceNodeId}: update its existing
                    connection:
                  </span>
                  <pre
                    className={s.code}
                  >{`sd.connect(${JSON.stringify(suggestion.sourceNodeId)}, ${JSON.stringify(issue.nodeId)}, {\n  map: [${JSON.stringify(suggestion.mapping)}]\n})`}</pre>
                </div>
              ))}
              {issue.nodeId && (
                <button
                  className={s.button}
                  type="button"
                  onClick={() =>
                    onSelect({ type: 'node', id: issue.nodeId ?? '' })
                  }
                >
                  Inspect node <ArrowRight size={14} />
                </button>
              )}
            </div>
          ))}
        </section>
        <section className={s.section}>
          <h3 className={s.sectionHeading}>How inference works</h3>
          <p className={s.paragraph}>
            Explicit mappings choose the source first. Otherwise, exact field
            paths take precedence over matching names at another depth. Required
            inputs need a guaranteed, compatible source. Multiple candidates are
            reported as ambiguous.
          </p>
        </section>
      </InspectorFrame>
    );

  if (selection.type === 'connection') {
    const connection = graph.connections.find(
      (item) => item.id === selection.id,
    );
    const source = graph.nodes.find((node) => node.id === connection?.source);
    const target = graph.nodes.find((node) => node.id === connection?.target);
    if (!connection || !source || !target)
      return (
        <InspectorFrame label="Inspector" onClose={onClose}>
          <p className={s.empty}>This connection references a missing node.</p>
        </InspectorFrame>
      );
    const bindings = result.bindings.filter(
      (binding) => binding.connectionId === connection.id,
    );
    return (
      <InspectorFrame label="Connection inspector" onClose={onClose}>
        <div className={s.inspectorHeader}>
          <div className={s.row}>
            <Link2 size={17} className={s.nodeIcon} />
            <h2 className={s.sectionTitle}>
              {connection.label || 'Connection'}
            </h2>
          </div>
          <p className={s.description}>
            {source.name} → {target.name}
          </p>
        </div>
        <section className={s.section}>
          <h3 className={s.sectionHeading}>Consumed from this connection</h3>
          {bindings.length ? (
            bindings.map((binding) => (
              <div className={s.binding} key={binding.inputPath}>
                <div className={s.bindingPath}>
                  {binding.outputPath}{' '}
                  {binding.mode === 'explicit' && (
                    <span className={s.badge}>explicit</span>
                  )}
                </div>
                <div className={s.bindingSource}>
                  <ArrowRight size={12} />
                  {binding.inputPath}
                </div>
              </div>
            ))
          ) : (
            <p className={s.paragraph}>
              No fields resolved from this connection.
            </p>
          )}
        </section>
        <NodeContract
          node={source}
          direction="output"
          title="Available upstream output"
        />
        <NodeContract
          node={target}
          direction="input"
          title="Consumer’s complete input contract"
        />
        {result.bindings.some(
          (binding) =>
            binding.nodeId === target.id &&
            binding.connectionId !== connection.id,
        ) && (
          <section className={s.section}>
            <h3 className={s.sectionHeading}>Supplied by other connections</h3>
            {result.bindings
              .filter(
                (binding) =>
                  binding.nodeId === target.id &&
                  binding.connectionId !== connection.id,
              )
              .map((binding) => (
                <div key={binding.inputPath} className={s.binding}>
                  <div className={s.bindingPath}>
                    {binding.inputPath}{' '}
                    {binding.mode === 'explicit' && (
                      <span className={s.badge}>explicit</span>
                    )}
                  </div>
                  <div className={s.bindingSource}>
                    ← {binding.sourceNodeId} <code>{binding.outputPath}</code>
                  </div>
                </div>
              ))}
          </section>
        )}
      </InspectorFrame>
    );
  }

  const node = graph.nodes.find((item) => item.id === selection.id);
  if (!node)
    return (
      <InspectorFrame label="Inspector" onClose={onClose}>
        <p className={s.empty}>Select a node or connection to inspect it.</p>
      </InspectorFrame>
    );
  const bindings = result.bindings.filter(
    (binding) => binding.nodeId === node.id,
  );
  return (
    <InspectorFrame label="Node inspector" onClose={onClose}>
      <div className={s.inspectorHeader}>
        <h2 className={s.sectionTitle}>{node.name}</h2>
        <p className={s.description}>
          <code>{node.id}</code>
        </p>
      </div>
      <Tabs.Root defaultValue="details" key={node.id}>
        <Tabs.List className={s.tabs} aria-label="Node details">
          <Tabs.Trigger className={s.tab} value="details">
            Details
          </Tabs.Trigger>
          <Tabs.Trigger className={s.tab} value="input">
            Input
          </Tabs.Trigger>
          <Tabs.Trigger className={s.tab} value="output">
            Output
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="details">
          <section className={s.section}>
            <h3 className={s.sectionHeading}>Processing</h3>
            <p className={s.paragraph}>{node.processing}</p>
          </section>
          {bindings.length > 0 && (
            <section className={s.section}>
              <h3 className={s.sectionHeading}>Where inputs come from</h3>
              <BindingList
                bindings={bindings}
                graph={graph}
                onInspectNode={(id) => onSelect({ type: 'node', id })}
              />
            </section>
          )}
          {node.additionalInfo && (
            <section className={s.section}>
              <h3 className={s.sectionHeading}>Additional information</h3>
              <p className={s.paragraph}>{node.additionalInfo}</p>
            </section>
          )}
          {node.render && (
            <section className={s.section}>
              <h3 className={s.sectionHeading}>Node content</h3>
              <ContentBlocks blocks={node.render} />
            </section>
          )}
          {result.issues
            .filter((issue) => issue.nodeId === node.id)
            .map((issue, index) => (
              <section className={s.section} key={index}>
                <div className={issue.kind === 'error' ? s.bad : s.warning}>
                  {issue.path}
                </div>
                <p className={s.paragraph}>{issue.message}</p>
              </section>
            ))}
        </Tabs.Content>
        <Tabs.Content value="input">
          <NodeContract node={node} direction="input" />
        </Tabs.Content>
        <Tabs.Content value="output">
          <NodeContract node={node} direction="output" />
        </Tabs.Content>
      </Tabs.Root>
    </InspectorFrame>
  );
}
