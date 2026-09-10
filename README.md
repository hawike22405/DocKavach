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
- Activity feed logging every login (success or failure), registration, screening, and officer decision, with timestamps and IP address.
- Strict CORS configuration and request limits.
- Rate limiting with Flask-Limiter.
- Institutional navy/slate government-console UI.
- Animated secure document-processing state.
- Responsive layout and reduced-motion support.

> **Important:** DocKavach is an AI-assisted screening tool. Its output should support—not replace—authorized human review and applicable identity-verification procedures.

---

## Current status

The repository currently contains an end-to-end hackathon/demo implementation with:

- Officer registration and login
- JWT-based authenticated API access
- MongoDB Atlas persistence
- Document image upload
- Live webcam/selfie capture
- Passport OCR and MRZ parsing
- Heuristic OCR extraction for Visa/National ID documents
- Document field validation
- MRZ checksum validation
- JPEG Error Level Analysis (ELA) based tampering detection
- OpenCV Haar-cascade face detection
- Lightweight histogram-correlation face matching
- Explainable 0–100 risk scoring
- `APPROVE` / `REVIEW` / `REJECT` screening recommendations
- Officer `APPROVE` / `FLAG` / `REJECT` decisions
- Persistent screening/audit history
- History filtering, pagination, and officer-specific records
- Activity feed (`/activity`) covering login, registration, screening, and decision events
- Per-officer station/checkpoint settings
- Processing-step UI
- Results dashboard with OCR, risk, tampering, and face-match information
- Backend health endpoint
- GitHub dependency-review workflow

The implementation is suitable for a **hackathon/demo environment**. Several computer-vision components are deliberately lightweight and should not be represented as production-grade biometric or forensic systems without further validation.

---

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
│   ├── settings.py           # Officer settings
│   └── logs.py              # Activity feed (login/register/screen/decision events)
├── services/                 # OCR, MRZ, validation, ELA, face analysis, activity_log
├── middleware/               # JWT authentication middleware
├── utils/                    # Image, JWT, hashing, response helpers
├── db.py                     # MongoDB connection/indexes
├── config.py                 # Environment-backed configuration
├── app.py                    # Flask application factory
├── requirements.txt          # Python dependencies
└── README.md
```

┌──────────────────────────────────────────────────────────────┐
│                     DocKavach Frontend                       │
│                  Next.js + React + TypeScript                │
│                                                              │
│  Login/Register → Document Upload + Webcam → Processing      │
│                  → Screening Results → Decision              │
│                                                              │
│  Zustand scan state · Tailwind CSS · Framer Motion · UI      │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS/HTTP JSON + Bearer JWT
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      Flask REST API                          │
│                                                              │
│  /api/auth/*     Authentication & officer identity           │
│  /api/screen     Document screening pipeline                 │
│  /api/history/*  Screening/audit history                     │
│  /api/settings   Officer station/checkpoint configuration    │
│  /api/health     Health check                                │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
                ▼                               ▼
       ┌──────────────────┐             ┌─────────────────────┐
       │ CV/OCR Pipeline  │             │    MongoDB Atlas    │
       │                  │             │                     │
       │ Tesseract OCR    │             │ officers            │
       │ MRZ parser       │             │ screenings          │
       │ Validation       │             │ settings            │
       │ ELA tampering    │             │ indexed audit data  │
       │ Face detection   │             └─────────────────────┘
       │ Face matching    │
       │ Risk scoring     │
       └──────────────────┘
```

### Screening pipeline

A request to `POST /api/screen` runs the following pipeline:

