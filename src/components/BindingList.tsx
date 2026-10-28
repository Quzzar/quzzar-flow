import type { DesignerGraph, InputBinding } from '../lib/types';
import * as s from '../styles/viewer.css';

function BindingRows({ bindings }: { bindings: InputBinding[] }) {
  return (
    <>
      {bindings.map((binding) => (
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
    </>
  );
}

/** Large fan-in contracts are grouped by source so the inspector stays navigable. */
export function BindingList({
  bindings,
  graph,
  onInspectNode,
}: {
  bindings: InputBinding[];
  graph: DesignerGraph;
  onInspectNode: (id: string) => void;
}) {
  if (bindings.length <= 8) return <BindingRows bindings={bindings} />;
  const groups = new Map<string, InputBinding[]>();
  for (const binding of bindings)
    groups.set(binding.connectionId, [
      ...(groups.get(binding.connectionId) ?? []),
      binding,
    ]);
  return (
    <>
      {[...groups].map(([id, group]) => {
        const sourceId = group[0]?.sourceNodeId;
        const name =
          graph.nodes.find((node) => node.id === sourceId)?.name ?? sourceId;
        return (
          <details className={s.bindingGroup} key={id}>
            <summary>
              {name} <span className={s.muted}>· {group.length} fields</span>{' '}
              {group.some((binding) => binding.mode === 'explicit') && (
                <span className={s.badge}>explicit</span>
              )}
            </summary>
            <div className={s.bindingGroupBody}>
              {sourceId && (
                <button
                  type="button"
                  className={s.button}
                  onClick={() => onInspectNode(sourceId)}
                >
                  Inspect {name}
                </button>
              )}
              <BindingRows bindings={group} />
            </div>
          </details>
        );
      })}
    </>
  );
}
