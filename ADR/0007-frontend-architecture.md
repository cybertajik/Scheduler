# 7. React Single-Page Application Architecture

* **Status**: Accepted
* **Date**: 2026-07-26

## Context
The user interface must support interactive drag-and-drop calendar manipulation, side panels, undo/redo state tracking, and responsive layout.

## Decision
Use React 18 with TypeScript, Tailwind CSS, FullCalendar v6, and Vite. Implement `useScheduleHistory` custom hook for local Undo/Redo stack tracking.

## Consequences
Provides a commercial-grade workforce management web experience with high rendering performance.