1. **Decode input images** from data URLs/base64.
2. **Module 1 — OCR:** Tesseract extracts document text. Passport documents are passed through the MRZ parser; Visa/National ID documents use heuristic field extraction.
3. **Module 4 — Face match:** OpenCV detects the largest face in the document and optional live capture, then compares grayscale face-crop histograms.
4. **Module 3 — Tampering:** ELA compares the original image with a JPEG re-save and identifies sufficiently large compression-anomaly regions. Regions are classified as `PHOTO_REPLACEMENT`, `FONT_MISMATCH`, or `METADATA` based on their location/shape.
5. **Module 2 — Validation:** Required fields, dates, expiry, OCR errors, and MRZ checksum failures are converted into validation errors.
6. **Risk scoring:** validation errors, tampering confidence, and face-match status are combined into a 0–100 risk score.
7. **Recommendation:** the backend returns `APPROVE`, `REVIEW`, or `REJECT`.
8. **Persistence:** the complete screening result is stored in MongoDB with its transaction ID, officer ID, timestamp, document type, and later officer decision.

---

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
| Technology | Role |
|---|---|
| Next.js `^15.5.21` | React framework / App Router |
| React `^19.2.8` | UI |
| TypeScript `^5.4.0` | Static typing |
| Tailwind CSS `^3.4.0` | Styling |
| Zustand `^4.5.0` | Scan-session state |
| Framer Motion `^11.2.0` | UI animation |
| Lucide React | Icons |
| react-webcam `^7.2.0` | Live face capture |
| clsx | Conditional class utilities |

The frontend dependencies and scripts are defined in `frontend/package.json`.

### Backend

| Technology | Role |
|---|---|
| Python | Backend/runtime language |
| Flask `3.0.3` | REST API |
| Flask-CORS `4.0.1` | Cross-origin API access |
| PyMongo `4.8.0` | MongoDB access |
| python-dotenv `1.0.1` | Environment configuration |
| PyJWT `2.9.0` | JWT authentication |
| bcrypt `4.2.0` | Password hashing |
| pytesseract `0.3.13` | Tesseract OCR wrapper |
| OpenCV `4.10.0.84` | Face detection and image analysis |
| Pillow `10.4.0` | Image processing |
| NumPy `1.26.4` | Numerical image processing |

---

## Repository structure

```text
DocKavach/
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/
│       └── dependency-review.yml
│
├── app.py                         # Flask application entry point
├── config.py                      # Environment-backed configuration
├── db.py                          # MongoDB client + indexes + connection test
├── requirements.txt               # Python dependencies
│
├── routes/
│   ├── auth.py                    # Register/login/current officer
│   ├── screening.py               # Main document-screening endpoint
│   ├── history.py                 # Audit history + officer decisions
│   ├── settings.py                # Station/checkpoint settings
│   └── logs.py                    # Activity feed (login/register/screen/decision events)
│
├── services/
│   ├── ocr_service.py             # OCR and non-MRZ field extraction
│   ├── mrz_parser.py              # Passport TD3 MRZ parsing/checksums
│   ├── validation_service.py      # Field/date/business-rule validation
│   ├── tampering_service.py       # JPEG ELA tampering analysis
│   ├── facematch_service.py       # Face detection + histogram matching
│   ├── risk_service.py            # Risk score + recommendation
│   └── activity_log.py            # Writes activity_logs entries for auth/screening/decision events
│
├── middleware/
│   └── auth_required.py           # JWT-protected route middleware
│
├── utils/
│   ├── hash.py                    # Password hashing/verification
│   ├── image_utils.py             # Base64 image decoding
│   ├── jwt_handler.py             # JWT creation/validation helpers
│   └── response.py                 # Consistent API responses
│
├── README.md                      # This document
├── README-backend.md              # Backend-specific setup reference
│
└── frontend/
    ├── .env.local.example
    ├── package.json
    ├── package-lock.json
    ├── next.config.mjs
    ├── postcss.config.mjs
    ├── tailwind.config.ts
    ├── next-env.d.ts
    │
    └── src/
        ├── app/
        │   ├── page.tsx            # Main screening dashboard
        │   ├── login/page.tsx      # Officer login
        │   ├── register/page.tsx   # Officer registration
        │   ├── history/page.tsx    # Screening history
        │   ├── activity/page.tsx   # Activity feed (login/register/screen/decision events)
        │   ├── settings/page.tsx   # Officer settings
        │   ├── layout.tsx
        │   └── globals.css
        │
        ├── components/
        │   ├── domain/
        │   │   ├── DocumentUploader.tsx
        │   │   ├── FaceCapture.tsx
        │   │   ├── FaceMatchCard.tsx
        │   │   ├── OcrTable.tsx
        │   │   ├── ProcessingStepper.tsx
        │   │   ├── ResultsView.tsx
        │   │   ├── RiskGauge.tsx
        │   │   └── TamperingViewer.tsx
        │   ├── layout/
        │   │   └── LiquidNavBar.tsx
        │   └── ui/
        │       └── shared UI primitives
        │
        ├── lib/
        │   ├── api.ts              # Live backend API client
        │   ├── mockApi.ts          # Legacy frontend mock/test adapter
        │   └── types.ts            # Shared screening TypeScript types
        │
        └── store/
            └── useScanStore.ts     # Zustand scan-session state
```

