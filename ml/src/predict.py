from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"

_MODE_MODEL = None
_ETA_MODEL = None
_MODE_ENCODER = None


def load_models():
    global _MODE_MODEL, _ETA_MODEL, _MODE_ENCODER
    if _MODE_MODEL is None:
        _MODE_MODEL = joblib.load(MODEL_DIR / "mode_classifier.joblib")
        _ETA_MODEL = joblib.load(MODEL_DIR / "eta_regressor.joblib")
        _MODE_ENCODER = joblib.load(MODEL_DIR / "mode_label_encoder.joblib")
    return _MODE_MODEL, _ETA_MODEL, _MODE_ENCODER


def predict(
    package_type: str,
    distance: float,
    weight: float,
    urgency: str,
    transport_mode: str | None = None,
    route_duration_hours: float | None = None,
) -> dict:
    mode_model, eta_model, mode_encoder = load_models()

    if route_duration_hours is None:
        # rough prior if caller did not provide OSRM duration
        route_duration_hours = float(distance) / 50.0

    row = pd.DataFrame(
        [
            {
                "package_type": package_type or "Other",
                "urgency": urgency or "Medium",
                "distance_km": float(distance),
                "weight_kg": float(weight),
                "route_duration_hours": float(route_duration_hours),
            }
        ]
    )

    if transport_mode:
        mode = transport_mode
    else:
        mode_idx = mode_model.predict(row)[0]
        mode = mode_encoder.inverse_transform([mode_idx])[0]

    eta = float(eta_model.predict(row)[0])
    return {
        "transportMode": mode,
        "estimatedHours": round(max(0.1, eta), 2),
        "source": "xgboost",
        "dataset": "synthetic",
    }


if __name__ == "__main__":
    print(predict("Electronics", 450, 12, "High"))
