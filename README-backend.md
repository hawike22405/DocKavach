# DocKavach Backend

Real implementation of the 4-module pipeline your frontend uses. The backend stores officers, screenings, decisions, and settings in MongoDB.

## 1. System dependency (OCR engine)
Tesseract must be installed on the OS (pytesseract is just a Python wrapper).

```bash
# Ubuntu/Debian/Mint
sudo apt update && sudo apt install -y tesseract-ocr

# Windows: install from https://github.com/UB-Mannheim/tesseract/wiki
# then add the install folder to PATH
```

## 2. MongoDB Atlas setup (recommended)

DocKavach uses the `MONGO_URI` environment variable, so no MongoDB server needs to run locally. `db.py` creates the required indexes automatically after connecting. The application expects these collections in the configured database:

- `officers`
- `screenings`
- `settings`

The Atlas URL in the MongoDB console is **not** the connection string. In Atlas, open your cluster and choose **Connect → Drivers**, select **Python**, then copy the `mongodb+srv://...` connection string. Replace `<username>` and `<password>` with a database user that has read/write access to the database.

In Atlas, also add the IP address of the computer running the backend under **Security → Network Access**. For local development you can allow your current IP; avoid `0.0.0.0/0` unless you understand the security implications.

## 3. Backend setup

```bash
cd DocKavach
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
copy .env.example .env       # Windows
# cp .env.example .env       # Linux/Mac
```

Edit `.env` and put your Atlas connection string in `MONGO_URI`. Keep `.env` private; never commit it.

Example:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/dockavach_db?retryWrites=true&w=majority
DB_NAME=dockavach_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXP_HOURS=24
PORT=5000
```

If you specifically want to use the existing `sample_mflix` database shown in Atlas, set `DB_NAME=sample_mflix`. DocKavach will then create/use its own `officers`, `screenings`, and `settings` collections in that database. It does **not** use the `SIH` collection for its application records unless the code is explicitly changed to do so.

## 4. Verify Atlas, then run

```bash
python db.py        # must print [OK] Connected to MongoDB
python app.py       # serves on http://localhost:5000
```

A successful `db.py` check confirms that the backend is using Atlas rather than a local MongoDB process.

## 5. Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | no | create officer account |
| POST | `/api/auth/login` | no | returns JWT |
| GET | `/api/auth/me` | yes | current officer |
| POST | `/api/screen` | yes | run the full pipeline |
| GET | `/api/history?page=&limit=&recommendation=&mine=` | yes | audit log |
| GET | `/api/history/<transactionId>` | yes | one record |
| POST | `/api/history/<transactionId>/decision` | yes | save officer decision |
| GET/PUT | `/api/settings` | yes | station/checkpoint config |

## 6. Frontend

The frontend is configured to call the backend through:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

This is the URL of the Flask API, not MongoDB. MongoDB credentials belong only in the backend `.env`; they must never be placed in `NEXT_PUBLIC_*` variables because those variables are exposed to the browser.

The frontend sends the JWT as a Bearer token and sends uploaded/captured images to `/api/screen` as data URLs/base64. History, officer decisions, authentication, and settings use the corresponding backend endpoints.

## 7. Before pushing to git

`.env` is already in `.gitignore` — don't remove it or commit Atlas credentials.
