# OSRM Setup

Rapid Route never hardcodes a routing provider in business logic. Configure:

```env
OSRM_BASE_URL=https://router.project-osrm.org
```

Coordinates are always sent as **longitude,latitude**.

Backend endpoint:

```http
GET /api/routes?origin=77.4126,23.2599&destination=77.2090,28.6139
```

## Development fallback

The public demo server `https://router.project-osrm.org` is suitable for local demos. It may rate-limit or be unavailable.

## Self-hosted OSRM (optional)

Self-hosting India (or larger) extracts requires multi-GB downloads and preprocessing. Do **not** download huge map files on every Docker build.

1. Download an OSM extract (e.g. Geofabrik India) into `docker/osrm-data/`
2. Preprocess with OSRM tooling (`osrm-extract`, `osrm-partition`, `osrm-customize`)
3. Uncomment the `osrm` service in `docker-compose.yml`
4. Set `OSRM_BASE_URL=http://osrm:5000`

See the official [OSRM backend](https://github.com/Project-OSRM/osrm-backend) docs for extract commands.

## What OSRM provides vs optimization layer

- **OSRM**: road path, distance, duration, optional trip/table services
- **Optimization module**: explainable scoring for mode/vehicle using weight, urgency, capacity, and ML ETA — not a commercial VRP solver
