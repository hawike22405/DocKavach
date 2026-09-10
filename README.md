# DocKavach — Full Wired Project (Backend + Frontend)

This is the complete project, already connected end-to-end: real backend
pipeline, real frontend calling it, plus an Activity feed so you can see
every login, registration, screening, and decision as it happens.

## Folder layout
```
DocKavach-full/
├── app.py, config.py, db.py          ← backend entry point
├── routes/                            ← auth, screening, history, settings, logs
├── services/                          ← OCR, MRZ, tampering, face match, risk, activity log
├── middleware/, utils/
├── requirements.txt, .env.example
└── frontend/                          ← Next.js app (login, dashboard, history, activity, settings)
```

## 1. Backend setup

```bash
cd DocKavach-full
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
copy .env.example .env       # Windows
# cp .env.example .env       # Linux/Mac
```

Edit `.env`:
```
MONGO_URI=<your Atlas connection string>
DB_NAME=dockavach_db
JWT_SECRET=<random string>
JWT_EXP_HOURS=24
PORT=5000
```

Tesseract OCR must be installed at the OS level (not just pip):
```bash
# Ubuntu/Debian
sudo apt install tesseract-ocr
# Windows: https://github.com/UB-Mannheim/tesseract/wiki
```

Verify DB, then run:
```bash
python db.py     # must print [OK] Connected to MongoDB
python app.py    # serves on http://localhost:5000
```

If you're on a college/venue WiFi and get MongoDB timeout errors, that
network is likely blocking outbound port 27017. Switch to mobile hotspot —
that's a network policy issue, not a bug in the code.

## 2. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
If frontend and backend run on different devices on the same network, use
your backend machine's local IP instead of `localhost`, e.g.
`http://192.168.0.157:5000/api`.

```bash
npm run dev
```
Opens on `http://localhost:3000`.

## 3. Try it end-to-end
1. Go to `http://localhost:3000/register` and create an officer account
2. You're auto-logged in and land on the Dashboard
3. Upload a document image plus a live face capture, then run a screening
4. Check History — your screening is logged there
5. Check Activity (new page) — see your login, registration, and screening
   all listed with timestamps and IP address

## 4. What's wired together

| Frontend page | Backend route |
|---|---|
| /register, /login | POST /api/auth/register, /login |
| / (Dashboard) | POST /api/screen |
| /history | GET /api/history |
| /activity (new) | GET /api/logs |
| /settings | GET/PUT /api/settings |

Every login (success or failure), registration, screening, and officer
decision writes an entry into the activity_logs MongoDB collection, visible
live on the /activity page.

## 5. Before pushing to GitHub
.env and frontend/.env.local are both already covered by .gitignore in
this project — don't remove those entries. Never commit real Mongo
credentials or JWT secrets.