---

## Prerequisites

Install the following before running DocKavach:

- **Node.js** and npm for the Next.js frontend
- **Python 3** and pip for the Flask backend
- **Tesseract OCR** installed on the operating system
- A **MongoDB Atlas** cluster and database user with read/write access
- A browser with webcam permission if live face capture is being used

### Tesseract

Tesseract is an operating-system dependency; `pytesseract` is only its Python wrapper.

**Ubuntu/Debian/Mint:**

```bash
sudo apt update
sudo apt install -y tesseract-ocr
```

**Windows:** install Tesseract and add its installation directory to `PATH`. The backend README contains the commonly used Windows installer reference.

---

## 1. Clone the repository

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
```

---

## 2. Configure MongoDB Atlas and backend environment

DocKavach uses MongoDB Atlas through `MONGO_URI`. It does **not** require a local MongoDB server.

Create the local backend environment file:

### Windows PowerShell / CMD

```bash
copy .env.example .env
```

### Linux/macOS

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/dockavach_db?retryWrites=true&w=majority
DB_NAME=dockavach_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXP_HOURS=24
PORT=5000
```

### MongoDB Atlas checklist

1. Open your Atlas project.
2. Open the target cluster.
3. Select **Connect → Drivers**.
4. Select **Python** and copy the `mongodb+srv://...` connection string.
5. Replace the username/password placeholders with a database user that has the required access.
6. Under **Security → Network Access**, allow the IP address of the machine running the backend.
7. Keep the real connection string only in `.env`.

Do **not** put MongoDB credentials into frontend `NEXT_PUBLIC_*` environment variables.

> **Security:** if an Atlas credential has ever been exposed in chat, source code, screenshots, commits, or logs, rotate that database password before using the deployment for anything beyond disposable testing.

---

## 3. Run the backend

Create and activate a virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Test the MongoDB Atlas connection:

```bash
python db.py
```

A successful connection prints a message similar to:

```text
[OK] Connected to MongoDB -> dockavach_db
```

Start the Flask API:

```bash
python app.py
```

The default backend is available at:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

Expected response shape:

```json
{
  "success": true,
  "message": "DocKavach backend alive"
}
```

The development server binds to `0.0.0.0` and uses the configured `PORT` (default `5000`). The application currently runs with Flask debug mode enabled; disable debug mode before production deployment.

---

## 4. Configure and run the frontend

