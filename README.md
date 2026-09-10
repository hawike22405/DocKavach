# DocKavach

> **AI-assisted document screening for identity-verification workflows.**

DocKavach is a full-stack document screening platform for authorized officers. It combines a Next.js + TypeScript officer console with a Flask REST API, MongoDB Atlas, OCR, document validation, tamper analysis, face detection/matching, risk scoring, and audit history.

The project is intended for hackathon, demonstration, and research environments. Its computer-vision and forensic components are lightweight and should not be treated as production-grade biometric or forensic systems without independent validation.

> **Important:** DocKavach is an AI-assisted decision-support system. Screening results should support—not replace—authorized human review and applicable identity-verification procedures.

---

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+ (20+ recommended)
- npm
- MongoDB Atlas or another accessible MongoDB deployment
- Tesseract OCR installed and available on `PATH`
- A modern browser with camera permissions if live face capture is used

### 1. Clone the repository

```bash
git clone https://github.com/hawike22405/DocKavach.git
cd DocKavach
```

### 2. Configure the backend

Create `.env` from the template.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**

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
HOST=127.0.0.1
FLASK_DEBUG=false
MAX_CONTENT_LENGTH=16777216
FRONTEND_ORIGIN=http://localhost:3000
```

Never commit real database credentials, JWT secrets, or API keys.

### 3. Install and run the backend

**Windows PowerShell:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

**Linux/macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

The backend normally runs at `http://localhost:5000`.

Health check: `GET /api/health`

### 4. Configure the frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Install and run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend normally runs at `http://localhost:3000`.

### 6. Build the frontend for production

```bash
cd frontend
npm run build
npm start
```

---

## MongoDB Atlas setup

DocKavach uses the `MONGO_URI` environment variable and does not require a local MongoDB server.

1. Create a MongoDB Atlas cluster.
2. Create a database user with the required read/write permissions.
3. Add the backend machine's IP address under **Network Access**.
4. Open **Connect → Drivers**, select Python, and copy the connection string.
5. Put the connection string in `.env` as `MONGO_URI`.
6. Keep database credentials out of source control and frontend `NEXT_PUBLIC_*` variables.

For anything beyond disposable testing, use a restricted network policy and rotate credentials regularly.

---

## Tesseract OCR setup

`pytesseract` is a Python wrapper; the Tesseract executable must also be installed.

### Ubuntu/Debian/Mint

```bash
sudo apt update
sudo apt install -y tesseract-ocr
```

### Windows

Install Tesseract and add its installation directory to `PATH`. Restart the terminal afterward.

Verify the installation:

```bash
tesseract --version
```

---

## Features

### Authentication & access

- Officer registration and login
- JWT-based API authentication
- bcrypt password hashing
- Officer-scoped screening records

### Document screening

- Document image upload
- Browser-based live face capture
- OCR using Tesseract
- Passport MRZ parsing
- Heuristic extraction for Visa/National ID documents
- Document-field validation
- MRZ checksum validation

### Image analysis

- JPEG Error Level Analysis (ELA) tamper signals
- OpenCV face detection
- Lightweight face comparison
- Explainable 0–100 risk scoring

### Review & audit

- `APPROVE`, `REVIEW`, and `REJECT` screening recommendations
- Officer decisions: `APPROVE`, `FLAG`, `REJECT`
- Persistent screening history
- History filtering and pagination
- Activity logging for authentication, screening, and decision events
- Officer station/checkpoint settings

### Frontend experience

- Institutional officer-console interface
- Animated document-processing workflow
- Screening results dashboard
- OCR, risk, tampering, and face-match views
- Responsive layout
- Reduced-motion support

---

## Screening workflow

A request to `POST /api/screen` is processed through the following stages:

1. **Decode input** — document and optional live-capture images are decoded from the request payload.
2. **OCR** — Tesseract extracts text; passports are processed through MRZ parsing while Visa/National ID documents use heuristic field extraction.
3. **Face analysis** — OpenCV detects faces and performs lightweight comparison when a live capture is available.
4. **Tamper analysis** — ELA identifies compression anomalies that may indicate image manipulation.
5. **Validation** — required fields, dates, expiry information, OCR issues, and MRZ checksum failures are evaluated.
6. **Risk scoring** — validation, tampering, and face-analysis signals are combined into a 0–100 risk score.
7. **Recommendation** — the backend returns `APPROVE`, `REVIEW`, or `REJECT`.
8. **Persistence** — screening results and audit metadata are stored in MongoDB.

