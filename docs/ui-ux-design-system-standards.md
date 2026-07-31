# UI/UX Enterprise Interface & Design System Standards

This document describes the visual design system, typography scales, spacing tokens, component guidelines, keyboard navigation shortcuts, and WCAG 2.1 AA accessibility standards for the scheduling application.

---

## 1. Design System Tokens & Color Palette

The interface adheres to a sleek dark mode default with full light mode support.

| Token | Dark Mode Hex | Light Mode Hex | Usage |
| --- | --- | --- | --- |
| **Canvas Background** | `#020617` (Slate-950) | `#F8FAFC` (Slate-50) | Page root container. |
| **Card Surface** | `#0F172A` (Slate-900) | `#FFFFFF` | Elevate widgets, forms, tables. |
| **Subtle Border** | `#1E293B` (Slate-800) | `#E2E8F0` (Slate-200) | Section dividers & card borders. |
| **Primary Accent** | `#4F46E5` (Indigo-600) | `#4338CA` (Indigo-700) | Primary CTA buttons, active links. |
| **Success Indicator**| `#10B981` (Emerald-500)| `#059669` (Emerald-600)| Healthy state, approved status. |
| **Warning Alert** | `#F59E0B` (Amber-500) | `#D97706` (Amber-600) | Soft rule violations, pending state. |
| **Critical Failure** | `#F43F5E` (Rose-500) | `#E11D48` (Rose-600) | Hard constraints, error alerts. |

---

## 2. Global Keyboard Navigation & Command Palette

| Keyboard Shortcut | Function | Scope |
| --- | --- | --- |
| `Ctrl + K` / `Cmd + K` | Open Enterprise Command Palette | Global |
| `ArrowUp` / `ArrowDown` | Navigate items in Command Palette & Lists | Palette Modal |
| `Enter` | Select active item / Execute command | Palette Modal |
| `Esc` | Close Modal / Cancel action | Modals & Panels |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo Schedule Repair | Schedule Editor |

---

## 3. UI Components & Layout Enhancements

- **Sticky Header**: Navigation bar featuring breadcrumb trails, system operational status pill, theme switcher, and command search trigger.
- **Collapsible Sidebar**: Supports expanded (`w-64`) and compact mini-icon mode (`w-20`) with persistent preference saved in `localStorage`.
- **Skeleton Loaders**: Animated pulse shimmer placeholders ([Skeleton.tsx](file:///c:/Users/AD/Desktop/Scheduler/frontend/src/components/Common/Skeleton.tsx)) for smooth asynchronous loading.
- **Glassmorphism Panels**: Glass surfaces (`.glass-panel`) with subtle blur and 1px border outlines.
- **WCAG 2.1 AA Focus Rings**: High contrast outline rings (`.focus-ring`) for keyboard navigation accessibility.