Open a second terminal:

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
| GET | `/api/logs` | Yes | Activity feed (login/register/screen/decision events) |
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
| `routes/logs.py` | Activity feed (login/register/screen/decision events) |
| `services/ocr_service.py` | OCR and extraction |
| `services/mrz_parser.py` | MRZ parsing |
| `services/validation_service.py` | Field validation |
| `services/tampering_service.py` | ELA analysis |
| `services/facematch_service.py` | Face processing |
| `services/activity_log.py` | Writes activity_logs entries for auth/screening/decision events |
| `utils/image_utils.py` | Secure image handling |
| `frontend/src/lib/api.ts` | Frontend API client |
| `frontend/src/store/useScanStore.ts` | Scan-session state |
| `frontend/src/components/layout/LiquidNavBar.tsx` | Preserved liquid navigation |
| `frontend/src/components/domain/ProcessingStepper.tsx` | Processing animation/state |
| `frontend/src/app/page.tsx` | Main screening dashboard |
| `frontend/src/app/history/page.tsx` | Screening history |
| `frontend/src/app/activity/page.tsx` | Activity feed |
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
```

Create the frontend environment file:

```bash
copy .env.local.example .env.local
```

or on Linux/macOS:

```bash
cp .env.local.example .env.local
```

The default configuration is:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

The Next.js development server normally starts at:

```text
http://localhost:3000
```

For a production build:

```bash
npm run build
npm run start
```

---

## 5. Application workflow

### Step 1 — Officer authentication

Open the frontend and register an officer account or log in with an existing account.

The frontend stores the returned JWT in browser `localStorage` and sends it as:

```http
Authorization: Bearer <JWT>
```

The backend protects screening, history, settings, and officer-profile endpoints with JWT middleware.

### Step 2 — Capture screening inputs

The dashboard accepts:

- Document image
- Live face/webcam image

The current dashboard invokes the screening API with `documentType: "PASSPORT"`. The backend itself accepts the document types:

- `PASSPORT`
- `VISA`
- `NATIONAL_ID`

The frontend API types already model all three document types, but the main dashboard currently defaults to Passport rather than exposing a document-type selector.

### Step 3 — Run screening

The frontend converts browser `blob:` image sources into data URLs/base64 before sending them to the backend.

The backend processes the request through OCR, face matching, tampering detection, validation, and risk scoring.

### Step 4 — Review results

The results UI can present:

- Transaction ID
- Timestamp
- Overall risk score
- Recommendation
- OCR fields
- Validation errors
- MRZ data where applicable
- Tampering confidence and anomaly regions
- Face-match percentage and match state
- Uploaded document/live face context

### Step 5 — Record officer decision

An authenticated officer can record one of:

```text
APPROVE
FLAG
REJECT
```

The decision is persisted with the officer ID and decision timestamp.

### Step 6 — Review history

The history screen uses the backend audit API to retrieve previous screenings. Records can be paginated and filtered by recommendation, with an optional `mine=true` filter for records belonging to the current officer.

### Step 7 — Configure station settings

The settings screen can store:

- Station name
- Checkpoint ID
- Automatic flag threshold

The current backend default for `autoFlagThreshold` is `60`.

---

## API reference

All application routes are prefixed with `/api`.

### Health

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| GET | `/api/health` | No | Backend liveness check |

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| POST | `/api/auth/register` | No | Create officer account and return JWT |
| POST | `/api/auth/login` | No | Authenticate officer and return JWT |
| GET | `/api/auth/me` | Yes | Return current officer profile |

Registration accepts `name`, `email`, `password`, and optional `badgeId`.

### Screening

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| POST | `/api/screen` | Yes | Run complete document screening pipeline |

Request body:

```json
{
  "documentImageBase64": "data:image/jpeg;base64,...",
  "documentType": "PASSPORT",
  "liveFaceBase64": "data:image/jpeg;base64,..."
}
```

Supported document types:

```text
PASSPORT
VISA
NATIONAL_ID
```

The backend accepts image payloads up to **16 MiB** when running through `app.py`.

### History

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| GET | `/api/history?page=&limit=&recommendation=&mine=` | Yes | List screening records |
| GET | `/api/history/<transactionId>` | Yes | Retrieve one screening |
| POST | `/api/history/<transactionId>/decision` | Yes | Record officer decision |

Supported recommendation filters:

```text
APPROVE
REVIEW
REJECT
```

Supported officer decisions:

```text
APPROVE
FLAG
REJECT
```

The history endpoint caps the requested page size at 100 records.

### Settings

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| GET | `/api/settings` | Yes | Read current officer settings |
| PUT | `/api/settings` | Yes | Update allowed station/checkpoint settings |

Supported settings fields:

```json
{
  "stationName": "",
  "checkpointId": "",
  "autoFlagThreshold": 60
}
```

### Activity feed

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| GET | `/api/logs` | Yes | Paginated activity feed of login, registration, screening, and decision events |

Every login attempt (success or failure), registration, screening, and officer decision writes an entry into the `activity_logs` MongoDB collection, including the officer ID/email/name (where applicable), event type, timestamp, and requester IP address. These are surfaced live on the frontend `/activity` page.

---

## Screening modules in detail

### Module 1 — OCR and MRZ extraction

Tesseract OCR extracts text from the supplied document image. Small images are upscaled before OCR when their largest dimension is below 1200 pixels.

For passports, the backend searches for TD3-style two-line MRZ content and parses:

- Name
- Document number
- Nationality
- Date of birth
- Expiry date
- Raw MRZ

The parser performs ICAO-style check-digit calculations for the document number, date of birth, expiry date, and composite MRZ value.

For Visa and National ID documents, there is no guaranteed universal MRZ format, so the backend uses heuristic extraction for:

- Name
- Document number
- Date of birth
- Expiry date
- Nationality placeholder

This heuristic path should be treated as best-effort extraction rather than authoritative document recognition.

### Module 2 — Validation

Validation combines OCR/MRZ parsing errors with business-rule checks.

Current checks include:

- Expiry date exists and is a valid calendar date
- Expired documents are flagged
- Date of birth is a valid calendar date
- Date of birth is within a plausible 0–120 year range
- Document number is present
- Name is present and not `UNKNOWN`
- Duplicate validation errors are removed while preserving order

### Module 3 — Tampering detection

DocKavach currently uses **Error Level Analysis (ELA)** rather than a machine-learned forgery classifier.

The image is re-saved as JPEG at quality 90 and compared with the original. Significant localized differences are thresholded and morphologically processed to find anomaly regions.

Detected regions are classified as:

- `PHOTO_REPLACEMENT` — anomaly overlaps the detected face region
- `FONT_MISMATCH` — anomaly resembles a wide/thin text-line region
- `METADATA` — other localized compression inconsistency

Only sufficiently large regions are considered, and the response is limited to the top five anomaly regions.

The resulting confidence is a heuristic derived from the fraction of image area containing detected anomalies.

### Module 4 — Face detection and matching

Face detection uses OpenCV's built-in Haar cascade, so no external face model download is required.

The largest detected face is selected from the document and live image. The implementation resizes the face crops to `150 × 150`, converts them to grayscale, computes histograms, and compares them using histogram correlation.

Current behavior:

- `matchPercentage >= 85` → `isMatch: true`
- Missing live capture → identity is considered unverified
- Missing face in either image → no match

This is intentionally lightweight and explainable for a demo. It is **not equivalent to modern face-recognition embeddings such as ArcFace or FaceNet**, and it should not be treated as a production biometric verification system.

### Risk scoring

The risk service combines the outputs of validation, tampering, and face matching.

Current scoring logic:

- Up to 40 points from validation errors, at 14 points per error
- Up to 50 points from tampering confidence when tampering is detected
- 30 points when a supplied live capture does not match
- 8 points when no live capture is supplied
- Final score is clamped to 0–100

Recommendation thresholds:

```text
REJECT  → score >= 60
REVIEW  → score >= 25 and < 60
APPROVE → score < 25
```

A tampering result with confidence `>= 0.6` forces `REJECT` regardless of the calculated score.

These thresholds are **explicit heuristic rules**, not the output of a trained ML risk model.

---

## MongoDB data model

The backend uses three application collections.

### `officers`

Stores officer accounts, including:

- `name`
- `email`
- `password` (bcrypt hash)
- `badgeId`

The `email` field has a unique ascending index.

### `screenings`

Stores screening/audit records, including:

- `transactionId`
- `timestamp`
- `documentType`
- `officerId`
- OCR results
- Validation results
- Tampering results
- Face-match results
- Overall risk score
- Recommendation
- Officer decision
- Decision timestamp
- Deciding officer ID

Indexes are created for:

- Unique `transactionId`
- Descending `timestamp`
- `officerId`

### `settings`

Stores per-officer configuration:

- `officerId`
- `stationName`
- `checkpointId`
- `autoFlagThreshold`

`officerId` has a unique index.

The backend creates these indexes automatically when the database connection is initialized.

---

## Frontend architecture

### App Router pages

- `/` — authenticated screening dashboard
- `/login` — officer login
- `/register` — officer registration
- `/history` — screening history/audit view
- `/settings` — station/checkpoint settings

### Domain components

- **DocumentUploader** — document image selection/upload UI
- **FaceCapture** — webcam capture UI
- **ProcessingStepper** — four-stage screening progress display
- **OcrTable** — OCR field presentation
- **RiskGauge** — risk score visualization
- **TamperingViewer** — tampering/anomaly visualization
- **FaceMatchCard** — face comparison result
- **ResultsView** — consolidated screening results and officer decision UI

### API client

`frontend/src/lib/api.ts` is the active frontend/backend integration layer. It:

- Reads `NEXT_PUBLIC_API_URL`
- Adds JWT bearer authentication automatically
- Converts browser `blob:` image URLs into data URLs
- Calls screening, authentication, history, decision, and settings endpoints
- Handles non-JSON and failed API responses
- Clears the local token on HTTP 401 responses

`frontend/src/lib/mockApi.ts` remains in the repository as a legacy/mock adapter for frontend testing; the active dashboard uses the live `api.ts` client.

### State management

`frontend/src/store/useScanStore.ts` uses Zustand to manage the current screening session:

```text
capture → processing → results
```

It stores document/live-face images, processing-step progress, the screening result, and the officer decision.

---

## Development notes

### Frontend/backend integration

The frontend and backend use a shared conceptual `ScreeningRequest` / `ScreeningResponse` contract. The API client sends JSON to Flask and expects the backend's standard `{ success, data, message }` response envelope.

### CORS

The backend currently allows all origins for hackathon/demo speed:

```python
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

