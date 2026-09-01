# SSB Document Screening — Frontend

Next.js (App Router) + TypeScript + Tailwind frontend for the AI-based
document screening dashboard described in `PRD.md` / `TechSpec.md`.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## File structure

```
screening-system/
├── src/
│   ├── app/
│   │   ├── layout.tsx          Root layout — mounts the persistent sidebar
│   │   ├── page.tsx            Dashboard: capture → processing → results
│   │   ├── globals.css
│   │   ├── history/page.tsx    Audit trail (stub)
│   │   └── settings/page.tsx   Station settings (stub)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        Dashboard / Scan Document / History / Settings nav
│   │   │   └── LiquidNavBar.tsx   Floating glassmorphic nav (Framer Motion pill)
│   │   ├── domain/
│   │   │   ├── DocumentUploader.tsx   Drag-and-drop passport/visa upload
│   │   │   ├── FaceCapture.tsx        react-webcam live capture
│   │   │   ├── ProcessingStepper.tsx  4-module progress indicator
│   │   │   ├── ResultsView.tsx        Composes the panels below
│   │   │   ├── RiskGauge.tsx          Circular risk score (green/amber/red)
│   │   │   ├── OcrTable.tsx           Editable extracted fields
│   │   │   ├── TamperingViewer.tsx    Bounding-box overlay + alerts
│   │   │   └── FaceMatchCard.tsx      Document photo vs. live photo
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Card.tsx
│   ├── lib/
│   │   ├── types.ts            Mirrors Schema.md exactly
│   │   └── mockApi.ts          setTimeout-based stand-in for the AI backend
│   └── store/
│       └── useScanStore.ts     Zustand store for the current scan session
├── tailwind.config.ts          Color/type tokens from Design.md
└── package.json
```

## Swapping the mock for the real backend

`src/lib/mockApi.ts` exports a single `screenDocument(request, onStep)`
function returning a `Promise<ScreeningResponse>`. Replace its body with a
`fetch` to `${process.env.NEXT_PUBLIC_API_URL}/screen`; no component needs to
change because every consumer only depends on the `ScreeningResponse` type in
`src/lib/types.ts`.

## Notes

- `shadcn/ui` was not vendored in so this scaffold has no extra install step;
  `src/components/ui/Button.tsx` and `Card.tsx` are minimal stand-ins with the
  same prop shape and can be swapped for generated shadcn components directly.
- The webcam capture only ever sends a single still frame, never a video
  stream, per the local-processing rule in `TechSpec.md`.
- `useScanStore.resetSession()` clears every PII-bearing field (images, OCR
  data) — call it whenever a session closes, per `Rules.md`.
