from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from preprocess import prepare_features
import pandas as pd


def test_prepare_features_requires_columns():
    df = pd.DataFrame(
        {
            "package_type": ["Electronics"],
            "urgency": ["High"],
            "distance_km": [100],
            "weight_kg": [10],
            "route_duration_hours": [2.5],
        }
    )
    out = prepare_features(df)
    assert list(out.columns) == [
        "package_type",
        "urgency",
        "distance_km",
        "weight_kg",
        "route_duration_hours",
    ]


def test_predict_loads_when_models_exist():
    model_dir = ROOT / "models"
    required = [
        model_dir / "mode_classifier.joblib",
        model_dir / "eta_regressor.joblib",
        model_dir / "mode_label_encoder.joblib",
    ]
    if not all(p.exists() for p in required):
        import pytest

        pytest.skip("Models not trained yet")

    from predict import predict

    result = predict("Electronics", 450, 12, "High")
    assert "transportMode" in result
    assert "estimatedHours" in result
    assert result["estimatedHours"] > 0