These modules provide screening signals, not definitive proof of authenticity or identity.

---

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Zustand, Framer Motion, Lucide React, React Webcam |
| Backend | Python, Flask, Flask-CORS, Flask-Limiter |
| Database | MongoDB / MongoDB Atlas, PyMongo |
| Authentication | JWT, bcrypt |
| OCR | Tesseract, pytesseract |
| Computer vision | OpenCV, Pillow, NumPy |
| Tooling | npm, Python virtual environments, GitHub Actions |

### Frontend versions

- Next.js `^15.5.21`
- React `^19.2.8`
- TypeScript `^5.4.0`
- Tailwind CSS `^3.4.0`
- Zustand `^4.5.0`
- Framer Motion `^11.2.0`
- React Webcam `^7.2.0`

### Backend versions

- Flask `3.0.3`
- Flask-CORS `4.0.1`
- Flask-Limiter `4.1.1`
- PyMongo `4.8.0`
- python-dotenv `1.0.1`
- PyJWT `2.9.0`
- bcrypt `4.2.0`
- pytesseract `0.3.13`
- OpenCV `4.10.0.84`
- Pillow `10.4.0`
- NumPy `1.26.4`

---

## Environment variables

### Backend `.env`

| Variable | Purpose | Example |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `DB_NAME` | Application database | `dockavach_db` |
| `JWT_SECRET` | JWT signing secret | Long random string |
| `JWT_EXP_HOURS` | Token lifetime | `24` |
| `PORT` | Flask port | `5000` |
| `HOST` | Flask bind address | `127.0.0.1` |
| `FLASK_DEBUG` | Flask debug mode | `false` |
| `MAX_CONTENT_LENGTH` | Maximum request size in bytes | `16777216` |
| `FRONTEND_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |

### Frontend `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Never expose backend secrets through `NEXT_PUBLIC_*` variables.

---

## API overview

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Backend health check |
| `/api/auth/*` | Registration, login, and officer identity |
| `POST /api/screen` | Run document screening |
| `/api/history/*` | Screening history and officer decisions |
| `/api/settings` | Officer station/checkpoint settings |
| `/api/logs` | Activity/audit feed |

JWT authentication is used for protected application routes.

---

## Development

Run the application with two terminals.

**Backend:**

```bash
python app.py
```

**Frontend:**

```bash
cd frontend
npm run dev
```

### Frontend checks

```bash
cd frontend
npm run lint
npm run build
```

### Update your local checkout

```bash
git checkout main
git pull origin main
```

---

## Security considerations

DocKavach processes identity-related documents and image data, so treat deployments as security-sensitive.

- Store secrets only in environment variables or a secret manager.
- Never commit `.env`, database credentials, or JWT secrets.
- Use strong, rotated credentials.
- Restrict MongoDB network access outside local development.
- Use HTTPS outside localhost.
- Restrict CORS to trusted frontend origins.
- Review rate limits and request-size limits before public deployment.
- Treat risk scores as decision-support signals rather than definitive fraud or identity determinations.
- Do not use the lightweight face-matching or ELA implementation as a standalone biometric or forensic verification system.

---

## Project status

DocKavach is an end-to-end hackathon/demo implementation with integrated frontend, backend, database persistence, OCR, screening analysis, results, history, settings, and audit logging.

Potential next steps include stronger document-authenticity models, production-grade biometric verification, formal evaluation datasets, observability, deployment automation, and deeper security hardening.

---

## Contributing

Contributions are welcome.

Before opening a pull request:

1. Keep changes focused and documented.
2. Run the frontend lint and build checks.
3. Verify backend startup and the health endpoint.
4. Test affected screening flows end to end.
5. Never commit credentials, private documents, or generated secrets.

---

## License

No license file is currently specified in this repository. Unless a license is added, the project contents should not be assumed to be freely reusable or redistributable.

---

## Disclaimer

DocKavach is provided for authorized testing, demonstration, research, and development purposes. It does not guarantee document authenticity, identity authenticity, fraud-detection accuracy, or biometric-match accuracy. Human review and applicable organizational, legal, and regulatory procedures remain essential.
