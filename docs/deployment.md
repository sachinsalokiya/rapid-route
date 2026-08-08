# Deploy Rapid Route (recommended)

**Best fit for this project:** one public website on [Render](https://render.com) + free [MongoDB Atlas](https://www.mongodb.com/atlas).

Why this setup:
- One URL for the full app (landing + dashboard + API + Socket.IO)
- No need to host frontend and backend separately
- Free tier is enough for portfolio / interview demos
- ML can stay offline; the API uses a labeled heuristic fallback

```text
Browser  →  Render (Express serves React + /api + Socket.IO)
                ↓
           MongoDB Atlas
                ↓
           Public OSRM (routing)
```

---

## Step 1 — MongoDB Atlas (5 minutes)

1. Sign up at https://www.mongodb.com/atlas
2. Create a **free M0** cluster
3. **Database Access** → add a user (save username + password)
4. **Network Access** → Add IP Address → `0.0.0.0/0` (allow from anywhere — fine for a demo)
5. **Database** → Connect → Drivers → copy the URI, e.g.

```text
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/rapidroute?retryWrites=true&w=majority
```

Replace `<password>` with the real password (URL-encode special characters if needed).

---

## Step 2 — Deploy on Render

### Option A — Blueprint (easiest)

1. Push this repo to GitHub (already done if you use `sachinsalokiya/rapid-route`)
2. Go to https://dashboard.render.com → **New** → **Blueprint**
3. Connect the `rapid-route` repository
4. Render reads `render.yaml`
5. Fill in:
   - `MONGODB_URI` → Atlas URI from Step 1
   - `CLIENT_URL` → leave blank for now, or set after first deploy to `https://YOUR-SERVICE.onrender.com`
6. Apply / create

### Option B — Manual Web Service

1. **New** → **Web Service** → select the repo
2. Settings:

| Field | Value |
|--------|--------|
| Runtime | Node |
| Build Command | `npm ci --prefix frontend && npm run build --prefix frontend && npm ci --prefix backend` |
| Start Command | `npm start --prefix backend` |
| Instance | Free |

3. Environment variables:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `SERVE_FRONTEND` | `true` |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | long random string |
| `OSRM_BASE_URL` | `https://router.project-osrm.org` |
| `TRACKING_SIMULATION_ENABLED` | `true` |
| `CLIENT_URL` | `https://YOUR-SERVICE.onrender.com` (set after you know the URL) |

4. Deploy

---

## Step 3 — Seed demo data

After the first successful deploy:

1. Render dashboard → your service → **Shell**
2. Run:

```bash
npm run seed --prefix backend
```

Demo login:
- Email: `admin@rapidroute.in`
- Password: `Admin@123`

---

## Step 4 — Open the site

Visit:

```text
https://YOUR-SERVICE.onrender.com
```

Health check:

```text
https://YOUR-SERVICE.onrender.com/health
```

---

## Notes / limitations

- **Free Render services sleep** after idle time. First request after sleep can take 30–60 seconds.
- Do **not** commit real `.env` secrets; set them only in Render / Atlas.
- Weather stays optional (`OPENWEATHER_API_KEY`).
- Self-hosted OSRM / ML are optional for production demos.

## Local vs hosted

| Local | Hosted |
|--------|--------|
| Vite `:5173` + API `:4000` | Same origin on Render |
| Docker Mongo or local Mongo | Atlas |
| Optional ML on `:8000` | Heuristic fallback (or host ML later) |
