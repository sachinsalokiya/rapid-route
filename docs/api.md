# API Documentation

Base URL (local): `http://localhost:4000/api`

Auth header: `Authorization: Bearer <token>`

Success shape:

```json
{ "success": true, "message": "Success", "data": {} }
```

Error shape:

```json
{ "success": false, "message": "..." }
```

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register dispatcher/driver |
| POST | `/auth/login` | No | Login |
| GET | `/auth/me` | Yes | Current user |

## Users (admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List users |
| POST | `/users` | Create user |
| PATCH | `/users/:id` | Update user |

## Shipments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/shipments` | admin, dispatcher, driver | List/search/filter/paginate |
| GET | `/shipments/:id` | admin, dispatcher, driver | Details + timeline |
| POST | `/shipments` | admin, dispatcher | Create |
| PATCH | `/shipments/:id` | admin, dispatcher | Update |
| DELETE | `/shipments/:id` | admin | Delete |
| POST | `/shipments/:id/assign` | admin, dispatcher | Assign vehicle/driver |
| POST | `/shipments/:id/start-transit` | admin, dispatcher | Start demo simulation |

## Vehicles / Drivers

Standard CRUD under `/vehicles` and `/drivers`, plus:

- `POST /vehicles/:id/assign-driver`
- `POST /drivers/:id/assign-vehicle`

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/routes?origin=lng,lat&destination=lng,lat` | OSRM route proxy |
| POST | `/routes/optimize` | Explainable optimization layer |
| GET | `/routes/saved` | Saved route records |

## Tracking

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tracking/:trackingNumber` | Public-style tracking payload |
| GET | `/tracking` | Active deliveries (auth) |

## Other

- `GET /dashboard`
- `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- `POST /ml/predict`
- `GET /weather?lat=&lon=`
- `GET /weather/shipment/:shipmentId`
- `GET /health` (no `/api` prefix)
