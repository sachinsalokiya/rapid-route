from __future__ import annotations

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler


CATEGORICAL = ["package_type", "urgency"]
NUMERIC = ["distance_km", "weight_kg", "route_duration_hours"]


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
            ("num", StandardScaler(), NUMERIC),
        ]
    )


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    for col in CATEGORICAL + NUMERIC:
        if col not in frame.columns:
            raise ValueError(f"Missing required column: {col}")
    return frame[CATEGORICAL + NUMERIC]
