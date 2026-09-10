# DocKavach preview server — how to reproduce artifacts and run the dev server

This repo is a two-process app: a Flask backend and a Next.js frontend.

## 1. Reproduce the artifacts a fresh checkout needs

### Environment files (copy from the main checkout; do not copy secret values)

The frontend needs a local env file defining the backend API URL:

PROCEDURE: copy `.env.local` from the main checkout.

- Frontend: `frontend/.env.local`
  - Content (non-secret): `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

If you are running this worktree on a different port from the main checkout, edit `NEXT_PUBLIC_API_URL` to point at the backend you intend to use. Do not paste database credentials, JWT secrets, or API keys into frontend env files.

The backend needs its own `.env` with real secrets. For a preview you usually do **not** need the backend running unless you want to hit the real screening API.

PROCEDURE: copy `.env` from the main checkout only if the backend must run, then keep real secrets out of any generated docs or the Preview tab.

### Dependencies

PROCEDURE: install frontend dependencies with the project's package manager.

```
cd frontend
npm install
```

The repo uses Node.js 18+ (20+ recommended). There is no top-level Node package; the frontend is the only Node part.

## 2. Run the server

### Frontend dev server (what this preview uses)

PROCEDURE: start the Next.js dev server from `frontend`.

```
cd frontend
npm run dev
```

Default port: `3000`. The frontend binds to the Next.js default host.

If port 3000 is already taken, pass a free port:

```
cd frontend
npm run dev -- -p <FREE_PORT>
```

The frontend reads `NEXT_PUBLIC_API_URL` from `frontend/.env.local`. For the preview to talk to a real backend, set that URL to the backend you want to use.

### Backend (optional for the preview)

If you want the backend running too, set up its `.env` first, then:

```
python app.py
```

It normally runs on `http://localhost:5000`. Tesseract must be installed on the OS for the backend to start.

## 3. What this preview launches

This preview launches the frontend dev server from `frontend` using `npm run dev`, with a fallback to a free port if 3000 is occupied. The backend is not started by this preview.
