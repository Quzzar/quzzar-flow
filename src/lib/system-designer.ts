import type {
  DesignerConnection,
  DesignerGraph,
  DesignerNode,
  DesignerOptions,
  RenderOptions,
  RenderResult,
  ValidationResult,
} from './types';
import { validateGraph } from './validate';

const mountedElements = new WeakMap<Element, () => void>();

/** Author typed graphs in code and mount a read-only React Flow viewer. */
export class SystemDesigner {
  readonly options: Readonly<DesignerOptions>;
  private readonly nodes: DesignerNode[] = [];
  private readonly connections: DesignerConnection[] = [];

  constructor(options: DesignerOptions = {}) {
    this.options = Object.freeze({ ...options });
  }

  /** Add an operation. Duplicate IDs are reported by validate(). */
  add(node: DesignerNode): this {
    this.nodes.push({ ...node });
    return this;
  }

  /** Connect a source output contract to a destination input contract. */
  connect(
    source: string,
    target: string,
    options: { label?: string } = {},
  ): this {
    this.connections.push({
      id: `connection-${this.connections.length + 1}`,
      source,
      target,
      ...options,
    });
    return this;
  }

  /** Get a graph snapshot without exposing the instance’s node/edge collections. */
  getGraph(): DesignerGraph {
    return {
      nodes: this.nodes.map((node) => ({ ...node })),
      connections: this.connections.map((connection) => ({ ...connection })),
    };
  }

  validate(): ValidationResult {
    return validateGraph(this.getGraph());
  }

  /** Mount into an HTMLElement or DOM ID. Import package style.css once on the page. */
  async render(
    target: HTMLElement | string,
    options: RenderOptions = {},
  ): Promise<RenderResult> {
    if (typeof document === 'undefined')
      return {
        status: 'error',
        message:
          'render() requires a browser DOM. add() and validate() work in Bun and Node.',
      };
    const element =
      typeof target === 'string' ? document.getElementById(target) : target;
    if (!element)
      return {
        status: 'error',
        message: `No element exists with ID “${String(target)}”.`,
      };
    const [{ createRoot }, { createElement }, { DesignerView }] =
      await Promise.all([
        import('react-dom/client'),
        import('react'),
        import('../components/DesignerView'),
      ]);
    mountedElements.get(element)?.();
    const root = createRoot(element);
    let mounted = true;
    const unmount = () => {
      if (!mounted) return;
      mounted = false;
      root.unmount();
      if (mountedElements.get(element) === unmount)
        mountedElements.delete(element);
    };
    mountedElements.set(element, unmount);
    root.render(
      createElement(DesignerView, {
        graph: this.getGraph(),
        options: this.options,
        initialNodeId: options.initialNodeId,
        header: options.header,
      }),
    );
    return { status: 'success', unmount };
  }
}
