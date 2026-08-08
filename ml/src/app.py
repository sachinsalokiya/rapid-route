"""Flask ML prediction API for Rapid Route."""

from __future__ import annotations

import json
import os
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

from predict import predict as run_predict

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"

app = Flask(__name__)
CORS(app)


@app.get("/health")
def health():
    models_ok = all(
        (MODEL_DIR / name).exists()
        for name in ["mode_classifier.joblib", "eta_regressor.joblib", "mode_label_encoder.joblib"]
    )
    metrics = {}
    metrics_path = MODEL_DIR / "metrics.json"
    if metrics_path.exists():
        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    return jsonify({"success": True, "modelsLoaded": models_ok, "metrics": metrics})


@app.post("/predict")
def predict_endpoint():
    payload = request.get_json(silent=True) or {}
    required = ["distance", "weight"]
    missing = [k for k in required if payload.get(k) is None]
    if missing:
        return jsonify({"success": False, "message": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        result = run_predict(
            package_type=payload.get("packageType", "Other"),
            distance=float(payload["distance"]),
            weight=float(payload["weight"]),
            urgency=payload.get("urgency", "Medium"),
            transport_mode=payload.get("transportMode"),
            route_duration_hours=(
                float(payload["routeDurationHours"])
                if payload.get("routeDurationHours") is not None
                else None
            ),
        )
        return jsonify(result)
    except FileNotFoundError:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Models not found. Run: python src/train.py",
                }
            ),
            503,
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"success": False, "message": str(exc)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
