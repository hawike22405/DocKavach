# DocKavach Backend

Real implementation of the 4-module pipeline your frontend's `mockApi.ts`
currently simulates. Same request/response shape as `types.ts` — so you can
swap the mock call for a real fetch with no frontend type changes.

## 1. System dependency (OCR engine)
Tesseract must be installed on the OS (pytesseract is just a Python wrapper).

```bash
# Ubuntu/Debian/Mint
sudo apt update && sudo apt install -y tesseract-ocr

# Windows: install from https://github.com/UB-Mannheim/tesseract/wiki
# then add the install folder to PATH
```

## 2. Setup
```bash
cd DocKavach-backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
copy .env.example .env       # Windows
# cp .env.example .env       # Linux/Mac
```
Edit `.env` → set `MONGO_URI` (Atlas free cluster or local) and `JWT_SECRET`.

## 3. Verify DB, then run
```bash
python db.py        # must print [OK] Connected to MongoDB
python app.py        # serves on http://localhost:5000
```

## 4. Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | no | create officer account |
| POST | `/api/auth/login` | no | returns JWT |
| GET | `/api/auth/me` | yes | current officer |
| POST | `/api/screen` | yes | **run the full pipeline** |
| GET | `/api/history?page=&limit=&recommendation=&mine=` | yes | audit log |
| GET | `/api/history/<transactionId>` | yes | one record |
| POST | `/api/history/<transactionId>/decision` | yes | body `{"decision":"APPROVE"\|"FLAG"\|"REJECT"}` |
| GET/PUT | `/api/settings` | yes | station/checkpoint config |

### `/api/screen` request body
```json
{
  "documentImageBase64": "<base64 or data URL>",
  "documentType": "PASSPORT" | "VISA" | "NATIONAL_ID",
  "liveFaceBase64": "<base64 or data URL, optional>"
}
```
Response matches `ScreeningResponse` in `types.ts` exactly: `transactionId`,
`timestamp`, `overallRiskScore`, `recommendation`, `module1_OCR`,
`module2_Validation`, `module3_Tampering`, `module4_FaceMatch`.

## 5. How each module actually works (so you can explain it to judges)
- **Module 1 (OCR)**: Tesseract OCR → for passports, locates and parses the
  MRZ per ICAO 9303 (real checksum validation on doc number/DOB/expiry).
  For visa/national ID (no standard MRZ), heuristic regex extraction.
- **Module 2 (Validation)**: expiry date check, DOB plausibility, MRZ
  checksum errors surfaced here.
- **Module 3 (Tampering)**: Error Level Analysis (ELA) — recompresses the
  image and diffs it against the original; edited regions compress
  differently and light up. Classifies anomalies as PHOTO_REPLACEMENT /
  FONT_MISMATCH / METADATA based on location.
- **Module 4 (Face match)**: OpenCV Haar cascade face detection on both
  document photo and live selfie, histogram-correlation similarity score.
- **Risk score**: weighted combination of the above → APPROVE/REVIEW/REJECT.
  Thresholds are in `services/risk_service.py` — tune them if your demo
  needs different sensitivity.

## 6. Frontend integration (2 changes only)
In your friend's frontend, replace the mock call:
```ts
// before: import { screenDocument } from "@/lib/mockApi"
// after:
async function screenDocument(req: ScreeningRequest): Promise<ScreeningResponse> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/screen`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(req),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
```
Set `NEXT_PUBLIC_API_URL=http://localhost:5000/api` in the frontend's `.env.local`.

Wire login the same way against `/api/auth/login`, store the returned token,
then history page → `GET /api/history`, settings page → `GET/PUT /api/settings`.

## 7. Before pushing to git
`.env` is already in `.gitignore` — don't remove it.
