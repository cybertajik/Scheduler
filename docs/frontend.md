# Frontend Architecture

## Overview
The frontend is a single-page React 18 application written in **TypeScript** and styled with **Tailwind CSS**. It incorporates **FullCalendar v6** for month and week scheduling views.

```text
frontend/src/
├── api/client.ts                     # Shared Axios HTTP client with JWT interceptors
├── components/
│   ├── Common/                       # NotificationToast, StatusBadge, Modal, LoadingSpinner
│   ├── Layout/                       # Sidebar navigation, Header, Main Layout shell
│   └── ScheduleEditor/               # ConflictSidePanel, EditorToolbar, ShiftContextMenu, WorkerDetailDrawer
├── context/AuthContext.tsx           # Global React Context for authentication session
├── hooks/useScheduleHistory.ts       # Undo/Redo stack state management hook
├── pages/                            # Application view pages
└── services/apiServices.ts           # Typed API service modules
```

---

## State Management & Undo / Redo

The Schedule Editor utilizes `useScheduleHistory` to maintain local action stacks (`past` and `future` arrays). Every drag-and-drop, assignment lock, creation, or deletion pushes a command object containing `undoHandler` and `redoHandler` callbacks to support instant `Ctrl+Z` and `Ctrl+Y` operations.
