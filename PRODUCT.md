# Quzzar System Designer

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-selected React Flow, React, Vite, TypeScript, and Bun. The repository contains an embeddable npm package and a Vite example consumer.

## Users

Quzzar and an AI collaborator exploring a new system together.

## Product Purpose

Make system structure and the movement and transformation of data inspectable so architectural misunderstandings surface early.

## Capabilities and Constraints

- Represent operations as connected nodes with explicit inputs and outputs.
- Inspect the payload crossing a connection and the transformation inside an operation.
- Display illustrative text, JSON, Zod schemas, tables, and images inside nodes.
- Infer field sources across incoming connections, including nested objects and multiple suppliers.
- Mount a read-only viewer by DOM ID or HTMLElement; inspect nodes and connections.
- Processing descriptions are never executed.
- Initial deliverable: a polished app foundation with a working illustrative flow.
- Package name: `quzzar-system-designer`.
- Public GitHub repository authorized by the user.
- Build the skill later. Do not create one in this phase.
- API: instantiate SystemDesigner, add nodes, connect them, validate, and render.
- Optional header content belongs to the caller: React content or an HTMLElement supplied to render().
- The viewer provides no automatic branding, tagline, or global footer.
- Schema contracts are shown as an expandable field tree, not a raw JSON Schema dump.
- Connections support explicit leaf/subtree field mappings to select sources and rename fields while preserving schema checks.
- Inspector dismissal clears the selection and expands the canvas.
- Nested node groups provide named, icon-labeled, shaded visual boundaries without changing contract inference.
- Separate structural relationships describe cardinality and paired output-schema key paths without supplying input contracts.
- Full-stack and database examples cover nested sections, table nodes, function flows, and join tables.
- Stress examples cover large fan-in, ambiguity, and explicit resolution.
- Publishing, arbitrary React node-card content, and additional layout controls remain undecided.

## Brand Commitments

The user selected a dark studio direction: charcoal canvas, muted panels, and blue accents.

## Evidence on Hand

The checkout example uses explicitly synthetic payloads. It performs no transformation execution, checkout, payment, catalog request, or persistence operation.
