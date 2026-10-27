import {
  Braces,
  Check,
  FunctionSquare,
  Database,
  Image,
  Table2,
  FileText,
  Monitor,
  Server,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NodeIcon } from '../lib/types';

const ICONS: Record<Exclude<NodeIcon, 'none'>, LucideIcon> = {
  braces: Braces,
  check: Check,
  function: FunctionSquare,
  database: Database,
  image: Image,
  table: Table2,
  file: FileText,
  monitor: Monitor,
  server: Server,
  layers: Layers,
};

export function NodeSymbol({
  name,
  size = 17,
}: {
  name: NodeIcon;
  size?: number;
}) {
  if (name === 'none') return null;
  const Icon = ICONS[name];
  return <Icon size={size} />;
}
