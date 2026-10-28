import { globalStyle, style } from '@vanilla-extract/css';
import { tokens as t } from './tokens.css';

const smallScreen = 'screen and (max-width: 760px)';

export const studio = style({
  width: '100%',
  height: '100%',
  minHeight: '640px',
  display: 'flex',
  flexDirection: 'column',
  background: t.color.background,
  color: t.color.text,
  fontFamily: t.font.body,
  fontSize: t.size.body,
  lineHeight: 1.6,
  colorScheme: 'dark',
  overflow: 'hidden',
  '@media': {
    [smallScreen]: { height: 'auto', minHeight: '100dvh', overflow: 'visible' },
  },
});
globalStyle(`${studio} *`, { boxSizing: 'border-box' });
globalStyle(`${studio} button, ${studio} a`, {
  WebkitTapHighlightColor: 'transparent',
});
globalStyle(`${studio} button`, {
  fontFamily: 'inherit',
  fontSize: 'inherit',
  cursor: 'pointer',
});
globalStyle(`${studio} :focus-visible`, {
  outline: `2px solid ${t.color.blue}`,
  outlineOffset: t.space.xxs,
});
globalStyle(`${studio} ::selection`, {
  background: t.color.blueSoft,
  color: t.color.text,
});
globalStyle(`${studio} .react-flow__edgelabel-renderer`, { zIndex: 3 });
globalStyle(`${studio} svg`, { flexShrink: 0 });
globalStyle(`${studio} ::-webkit-scrollbar`, {
  width: t.space.xs,
  height: t.space.xs,
});
globalStyle(`${studio} ::-webkit-scrollbar-thumb`, {
  background: t.color.line,
  borderRadius: t.radius.round,
});

