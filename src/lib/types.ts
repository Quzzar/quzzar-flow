import type { z } from 'zod';
import type { ReactNode } from 'react';

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonSchema = z.core.JSONSchema.JSONSchema;

/** Declarative content displayed inside a node. No HTML or code is executed. */
export type ContentBlock =
  | { type: 'text'; text: string; title?: string }
  | { type: 'json'; value: JsonValue; title?: string }
  | { type: 'schema'; schema: z.ZodType; title?: string }
  | { type: 'image'; src: string; alt: string; title?: string }
  | { type: 'table'; columns: string[]; rows: JsonValue[][]; title?: string };

export type NodeIcon =
  | 'braces'
  | 'function'
  | 'database'
  | 'check'
  | 'image'
  | 'table'
  | 'file'
  | 'none';

export type DesignerNode = {
  id: string;
  name: string;
  icon?: NodeIcon;
  input: z.ZodType;
  output: z.ZodType;
  processing: string;
  additionalInfo?: string;
  render?: ContentBlock[];
};

export type DesignerConnection = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type ValidationIssue = {
  kind: 'error' | 'unverified';
  code: string;
  message: string;
  path: string;
  nodeId?: string;
  connectionId?: string;
};

/** `valid` is true only when every check is proven compatible. */
export type ValidationResult = {
  status: 'valid' | 'invalid' | 'unverified';
  valid: boolean;
  issues: ValidationIssue[];
  connectionsChecked: number;
  bindings: InputBinding[];
};

/** An inferred projection from an upstream output into a node’s input. */
export type InputBinding = {
  nodeId: string;
  inputPath: string;
  connectionId: string;
  sourceNodeId: string;
  outputPath: string;
};

export type DesignerGraph = {
  nodes: DesignerNode[];
  connections: DesignerConnection[];
};

export type DesignerOptions = { name?: string };
export type HeaderContent = ReactNode | HTMLElement;
export type RenderOptions = { initialNodeId?: string; header?: HeaderContent };
export type RenderResult =
  | { status: 'success'; unmount: () => void }
  | { status: 'error'; message: string };
