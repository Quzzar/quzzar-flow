---
name: Quzzar System Designer
description: Dark studio for inspecting system contracts
colors:
  background: '#14171d'
  canvas: '#171a20'
  panel: '#1c2028'
  raised: '#242a34'
  hover: '#2a313d'
  line: '#303641'
  subtleLine: '#272d36'
  text: '#eef0f5'
  muted: '#a4acbb'
  dim: '#929bab'
  blue: '#75a7ff'
  blueSoft: '#253755'
  green: '#83d7b2'
  amber: '#e6c387'
  red: '#f19eab'
  dot: '#343a46'
  edge: '#69778e'
typography:
  title:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: '18px'
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: '-0.025em'
  body:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: '13px'
    lineHeight: 1.6
  section-title:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: '14px'
    fontWeight: 600
    lineHeight: 1.6
  label:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: '12px'
  code:
    fontFamily: '"IBM Plex Mono", monospace'
    fontSize: '11px'
    fontWeight: 400
    lineHeight: 1.9
rounded:
  small: '6px'
  medium: '8px'
  node: '12px'
  round: '999px'
spacing:
  xxs: '4px'
  xs: '6px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '20px'
  xxl: '24px'
components:
  button:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.text}'
    rounded: '{rounded.small}'
    padding: '6px 12px'
  button-hover:
    backgroundColor: '{colors.hover}'
  icon-button:
    backgroundColor: 'transparent'
    textColor: '{colors.muted}'
    rounded: '{rounded.small}'
    size: '34px'
  badge:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.muted}'
    rounded: '{rounded.small}'
    padding: '2px 8px'
  operation-card:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.text}'
    rounded: '{rounded.node}'
    width: '248px'
  inspect-select:
    backgroundColor: '{colors.background}'
    textColor: '{colors.text}'
    rounded: '{rounded.small}'
    padding: '0 8px'
    height: '44px'
  connection-label:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.muted}'
    rounded: '{rounded.small}'
    padding: '4px 8px'
---

# Design System: Quzzar System Designer

## Overview

**Creative North Star: "Dark studio"**

Dark studio uses a charcoal canvas, muted panels, and blue accents. The graph is the central artifact; restrained chrome and compact labels leave space for inspecting relationships.

Manrope carries interface language, while IBM Plex Mono distinguishes contracts, paths, and illustrative payloads. Flat tonal surfaces and precise borders establish hierarchy. The inspector holds readable detail when the graph is zoomed out, especially on mobile.

**Key Characteristics:**

- Charcoal surfaces with a single blue interaction accent.
- Compact cards with author-supplied content.
- Monospaced contracts and explicit source-to-input paths.
- A dismissible inspector alongside or below the canvas.

## Colors

Cool charcoal neutrals establish the workspace; inspection blue marks interactive structure. Frontmatter records the implemented values from `src/styles/tokens.css.ts`.

### Primary

- **Inspection blue** (`blue`): selected card borders, selected edges and labels, active inspector tabs, contract types, field paths, and keyboard focus.
- **Blue inset** (`blueSoft`): text selection and the active demo example.

### Secondary

- **Compatible mint** (`green`): verified compatibility status.
- **Review amber** (`amber`): unverified contracts and schema warnings.
- **Issue rose** (`red`): mismatches, node issue badges, and image-loading failure messages. Status always has accompanying text.

### Neutral

- **Studio charcoal** (`background`): library chrome and inspector.
- **Canvas charcoal** (`canvas`): graph ground and connection labels.
- **Muted panel** (`panel`): operation cards, canvas controls, and Inspect chooser strip.
- **Raised slate** (`raised`) and **Hover slate** (`hover`): buttons, badges, tooltips, and interactive hover surfaces.
- **Structural slate** (`line`) and **Quiet divider** (`subtleLine`): card boundaries and section separators.
- **Soft white** (`text`): main content; **Muted silver** (`muted`): descriptions and labels; **Dim silver** (`dim`): canvas metadata.
- **Grid slate** (`dot`) and **Connection steel** (`edge`): dotted canvas and unselected connectors.

**The Inspection Accent Rule.** Blue identifies selection, focus, and inspectable contract structure; validation status uses its own labeled semantic colors.

## Typography

**Body Font:** Manrope Variable (with sans-serif fallback).
**Label/Mono Font:** IBM Plex Mono (with monospace fallback).