export const header = style({
  minHeight: t.dimension.header,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `0 ${t.space.xxl}`,
  borderBottom: `1px solid ${t.color.subtleLine}`,
  flexShrink: 0,
  gap: t.space.lg,
  '@media': { [smallScreen]: { padding: `0 ${t.space.lg}` } },
});
export const customHeader = style({
  flex: 1,
  minWidth: 0,
  overflowWrap: 'anywhere',
});
export const schemaTree = style({ minWidth: 0 });
export const schemaBranch = style({
  borderBottom: `1px solid ${t.color.subtleLine}`,
});
export const schemaRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: t.space.xs,
  padding: `${t.space.sm} 0`,
  listStyle: 'none',
  fontSize: t.size.small,
  selectors: { 'summary&': { cursor: 'pointer' } },
});
globalStyle(`${schemaRow}::-webkit-details-marker`, { display: 'none' });
export const schemaChevron = style({
  alignSelf: 'center',
  color: t.color.muted,
  flexShrink: 0,
});
globalStyle(`${schemaBranch}[open] > summary > .${schemaChevron}`, {
  transform: 'rotate(90deg)',
});
export const schemaLeafMarker = style({ visibility: 'hidden', flexShrink: 0 });
export const schemaFieldName = style({
  fontFamily: t.font.code,
  overflowWrap: 'anywhere',
  minWidth: 0,
});
export const schemaRequirement = style({
  fontSize: t.size.tiny,
  color: t.color.muted,
  marginRight: 'auto',
});
export const schemaChildren = style({
  paddingLeft: t.space.md,
  borderLeft: `1px solid ${t.color.line}`,
  margin: `${t.space.xxs} 0 ${t.space.sm} ${t.space.xs}`,
});
export const schemaDescription = style({
  color: t.color.muted,
  fontSize: t.size.small,
  lineHeight: 1.75,
  margin: `${t.space.xxs} 0 ${t.space.sm}`,
});
export const schemaConstraints = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${t.space.xxs} ${t.space.md}`,
  color: t.color.muted,
  fontSize: t.size.small,
  padding: `0 0 ${t.space.sm} ${t.space.xl}`,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: t.space.sm,
});
export const muted = style({ color: t.color.muted });

export const iconButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: t.dimension.button,
  height: t.dimension.button,
  border: 0,
  borderRadius: t.radius.small,
  background: 'transparent',
  color: t.color.muted,
  textDecoration: 'none',
  flexShrink: 0,
  ':hover': { background: t.color.hover, color: t.color.text },
  '@media': {
    '(pointer: coarse)': {
      width: t.dimension.touch,
      height: t.dimension.touch,
    },
  },
});
export const button = style({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: t.space.sm,
  minHeight: t.dimension.button,
  padding: `${t.space.xs} ${t.space.md}`,
  borderRadius: t.radius.small,
  border: `1px solid ${t.color.line}`,
  background: t.color.raised,
  color: t.color.text,
  fontWeight: 550,
  whiteSpace: 'nowrap',
  ':hover': { background: t.color.hover },
  '@media': { '(pointer: coarse)': { minHeight: t.dimension.touch } },
});

export const title = style({
  margin: 0,
  fontSize: t.size.title,
  fontWeight: 600,
  letterSpacing: '-0.025em',
  lineHeight: 1.5,
});
export const description = style({
  margin: `${t.space.xxs} 0 0`,
  color: t.color.muted,
  fontSize: t.size.small,
});
export const badge = style({
  fontSize: t.size.tiny,
  fontWeight: 550,
  color: t.color.muted,
  background: t.color.raised,
  padding: `2px ${t.space.sm}`,
  borderRadius: t.radius.small,
  whiteSpace: 'nowrap',
});
export const good = style({ color: t.color.green });
export const bad = style({ color: t.color.red });
export const warning = style({ color: t.color.amber });
export const main = style({
  display: 'grid',
  gridTemplateColumns: `minmax(0, 1fr) ${t.dimension.inspector}`,
  flex: 1,
  minHeight: 0,
  '@media': {
    [smallScreen]: { gridTemplateColumns: 'minmax(0, 1fr)', flex: 'none' },
  },
});
export const mainExpanded = style({ gridTemplateColumns: 'minmax(0, 1fr)' });
export const closeInspector = style({
  position: 'absolute',
  top: t.space.md,
  right: t.space.md,
  zIndex: 2,
});
export const inspectorControls = style({
  position: 'sticky',
  top: 0,
  height: 0,
  zIndex: 3,
});
export const bindingGroup = style({
  padding: `${t.space.sm} 0`,
  borderBottom: `1px solid ${t.color.line}`,
  fontSize: t.size.small,
});
globalStyle(`${bindingGroup} > summary`, { cursor: 'pointer' });
export const bindingGroupBody = style({ paddingTop: t.space.md });
export const mappingSuggestion = style({
  margin: `${t.space.md} 0`,
  padding: t.space.md,
  background: t.color.canvas,
  borderRadius: t.radius.small,
});

export const canvasColumn = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
});
export const mobilePicker = style({
  display: 'none',
  '@media': {
    [smallScreen]: {
      display: 'flex',
      alignItems: 'center',
      gap: t.space.md,
      padding: `${t.space.md} ${t.space.lg}`,
      background: t.color.panel,
      borderBottom: `1px solid ${t.color.line}`,
      fontSize: t.size.small,
    },
  },
});
export const largeGraphPicker = style({
  display: 'flex',
  alignItems: 'center',
  gap: t.space.md,
  padding: `${t.space.sm} ${t.space.xxl}`,
  background: t.color.panel,
  borderBottom: `1px solid ${t.color.line}`,
});
export const inspectSelect = style({
  minWidth: 0,
  flex: 1,
  minHeight: t.dimension.touch,
  borderRadius: t.radius.small,
  border: `1px solid ${t.color.line}`,
  padding: `0 ${t.space.sm}`,
  background: t.color.background,
  color: t.color.text,
  fontFamily: t.font.body,
  fontSize: t.size.medium,
});
export const canvas = style({
  position: 'relative',
  flex: 1,
  background: t.color.canvas,
  minHeight: t.dimension.minimumCanvas,
  '@media': { [smallScreen]: { height: '460px', flex: 'none' } },
});
export const canvasCaption = style({
  position: 'absolute',
  top: t.space.xxl,
  left: t.space.xxl,
  display: 'flex',
  alignItems: 'center',
  gap: t.space.sm,
  zIndex: 2,
  color: t.color.dim,
  fontSize: t.size.small,
  pointerEvents: 'none',
});
export const canvasControls = style({
  position: 'absolute',
  bottom: t.space.xxl,
  left: t.space.xxl,
  display: 'flex',
  alignItems: 'center',
  gap: t.space.xxs,
  background: t.color.panel,
  border: `1px solid ${t.color.line}`,
  borderRadius: t.radius.medium,
  padding: t.space.xxs,
  zIndex: 5,
});
export const controlDivider = style({
  height: t.space.lg,
  width: '1px',
  background: t.color.line,
  margin: `0 ${t.space.xxs}`,
});

export const inspector = style({
  position: 'relative',
  background: t.color.background,
  borderLeft: `1px solid ${t.color.line}`,
  overflow: 'auto',
  minWidth: 0,
  '@media': {
    [smallScreen]: {
      borderLeft: 0,
      borderTop: `1px solid ${t.color.line}`,
      maxHeight: 'none',
    },
  },
});
export const inspectorHeader = style({
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: t.color.background,
  padding: `${t.space.xl} ${t.dimension.header} ${t.space.lg} ${t.space.xl}`,
  borderBottom: `1px solid ${t.color.subtleLine}`,
});
export const sectionTitle = style({
  margin: 0,
  fontSize: t.size.medium,
  fontWeight: 600,
  lineHeight: 1.6,
});
export const section = style({
  padding: t.space.xl,
  borderBottom: `1px solid ${t.color.subtleLine}`,
});
export const sectionHeading = style({
  margin: `0 0 ${t.space.md}`,
  color: t.color.muted,
  fontWeight: 550,
  fontSize: t.size.small,
});
export const paragraph = style({
  margin: 0,
  fontSize: t.size.body,
  color: t.color.muted,
  lineHeight: 1.85,
  textWrap: 'pretty',
});
export const tabs = style({
  display: 'flex',
  borderBottom: `1px solid ${t.color.line}`,
  padding: `0 ${t.space.xl}`,
  gap: t.space.xl,
});
export const tab = style({
  border: 0,
  background: 'transparent',
  color: t.color.muted,
  padding: `${t.space.md} 0`,
  fontWeight: 500,
  borderBottom: '2px solid transparent',
  selectors: {
    '&[data-state="active"]': {
      color: t.color.blue,
      borderBottomColor: t.color.blue,
    },
  },
});
export const code = style({
  fontFamily: t.font.code,
  fontSize: t.size.tiny,
  margin: 0,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  color: t.color.text,
  lineHeight: 1.9,
});

export const fieldType = style({
  color: t.color.blue,
  textAlign: 'right',
  overflowWrap: 'anywhere',
  minWidth: 0,
});

export const node = style({
  width: t.dimension.node,
  background: t.color.panel,
  border: `1px solid ${t.color.line}`,
  borderRadius: t.radius.node,
  overflow: 'hidden',
  color: t.color.text,
  fontFamily: t.font.body,
});
export const groupContainer = style({
  width: '100%',
  height: '100%',
  border: `1px solid ${t.color.line}`,
  borderRadius: t.radius.node,
});
export const groupHeading = style({
  display: 'flex',
  alignItems: 'center',
  gap: t.space.sm,
  padding: `${t.space.xl} ${t.space.xxl}`,
  color: t.color.text,
});
export const groupName = style({
  minWidth: 0,
  margin: 0,
  fontFamily: t.font.body,
  fontSize: t.size.medium,
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const nodeSelected = style({ borderColor: t.color.blue });
export const nodeHeader = style({
  padding: `${t.space.md} ${t.space.lg}`,
  display: 'flex',
  alignItems: 'center',
  gap: t.space.sm,
  borderBottom: `1px solid ${t.color.line}`,
});
export const nodeIcon = style({ color: t.color.blue, display: 'flex' });
export const nodeName = style({
  fontSize: t.size.body,
  fontWeight: 600,
  margin: 0,
});
export const nodeBody = style({ padding: t.space.lg });
export const nodeDescription = style({
  fontSize: t.size.small,
  color: t.color.muted,
  margin: `0 0 ${t.space.md}`,
  lineHeight: 1.7,
  textWrap: 'pretty',
});

export const contentTitle = style({
  color: t.color.muted,
  fontSize: t.size.small,
  fontWeight: 500,
  marginBottom: t.space.sm,
});
export const blockStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: t.space.lg,
});
export const tableWrap = style({ overflowX: 'auto', width: '100%' });
export const table = style({
  borderCollapse: 'collapse',
  width: '100%',
  fontFamily: t.font.code,
  fontSize: t.size.tiny,
  textAlign: 'left',
});
globalStyle(`${table} th`, {
  color: t.color.muted,
  fontWeight: 400,
  padding: `${t.space.xs} ${t.space.sm} ${t.space.sm} 0`,
  borderBottom: `1px solid ${t.color.line}`,
});
globalStyle(`${table} td`, {
  padding: `${t.space.sm} ${t.space.sm} ${t.space.xxs} 0`,
  color: t.color.text,
  verticalAlign: 'top',
});
export const image = style({
  width: '100%',
  display: 'block',
  borderRadius: t.radius.small,
});
export const textBlock = style({
  margin: 0,
  color: t.color.text,
  fontSize: t.size.small,
});
export const edgeLabel = style({
  position: 'absolute',
  pointerEvents: 'all',
  border: `1px solid ${t.color.line}`,
  borderRadius: t.radius.small,
  padding: `${t.space.xxs} ${t.space.sm}`,
  background: t.color.canvas,
  color: t.color.muted,
  fontFamily: t.font.code,
  fontSize: t.size.tiny,
  whiteSpace: 'pre-line',
  textAlign: 'center',
  cursor: 'pointer',
});
export const relationshipLabel = style({
  maxWidth: t.dimension.relationshipLabel,
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
});
export const relationshipActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: t.space.sm,
});
export const edgeLabelSelected = style({
  borderColor: t.color.blue,
  color: t.color.blue,
});
export const binding = style({
  marginBottom: t.space.lg,
  fontSize: t.size.small,
});
export const bindingPath = style({
  color: t.color.blue,
  fontFamily: t.font.code,
  fontSize: t.size.small,
  overflowWrap: 'anywhere',
});
export const bindingSource = style({
  display: 'flex',
  gap: t.space.xs,
  alignItems: 'baseline',
  color: t.color.muted,
  marginTop: t.space.xxs,
  overflowWrap: 'anywhere',
});
export const empty = style({
  padding: t.space.xl,
  color: t.color.muted,
  fontSize: t.size.small,
});
export const issue = style({
  borderBottom: `1px solid ${t.color.line}`,
  padding: `${t.space.lg} 0`,
  fontSize: t.size.small,
});
export const tooltip = style({
  padding: `${t.space.xs} ${t.space.md}`,
  background: t.color.raised,
  color: t.color.text,
  border: `1px solid ${t.color.line}`,
  borderRadius: t.radius.small,
  fontFamily: t.font.body,
  fontSize: t.size.small,
  zIndex: 100,
});
export const handle = style({
  width: t.space.sm,
  height: t.space.sm,
  border: `2px solid ${t.color.canvas}`,
  background: t.color.blue,
});
export const emptyGraph = style({
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: t.space.xxl,
});