For a deployed environment, restrict this to the actual frontend origin.

### Authentication storage

The frontend currently stores the JWT in `localStorage`. This is simple for the demo, but a production deployment should consider a more hardened session strategy, such as secure, HTTP-only cookies, together with appropriate CSRF protections.

### Image transport

Document and live-face images are sent as base64/data URLs inside JSON requests. This keeps the implementation simple but increases request size. A production architecture would normally consider multipart uploads or object storage with short-lived references.

---

## Known limitations and next improvements

This section is intentionally explicit so the README does not oversell the current implementation.

### Current limitations

1. **Face matching is lightweight.** Histogram correlation is not a robust biometric identity model.
2. **Tampering detection is heuristic.** ELA can produce false positives/negatives and is not a comprehensive forgery detector.
3. **Visa/National ID OCR is heuristic.** Document layouts vary substantially by issuing authority.
4. **Passport detection is the current frontend flow.** The backend supports three document types, but the main dashboard currently sends `PASSPORT` directly.
5. **CORS is permissive.** It should be restricted before deployment.
6. **Flask debug mode is enabled in `app.py`.** Production deployments should disable it and use a production WSGI server.
7. **JWTs are stored in browser localStorage.** This is convenient for the demo but not the strongest production session architecture.
8. **Images are transported in JSON/base64.** This is not ideal for large-scale production traffic.
9. **No automated model evaluation dataset is included.** OCR, face matching, and tampering thresholds have not been benchmarked here against a representative validation set.
10. **No production deployment configuration is included yet.** There is no Docker Compose/Kubernetes/production WSGI configuration in the current repository.

