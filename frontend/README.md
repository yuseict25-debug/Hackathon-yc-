# Eula

Frontend for Eula — an Identity Engine that learns who you are through natural conversation and visualizes your identity in a living virtual room.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- TailwindCSS + shadcn/ui
- Framer Motion
- Zustand
- PixiJS

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- **Room** — PixiJS rendering engine with data-driven furniture and decorations
- **Identity** — Traits learned through conversation
- **Conversation** — Chat interface with Eula
- **Compatibility** — Future matching layer (stubbed)
- **Profile** — User profile state

All data flows through `lib/api.ts` and hooks — swap the API layer when the backend is ready.
