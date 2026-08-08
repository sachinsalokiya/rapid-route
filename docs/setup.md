# Local Setup

## Prerequisites

- Node.js 20+
- Python 3.12+
- MongoDB 6/7 (local or Docker)
- Git

## 1. Clone & configure

```bash
git clone https://github.com/sachinsalokiya/rapid-route.git
cd rapid-route
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` as needed (Mongo URI, JWT secret, OSRM URL).

## 2. Start MongoDB

```bash
docker run -d --name rapid-mongo -p 27017:27017 mongo:7
```

## 3. Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

API: http://localhost:4000

## 4. ML service

```bash
cd ml
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python src/train.py
set PYTHONPATH=src
python src/app.py
```

ML: http://localhost:8000

## 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Demo credentials

After seeding:

- Admin: `admin@rapidroute.in` / `Admin@123`
- Dispatcher: `dispatcher@rapidroute.in` / `Admin@123`
- Driver: `ravi.driver@rapidroute.in` / `Admin@123`

## Docker Compose

```bash
docker compose up --build
```

Frontend nginx proxies `/api` and `/socket.io` to the backend.

## Tests

```bash
cd backend && npm test
cd frontend && npm test
cd ml && PYTHONPATH=src pytest -q
```
