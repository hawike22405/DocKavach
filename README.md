# DocKavach

> **Secure AI-assisted document screening for identity verification workflows.**

DocKavach is a full-stack document screening platform for authorized officers. It combines a **Next.js 15 + TypeScript frontend** with a **Flask 3 + MongoDB backend** and image-analysis services for OCR, document validation, tamper analysis, and face correspondence.

The `testing` branch contains the current security hardening and institutional/government-style officer-console redesign. The original draggable **LiquidNavBar is intentionally preserved**.

## Features

- Officer registration and JWT authentication.
- bcrypt password hashing.
- Document upload and browser-based live face capture.
- OCR using Tesseract via `pytesseract`.
- Passport MRZ parsing.
- VISA/NATIONAL_ID heuristic extraction.
- Document-field validation.
- Error Level Analysis (ELA) tamper detection.
- OpenCV face detection and lightweight face comparison.
- Risk scoring and screening recommendations.
- Officer decisions: `APPROVE`, `FLAG`, `REJECT`.
- Officer-scoped screening history and audit records.
- Strict CORS configuration and request limits.
- Rate limiting with Flask-Limiter.
- Institutional navy/slate government-console UI.
- Animated secure document-processing state.
- Responsive layout and reduced-motion support.

> **Important:** DocKavach is an AI-assisted screening tool. Its output should support—not replace—authorized human review and applicable identity-verification procedures.

## Architecture

```text
DocKavach/
├── frontend/                 # Next.js officer console
│   └── src/
│       ├── app/              # App Router pages + global styles
│       ├── components/
│       │   ├── domain/       # Screening workflow UI
│       │   ├── layout/       # App shell + LiquidNavBar
│       │   └── ui/           # Shared UI primitives
│       ├── lib/              # API client + TypeScript types
│       └── store/            # Zustand state
├── routes/
│   ├── auth.py               # Authentication
│   ├── screening.py          # Screening API
│   ├── history.py            # Officer-scoped audit history
│   └── settings.py           # Officer settings
├── services/                 # OCR, MRZ, validation, ELA, face analysis
├── middleware/               # JWT authentication middleware
├── utils/                    # Image, JWT, hashing, response helpers
├── db.py                     # MongoDB connection/indexes
├── config.py                 # Environment-backed configuration
├── app.py                    # Flask application factory
├── requirements.txt          # Python dependencies
└── README.md
```

## Technology stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion
- Lucide React
- React Webcam

### Backend

- Python 3
- Flask 3
- Flask-CORS
- Flask-Limiter
- PyMongo / MongoDB Atlas
- PyJWT
- bcrypt
- Pillow
- NumPy
- OpenCV
- pytesseract / Tesseract OCR

## Prerequisites

Install:

- Node.js 18+ (20+ recommended)
- npm
- Python 3.10+ recommended
- MongoDB Atlas or another MongoDB deployment
- Tesseract OCR available on `PATH`
- A browser with camera permission support

## Setup

### 1. Clone and use `testing`

```bash
git clone https://github.com/hawike22405/DocKavach.git
cd DocKavach
git checkout testing
git pull origin testing
```

### 2. Configure the backend

Create `.env` at the repository root:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
DB_NAME=dockavach_db
JWT_SECRET=<at-least-32-random-characters>
JWT_EXP_HOURS=24
PORT=5000
HOST=127.0.0.1
FLASK_DEBUG=false
MAX_CONTENT_LENGTH=16777216
FRONTEND_ORIGIN=http://localhost:3000
```

A template is provided in `.env.example`.

**Never commit real MongoDB credentials, JWT secrets, or API keys.**

### 3. Install and run the backend

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

The API normally runs at `http://localhost:5000`.

Health check: `GET /api/health`

### 4. Configure and run the frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Then:

```bash
cd frontend
npm install
npm run dev
```

The frontend normally runs at `http://localhost:3000`.

## Frontend commands

From `frontend/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Run `npm run build` before deployment.

## API reference

All application endpoints are under `/api`.

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| POST | `/api/auth/register` | No | Register officer |
| POST | `/api/auth/login` | No | Authenticate officer |
| GET | `/api/auth/me` | Yes | Current officer |
| POST | `/api/screen` | Yes | Screen document + live face |
| GET | `/api/history` | Yes | Current officer's history |
| GET | `/api/history/:transactionId` | Yes | Officer-owned screening record |
| POST | `/api/history/:transactionId/decision` | Yes | Record officer decision |
| GET | `/api/settings` | Yes | Retrieve settings |
| PUT | `/api/settings` | Yes | Update settings |
| GET | `/api/health` | No | Health check |

Protected requests use:

```http
Authorization: Bearer <JWT>
```

## Screening pipeline

```text
Document + Live Face
        │
        ▼
 Image validation
        │
        ▼
  OCR extraction
        │
   ┌────┴────┐
   ▼         ▼