The pairing keeps interface language compact and contract syntax distinct. Use sentence case for headings and controls; preserve the author's case in data and identifiers.

### Hierarchy

- **Title:** empty-graph heading, with the title role in frontmatter. The demo supplies its own graph heading in the header slot using Manrope (18px, 600); the library does not generate a title from graph metadata.
- **Section title:** inspector heading, with the section-title role in frontmatter.
- **Body:** operation names and general interface text. Operation names use semibold (600); processing prose uses a looser line height (1.85).
- **Label:** descriptions, tabs, section headings, and control hints. Section headings use medium weight (550); node descriptions use a line height (1.7).
- **Code:** JSON, edge payload labels, and binding paths use the code role. Schema field names use IBM Plex Mono at label size (12px); requirement labels use tiny Manrope (11px). Long names and paths wrap rather than forcing the inspector wider.
- **Content caption:** label-size text (12px) with medium weight (500).
- **Tiny:** badges (11px) with medium weight (550).

There is no implemented display-heading scale. The unused display token is not a prescription for future screens.

## Layout

The library owns a single header row, canvas controls, and inspector. It fills its mount, with a minimum desktop height (640px). The header has a minimum height (64px), caller-owned content on the left, and the validation status action on the right. Callers supply the header through `render(..., { header })` as React content or an HTMLElement. Its content region flexes, can shrink, and wraps long text. Graph name remains metadata; it does not generate header copy. The main desktop grid allocates the remaining width to the canvas and a fixed inspector column (344px). The inspector scrolls independently within the mounted viewer. Its heading and close action remain sticky at the top. Closing it clears node, connection, or validation selection, returns focus to the validation action, and releases the inspector column so the canvas fills the available width. Clicking blank canvas also clears selection; Escape closes the inspector when focus is inside it.

Operation cards keep a fixed logical width (248px), and React Flow scales the graph through pan, zoom, and fit-to-view. The dotted grid uses a spacing (22px). Canvas controls sit at the lower left with a shared inset (24px); the canvas has a minimum height (380px). Nodes and connections can be selected, but nodes cannot be dragged, connected, reconnected, or deleted. Graph layers pack into columns with at most eight rows each. Zoom ranges from an overview minimum (0.02) to a detail maximum (1.8).

Graphs with more than twelve nodes show the Inspect chooser on desktop as well as mobile. Choosing a node in these graphs zooms to that node, giving a readable detail route from the overview. The chooser returns to its selection prompt when the inspector is closed.

At the mobile breakpoint (maximum width 760px), the layout becomes one column and the header uses smaller horizontal insets. An Inspect chooser provides nodes, connections, and validation without requiring precise canvas taps. The canvas becomes a fixed overview region (460px tall), followed directly by a full-width inspector in normal document flow. Coarse pointers receive larger control targets (44px).

Spacing follows the frontmatter scale. Header insets use `xxl` on desktop and `lg` on mobile; inspector sections use `xl`; node bodies use `lg`; node headers combine `md` vertically with `lg` horizontally. Content blocks stack with `lg` gaps. Tables scroll within their own width, and long code and binding paths wrap.

The Vite consumer adds a wrapping example navigation above the library mount and supplies an h1 for the selected example through the header slot. Its examples, including large fan-in, ambiguous-field, and explicitly resolved stress cases, are authored in `examples/`; that navigation belongs to the demo. The viewer adds no brand strip, read-only label, repository link, automatic tagline, Contract graph badge, global status footer, or attribution badge.

## Elevation & Depth

The authored UI uses no box shadows. Tonal layering, one-pixel borders, and section dividers separate the canvas, cards, inspector, and controls. Selected cards change border color; selected connectors change color and stroke width. Tooltips use the raised surface with a structural border rather than an elevation effect. There is no authored transition or animation system in the current viewer.

**The Tonal Depth Rule.** Express the current studio's depth with surface tones and borders; preserve the flat treatment of cards and controls.

## Shapes

Compact controls, badges, images, and labels share gently curved corners through `small`. Grouped canvas controls use `medium`. Operation cards use the more generous `node` radius and clip their content at that boundary. Scrollbar thumbs use the fully rounded token. Structural borders are thin (1px). Blue connection handles are small circles (8px) with a canvas-colored border (2px).

## Components

### Buttons

