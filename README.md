# DocKavach

DocKavach is currently a Next.js 14 + TypeScript + Tailwind frontend for an AI-based document screening dashboard. The frontend lives entirely under `frontend/` so a backend can be added cleanly at the repository root later.

## Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
  npm run dev
  or
  npm run build
  npm run start
```

## Frontend structure

```text
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages and global styles
│   ├── components/
│   │   ├── domain/          # Screening-specific UI
│   │   ├── layout/          # Navigation/layout components
│   │   └── ui/              # Shared UI primitives
│   ├── lib/                 # Types + browser-side mock API adapter
│   └── store/               # Zustand scan-session state
├── next-env.d.ts
├── next.config.mjs
├── package.json
├── package-lock.json
├── postcss.config.mjs
└── tailwind.config.ts
```

## Architecture note

`frontend/src/lib/mockApi.ts` is a frontend test adapter, not the backend. It currently simulates the future Python/FastAPI inference service so the UI can run independently. Replace its implementation with a `fetch` to `${process.env.NEXT_PUBLIC_API_URL}/screen` when the backend is available.