### Recommended next steps

- Add a frontend document-type selector and pass the selected type to `/api/screen`.
- Replace histogram face matching with an embedding-based model and establish threshold calibration on a representative dataset.
- Add stronger document-specific OCR pipelines and layout validation for each supported document class.
- Add a more robust document-forensics pipeline combining ELA with metadata analysis, geometric checks, copy-move detection, and learned classifiers where appropriate.
- Add automated backend tests for all routes and screening modules.
- Add frontend component/integration tests.
- Restrict CORS to known frontend origins.
- Disable Flask debug mode and run behind a production WSGI server.
- Move JWT handling to a hardened session strategy where appropriate.
- Replace base64 JSON image transport with multipart upload or object-storage references for production scale.
- Add structured logging and monitoring.
- Add rate limiting and request validation.
- Add encryption/key-management and retention policies for sensitive document and biometric data.
- Add CI checks for linting, type checking, tests, and build validation.

---

## Security and privacy

DocKavach handles potentially sensitive identity documents and biometric imagery. Treat the application accordingly.

- Never commit `.env` files or real MongoDB credentials.
- Never expose `MONGO_URI` or database passwords through `NEXT_PUBLIC_*` variables.
- Rotate credentials immediately if they are exposed.
- Use least-privilege MongoDB users.
- Restrict MongoDB Atlas Network Access to trusted IPs/environments.
- Use HTTPS for deployed frontend/API communication.
- Avoid retaining document and face images longer than necessary.
- Define an explicit data-retention policy before real-world use.
- Treat screening results as decision-support output rather than unquestionable identity or authenticity proof.

