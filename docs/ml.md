# Machine Learning

## Goals

1. Predict transportation mode: Bike, Van, Truck, Train, Air
2. Predict logistics ETA (hours)

## Important honesty note

The bundled dataset is **synthetic** (`ml/data/synthetic_logistics.csv`), generated for demo/training. It is **not** real operational GPS or carrier telemetry. Metrics in `ml/models/metrics.json` are measured on that synthetic holdout split.

## Pipeline

```text
generate_dataset.py → synthetic_logistics.csv
train.py → mode_classifier.joblib + eta_regressor.joblib + metrics.json
predict.py / Flask POST /predict → transportMode + estimatedHours
```

## Features

- package_type
- distance_km
- weight_kg
- urgency
- route_duration_hours

## API

`POST http://localhost:8000/predict`

```json
{
  "packageType": "Electronics",
  "distance": 450,
  "weight": 12,
  "urgency": "High"
}
```

```json
{
  "transportMode": "Truck",
  "estimatedHours": 8.4,
  "source": "xgboost",
  "dataset": "synthetic"
}
```

The Node backend calls this service via `ML_SERVICE_URL`. If unavailable, it falls back to an **explicit heuristic** (labeled in the response).

## Local commands

```bash
cd ml
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python src/train.py
PYTHONPATH=src python src/app.py
```
