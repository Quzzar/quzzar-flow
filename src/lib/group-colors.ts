export const GROUP_COLORS = {
  blue: '#75a7ff',
  green: '#83d7b2',
  amber: '#e6c387',
  purple: '#bdadf4',
  neutral: '#a4acbb',
} as const;

export type GroupColor = keyof typeof GROUP_COLORS | `#${string}`;

/** Group shades are derived from a validated palette name or six-digit hex color. */
export function groupAppearance(color: GroupColor = 'neutral') {
  const hex =
    new Map<string, string>(Object.entries(GROUP_COLORS)).get(color) ?? color;
  if (!/^#[\da-f]{6}$/i.test(hex))
    return {
      status: 'error',
      message: 'Group color must be a palette name or a six-digit hex color.',
    } as const;
  const rgb = [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
  return {
    status: 'success',
    fill: `rgba(${rgb.join(', ')}, 0.07)`,
    border: `rgba(${rgb.join(', ')}, 0.32)`,
    ink: `rgb(${rgb.map((channel) => Math.round(channel * 0.5 + 127.5)).join(', ')})`,
  } as const;
}
