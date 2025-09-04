# AGENT.md - War Room Development Guide

## Build & Test Commands
- **Dev**: `npm run dev` (frontend at :5173), `cd src/backend && uvicorn main:app --reload` (backend at :8000)
- **Build**: `npm run build` (frontend), `docker build .` (full stack)
- **Test**: `npm run test` (stable tests), `npm run test:ci` (CI subset), `cd src/backend && pytest` (backend)
- **Single Test**: `jest --testNamePattern="ComponentName"` or `pytest tests/specific_test.py`
- **Lint**: `npm run lint`, `npm run type-check` (frontend), `cd src/backend && ruff check .` (backend)

## Architecture Overview
- **Frontend**: React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, Redux Toolkit state
- **Backend**: FastAPI + Python, SQLAlchemy/PostgreSQL via Supabase, Redis caching
- **Deployment**: Railway (current), Docker containers, future AWS migration
- **AI/ML**: OpenAI, Pinecone vector DB, document intelligence features
- **Real-time**: WebSocket + Supabase Realtime for live updates

## Code Style (CRITICAL - PREVENTS BROKEN IMPORTS)
- **File Naming**: ALWAYS lowercase-kebab-case (user-profile.tsx, NOT UserProfile.tsx)
- **Imports**: MUST include extensions for relative imports (`./user-profile.tsx`, NOT `./user-profile`)
- **Path Aliases**: Use `@/components/*` for deep imports, never `../../../`
- **Components**: Named exports (`export const UserProfile`), React.FC<Props> typing
- **API**: RESTful `/api/v1/{resource}`, async handlers, Pydantic validation

## Key Directories
- `src/frontend/` - React components, features, hooks, store
- `src/backend/app/` - FastAPI app (api/, models/, services/, core/)
- `src/components/ui/` - shadcn/ui components (don't modify)
- `src/services/` - API integrations, external services

## Notifications (MANDATORY)
Before ANY yes/no question or task completion, run:
`/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh [approval|complete|next|error] "message" "context"`
