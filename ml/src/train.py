"""
Train XGBoost models for:
1) transportation mode classification
2) ETA regression

Dataset is synthetic/demo unless replaced with real operational data.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier, XGBRegressor

from generate_dataset import generate
from preprocess import build_preprocessor, prepare_features

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"


def train() -> dict:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    data_path = DATA_DIR / "synthetic_logistics.csv"
    if not data_path.exists():
        df = generate(4000, 42)
        df.to_csv(data_path, index=False)
    else:
        df = pd.read_csv(data_path)

    X = prepare_features(df)
    y_mode = df["transport_mode"]
    y_eta = df["eta_hours"]

    mode_encoder = LabelEncoder()
    y_mode_enc = mode_encoder.fit_transform(y_mode)

    X_train, X_test, y_mode_train, y_mode_test, y_eta_train, y_eta_test = train_test_split(
        X, y_mode_enc, y_eta, test_size=0.2, random_state=42, stratify=y_mode_enc
    )

    clf = Pipeline(
        steps=[
            ("pre", build_preprocessor()),
            (
                "model",
                XGBClassifier(
                    n_estimators=120,
                    max_depth=5,
                    learning_rate=0.08,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    objective="multi:softprob",
                    eval_metric="mlogloss",
                    random_state=42,
                ),
            ),
        ]
    )
    clf.fit(X_train, y_mode_train)
    mode_pred = clf.predict(X_test)
    mode_acc = float(accuracy_score(y_mode_test, mode_pred))
    mode_f1 = float(f1_score(y_mode_test, mode_pred, average="weighted"))

    # For ETA, include predicted/known mode as an extra numeric signal via route duration already present.
    reg = Pipeline(
        steps=[
            ("pre", build_preprocessor()),
            (
                "model",
                XGBRegressor(
                    n_estimators=160,
                    max_depth=5,
                    learning_rate=0.06,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    random_state=42,
                ),
            ),
        ]
    )
    reg.fit(X_train, y_eta_train)
    eta_pred = reg.predict(X_test)
    mae = float(mean_absolute_error(y_eta_test, eta_pred))
    rmse = float(np.sqrt(mean_squared_error(y_eta_test, eta_pred)))

    joblib.dump(clf, MODEL_DIR / "mode_classifier.joblib")
    joblib.dump(reg, MODEL_DIR / "eta_regressor.joblib")
    joblib.dump(mode_encoder, MODEL_DIR / "mode_label_encoder.joblib")

    metrics = {
        "dataset": "synthetic_logistics.csv",
        "dataset_note": "Synthetic demo dataset — not real operational GPS/logistics telemetry",
        "rows": int(len(df)),
        "mode_classification": {"accuracy": round(mode_acc, 4), "f1_weighted": round(mode_f1, 4)},
        "eta_regression": {"mae_hours": round(mae, 4), "rmse_hours": round(rmse, 4)},
    }
    (MODEL_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    train()