Passport   VISA/ID
  MRZ      heuristics
   └────┬────┘
        ▼
Field validation
        │
        ▼
Tamper / ELA analysis
        │
        ▼
 Face detection
        │
        ▼
Face comparison
        │
        ▼
Risk + recommendation
        │
        ▼
Officer decision
        │
        ▼
Audit history
```

### Analysis methods

**OCR:** Tesseract through `pytesseract`.

**Passport MRZ:** Dedicated MRZ parser.

**VISA/NATIONAL_ID:** Lightweight heuristic extraction because formats vary between issuing authorities.

**Tampering:** Error Level Analysis with anomaly-region classification.

**Face matching:** OpenCV Haar-cascade detection plus histogram-correlation comparison.

The biometric implementation is lightweight and intended for the current project/demo architecture. Production use should evaluate dedicated biometric embeddings, liveness detection, calibrated thresholds, privacy controls, and applicable legal requirements.

## Security model

The current backend includes:

- JWT authentication with expiration.
- bcrypt password hashing.
- Explicit CORS origin configuration.
- Global rate limiting through Flask-Limiter.
- HTTP request-size limits.
- Strict image decoding and dimension limits.
- Input validation for authentication, pagination, recommendations, and decisions.
- Officer-scoped history and transaction access to prevent IDOR-style cross-user access.
- Generic API errors with server-side exception logging.
- Required MongoDB configuration and a minimum 32-character JWT secret.

For distributed production deployments, replace the default in-memory rate-limit storage with a shared backend such as Redis.

## UI/UX

The `testing` frontend follows an institutional officer-console design:

- Navy, slate, white, and restrained cyan security accents.
- High-contrast typography and keyboard focus states.
- Subtle geometric/watermark background treatment.
- Structured evidence-capture panels.
- Explicit screening stages.
- Animated secure scanning/processing state.
- Responsive layouts.
- Reduced-motion accessibility support.

### LiquidNavBar

`frontend/src/components/layout/LiquidNavBar.tsx` contains the original draggable liquid navigation experience. It is intentionally preserved and should not be structurally altered without an explicit navigation-design decision.

## MongoDB collections

- `officers` — officer accounts.
- `screenings` — screening results and audit records.
- `settings` — officer-specific settings.

Indexes cover unique identifiers, timestamps, officer ownership, and account/settings constraints.

## Important files

| File | Responsibility |
|---|---|
| `app.py` | Flask app, CORS, rate limiting, global errors |
| `config.py` | Environment and security configuration |
| `db.py` | MongoDB connection/indexes |
| `routes/auth.py` | Registration/login/current officer |
| `routes/screening.py` | Main screening workflow |
| `routes/history.py` | Officer-scoped history/decisions |
| `routes/settings.py` | Officer settings |
| `services/ocr_service.py` | OCR and extraction |
| `services/mrz_parser.py` | MRZ parsing |
| `services/validation_service.py` | Field validation |
| `services/tampering_service.py` | ELA analysis |
| `services/facematch_service.py` | Face processing |
| `utils/image_utils.py` | Secure image handling |
| `frontend/src/lib/api.ts` | Frontend API client |
| `frontend/src/store/useScanStore.ts` | Scan-session state |
| `frontend/src/components/layout/LiquidNavBar.tsx` | Preserved liquid navigation |
| `frontend/src/components/domain/ProcessingStepper.tsx` | Processing animation/state |
| `frontend/src/app/page.tsx` | Main screening dashboard |
| `frontend/src/app/history/page.tsx` | Screening history |
| `frontend/src/app/globals.css` | Global visual system |

## Known limitations

- OCR quality depends on document image quality and Tesseract configuration.
- VISA/NATIONAL_ID extraction needs country-specific logic for higher accuracy.
- ELA is a forensic signal, not definitive proof of manipulation.
- The current face matcher is not a production-grade biometric identification system.
- Camera permissions are required for live capture.
- MongoDB and Tesseract must be available in the deployment environment.
- In-memory rate limiting is not suitable for multi-instance production deployment.
- Runtime/browser and CI verification should be performed before production deployment.

## Development guidelines

1. Work on `testing` for active refinement.
2. Never commit secrets.
3. Validate frontend and backend inputs.
4. Preserve officer authorization boundaries.
5. Avoid leaking implementation details through API errors.
6. Test malformed and oversized image inputs.
7. Run frontend build/lint checks before deployment.
8. Preserve the LiquidNavBar unless a deliberate navigation redesign is approved.

## Project status

**Branch:** `testing`

**Focus:** security hardening, production-oriented stability, and institutional officer-console UX.

The project is suitable for continued development and controlled demonstration. Production deployment requires comprehensive automated tests, infrastructure hardening, biometric/privacy review, observability, and deployment-specific security validation.

## License

No license file is currently declared. Unless a license is added by the project owner, treat the repository as **all rights reserved**.