---

## Useful commands

### Backend

```bash
# Create environment
python -m venv venv

# Windows activation
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Test MongoDB connection
python db.py

# Run Flask API
python app.py
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Production server
npm run start

# Lint script
npm run lint
```

---

## Environment variables

### Backend `.env`

| Variable | Default | Purpose |
|---|---|---|
| `MONGO_URI` | — | MongoDB Atlas connection string |
| `DB_NAME` | `dockavach_db` | MongoDB database name |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXP_HOURS` | `24` | JWT lifetime in hours |
| `PORT` | `5000` | Flask API port |

### Frontend `.env.local`

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Flask API base URL |

---

## Troubleshooting

### `MONGO_URI missing in .env`

Make sure `.env` exists at the repository root and contains a valid `MONGO_URI`.

### MongoDB connection fails

Check:

- Atlas cluster is running
- Database username/password are correct
- The connection string is copied from **Connect → Drivers**
- Your machine's IP is allowed under Atlas Network Access
- The database user has appropriate read/write permissions

If you're on a college/venue/hackathon WiFi and see MongoDB connection timeouts specifically, that network may be blocking outbound port 27017 at the network level — this is a network policy issue, not a code bug. Switching to a mobile hotspot is a quick workaround during a live event.

### Frontend cannot reach backend

Verify that the backend is running on port 5000 and that `frontend/.env.local` contains:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Restart the Next.js development server after changing `.env.local`.

If the frontend and backend are running on different devices on the same network (e.g. demoing on a phone against a laptop backend), use the backend machine's local IP instead of `localhost`, e.g. `NEXT_PUBLIC_API_URL=http://192.168.0.157:5000/api`.

### OCR does not work

Verify that the Tesseract executable is installed and available on the system `PATH`. `pytesseract` alone does not install the Tesseract engine.

### Webcam capture does not work

Allow camera permissions for the frontend origin in the browser and make sure another application is not exclusively using the camera.

### HTTP 401 from the API

The frontend may have an expired/missing JWT. Log in again. The API client removes the local token automatically when it receives a 401 response.

---

## Project maturity

DocKavach is currently best understood as a **functional hackathon/demo prototype with a real backend pipeline**, rather than a production identity-verification platform. The architecture is intentionally modular so individual OCR, forensic, biometric, and risk components can be replaced without rewriting the frontend workflow.

The most important production-hardening work is not adding more UI; it is validating the detection algorithms against representative datasets, improving biometric/document-forensics accuracy, tightening security, and establishing reproducible automated tests.

---

## License

No explicit license file is currently present in the repository. Add a `LICENSE` file before distributing the project publicly under a defined open-source license.
