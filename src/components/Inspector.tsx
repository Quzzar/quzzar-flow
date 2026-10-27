import { ArrowRight, CheckCheck, Link2, ScanLine } from 'lucide-react';
import { Tabs } from 'radix-ui';
import type {
  DesignerGraph,
  DesignerNode,
  ValidationResult,
} from '../lib/types';
import { describeSchema } from '../lib/schema';
import { ContractView } from './ContractView';
import { ContentBlocks } from './ContentBlocks';
import * as s from '../styles/viewer.css';

export type Selection =
  | { type: 'node'; id: string }
  | { type: 'connection'; id: string }
  | { type: 'validation' };

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
}: {
  graph: DesignerGraph;
  selection: Selection;
  result: ValidationResult;
  onSelect: (selection: Selection) => void;
}) {
  if (selection.type === 'validation')
    return (
      <aside className={s.inspector} aria-label="Validation inspector">
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
            Exact field paths first, then matching field names at any depth.
            Required inputs need a guaranteed, compatible source. Multiple
            candidates are reported as ambiguous.
          </p>
        </section>
      </aside>
    );

  if (selection.type === 'connection') {
    const connection = graph.connections.find(
      (item) => item.id === selection.id,
    );
    const source = graph.nodes.find((node) => node.id === connection?.source);
    const target = graph.nodes.find((node) => node.id === connection?.target);
    if (!connection || !source || !target)
      return (
        <aside className={s.inspector}>
          <p className={s.empty}>This connection references a missing node.</p>
        </aside>
      );
    const bindings = result.bindings.filter(
      (binding) => binding.connectionId === connection.id,
    );
    return (
      <aside className={s.inspector} aria-label="Connection inspector">
        <div className={s.inspectorHeader}>
          <div className={s.row}>
            <Link2 size={17} className={s.nodeIcon} />
            <h2 className={s.sectionTitle}>Connection</h2>
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
                <div className={s.bindingPath}>{binding.outputPath}</div>
                <div className={s.bindingSource}>
                  <ArrowRight size={12} />
                  {binding.inputPath}
                </div>
              </div>
            ))
          ) : (
            <p className={s.paragraph}>
              No field mapping could be proven for this connection.
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
                  <div className={s.bindingPath}>{binding.inputPath}</div>
                  <div className={s.bindingSource}>
                    ← {binding.sourceNodeId} <code>{binding.outputPath}</code>
                  </div>
                </div>
              ))}
          </section>
        )}
      </aside>
    );
  }

  const node = graph.nodes.find((item) => item.id === selection.id);
  if (!node)
    return (
      <aside className={s.inspector}>
        <p className={s.empty}>Select a node or connection to inspect it.</p>
      </aside>
    );
  const bindings = result.bindings.filter(
    (binding) => binding.nodeId === node.id,
  );
  return (
    <aside className={s.inspector} aria-label="Node inspector">
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
              {bindings.map((binding) => (
                <div key={binding.inputPath} className={s.binding}>
                  <div className={s.bindingPath}>{binding.inputPath}</div>
                  <div className={s.bindingSource}>
                    ← {binding.sourceNodeId} <code>{binding.outputPath}</code>
                  </div>
                </div>
              ))}
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
    </aside>
  );
}