Restrained raised controls use the button primitive for validation and inspection actions. Hover changes the surface to hover slate. Icon controls are transparent at rest and acquire a hover surface with brighter text. All viewer interactions use a visible blue outline (2px) with an offset (4px). Canvas icon buttons have accessible names and delayed tooltips (250ms). The inspector close button uses the same ghost treatment with an X icon and accessible name; its control layer remains sticky above scrolling content. Coarse-pointer targets expand as described in Layout.

### Chips

Muted rectangular issue badges appear in operation headers when a node has an error. Their text uses issue rose. Explicit mapping badges use muted text on the same raised surface and appear beside explicitly mapped paths and affected source groups. These are informational labels, not filters.

### Cards / Containers

Operation cards have a panel background, structural border, and a name header with an optional configurable Lucide icon. The author supplies the center content as text, JSON, schema, table, or image blocks. When no render blocks are supplied, the processing description occupies the body. The library adds no input/output footer; contract details live in the inspector. A schema shown inside an authored block remains author content. Selection changes the card border to inspection blue.

### Inputs / Fields

The Inspect control is a labeled native select with a charcoal background, structural border, and larger readable type (14px). It appears on mobile and for large desktop graphs, and selects nodes, connections, or validation. There are no editable contract fields or graph-authoring forms in the viewer.

### Navigation

Inspector tabs use muted text and a transparent background. The active tab adds blue text and a blue underline (2px); keyboard behavior comes from Radix Tabs. Demo example links use muted text, a hover surface, and a blue inset active state, and wrap at narrow widths.

### Connections and contracts

Bezier connections use a directional arrow. Connections that span intervening columns use a bypass lane to keep the path around intermediate cards. Unselected paths use connection steel with a thin stroke (1.4px); selection uses inspection blue with a stronger stroke (2px). The clickable interaction width is wider than the visible stroke (24px). Payload names appear in compact monospaced labels and split onto separate lines. The selected label gains a blue border and text. Labels appear at a zoom of at least 0.4 or when their connection is selected, reducing clutter in large overviews.

The connection inspector distinguishes consumed fields from available upstream output and the consumer's complete input contract. Explicitly configured bindings carry an explicit badge. Source output paths point to consumer input paths; fields supplied by other connections are listed separately. Contracts render as recursive field trees with monospaced names, blue type labels, and explicit required or optional labels for object fields. Native details/summary branches expand nested objects, array items and tuples, union alternatives, intersections, and negation. Top-level branches open initially in the inspector; compact card schemas start collapsed. Leaf rows reserve the same chevron space without showing an expand affordance. Open branches rotate their chevron and reveal children inset behind a structural left border.

Schema rows wrap at narrow widths, use label-size text, and separate branches with quiet dividers. Children use a modest indent (12px) and a left guide, keeping hierarchy readable within the inspector. Descriptions appear in muted prose; constraints appear beneath rows in wrapping, plain-language notes such as “At least 1” or “Min. 2 characters.” Compact card schemas omit constraint notes. Contract inspection uses this tree rather than a raw JSON disclosure; authored JSON content blocks remain monospaced payload previews.

### Binding groups and mapping suggestions

The node inspector groups input bindings into native details disclosures when there are more than eight resolved fields. Each group represents a connection and names its source node with a field count. Groups start collapsed, use a structural bottom border and compact padding (8px vertically), and reveal binding rows with a modest top inset (12px). Explicit badges identify configured source choices at group and row level.

Ambiguity issues in the validation inspector show read-only configuration suggestions. Each suggestion places an explanatory source label and monospaced `sd.connect(...)` example on the canvas tone with compact padding (12px) and the small corner radius. These are instructions for updating authored configuration, not editable controls or executed transformations.

## Do's and Don'ts

### Do:

- **Do** use blue for selection, focus, paths, and contract types.
- **Do** keep card headers and content separate with a structural divider.
- **Do** keep detailed input and output contracts in the inspector.
- **Do** preserve the mobile inspector chooser and readable stacked details.
- **Do** keep the inspector close action reachable and clear selection when it closes.
- **Do** use source-group disclosures for large binding lists and hide unselected edge labels at overview zoom.
- **Do** let callers own header content and use the field tree for contract inspection.

### Don't:

- **Don't** add graph editing or execution controls to the viewer.
- **Don't** add library-owned input/output footers to operation cards.
- **Don't** rely on miniature canvas text as the only mobile inspection route.
- **Don't** treat the demo example navigation as embedded viewer chrome.
