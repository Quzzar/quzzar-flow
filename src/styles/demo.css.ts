import { globalStyle, style } from '@vanilla-extract/css';
import { tokens as t } from './tokens.css';

globalStyle('html, body, #root', {
  margin: 0,
  width: '100%',
  height: '100%',
  minWidth: '320px',
  background: t.color.background,
});
globalStyle('body', {
  WebkitFontSmoothing: 'antialiased',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
});
globalStyle('#examples', {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: t.space.sm,
  padding: `${t.space.sm} ${t.space.xxl}`,
  background: t.color.panel,
  color: t.color.muted,
  fontFamily: t.font.body,
  fontSize: t.size.small,
  borderBottom: `1px solid ${t.color.line}`,
});
export const exampleLink = style({
  color: t.color.muted,
  textDecoration: 'none',
  padding: `${t.space.xs} ${t.space.sm}`,
  borderRadius: t.radius.small,
  ':hover': { background: t.color.hover, color: t.color.text },
  ':focus-visible': { outline: `2px solid ${t.color.blue}` },
});
export const exampleActive = style([
  exampleLink,
  { color: t.color.blue, background: t.color.blueSoft },
]);
