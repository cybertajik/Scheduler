# 1. Technology Stack Selection

* **Status**: Accepted
* **Date**: 2026-07-26

## Context
The Staff Scheduler application requires a clean, robust, and extensible architecture capable of serving ~50 employees with interactive calendar views, complex scheduling rule evaluation, and automated OR-Tools CP-SAT constraint optimization.

## Decision
We chose the following technology stack:
* **Frontend**: React 18, TypeScript, Tailwind CSS, FullCalendar, Vite.
* **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2.
* **Database**: PostgreSQL 16.
* **Solver**: Google OR-Tools CP-SAT.
* **Background Processing**: Celery + Redis 7.

## Alternatives Considered
* **Django + React**: Rejected due to heavier overhead and slower async execution compared to FastAPI.
* **Node.js / Express**: Rejected due to lack of native integration with Python's Google OR-Tools library.

## Consequences
Allows seamless integration of high-performance mathematical solver logic with an asynchronous, typed web backend and responsive single-page web app.
