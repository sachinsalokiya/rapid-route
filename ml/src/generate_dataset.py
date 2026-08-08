"""
Generate a clearly labeled SYNTHETIC logistics dataset for demo/training.
This is not real operational telemetry.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

PACKAGE_TYPES = [
    "Documents",
    "Electronics",
    "Apparel",
    "Food",
    "Fragile",
    "Industrial",
    "Pharmaceutical",
    "Other",
]
URGENCY = ["Low", "Medium", "High", "Critical"]
MODES = ["Bike", "Van", "Truck", "Train", "Air"]


def choose_mode(distance: float, weight: float, urgency: str, rng: np.random.Generator) -> str:
    if weight <= 5 and distance <= 40:
        base = "Bike"
    elif weight <= 80 and distance <= 200:
        base = "Van"
    elif distance > 1100 and urgency in {"High", "Critical"} and weight <= 150:
        base = "Air"
    elif distance > 700 and weight >= 300:
        base = "Train"
    else:
        base = "Truck"

    # Small noise so the classifier has a realistic challenge
    if rng.random() < 0.08:
        base = rng.choice(MODES)
    return base


def eta_hours(
    distance: float,
    weight: float,
    urgency: str,
    mode: str,
    package_type: str,
    route_duration: float,
    rng: np.random.Generator,
) -> float:
    speed = {"Bike": 22, "Van": 42, "Truck": 48, "Train": 65, "Air": 620}[mode]
    base = route_duration if route_duration > 0 else distance / speed
    urgency_factor = {"Low": 1.18, "Medium": 1.05, "High": 0.92, "Critical": 0.82}[urgency]
    weight_factor = 1 + min(weight, 2000) / 5000
    package_factor = 1.12 if package_type in {"Fragile", "Pharmaceutical"} else 1.0
    noise = rng.normal(0, 0.35)
    return max(0.3, base * urgency_factor * weight_factor * package_factor + noise)


def generate(n: int = 4000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []
    for _ in range(n):
        package_type = rng.choice(PACKAGE_TYPES)
        urgency = rng.choice(URGENCY, p=[0.2, 0.4, 0.25, 0.15])
        distance = float(np.clip(rng.lognormal(mean=5.2, sigma=0.7), 5, 2500))
        weight = float(np.clip(rng.lognormal(mean=3.2, sigma=1.1), 0.5, 5000))
        mode = choose_mode(distance, weight, urgency, rng)
        route_duration = distance / {"Bike": 22, "Van": 42, "Truck": 48, "Train": 65, "Air": 620}[mode]
        route_duration *= float(rng.uniform(0.9, 1.15))
        hours = eta_hours(distance, weight, urgency, mode, package_type, route_duration, rng)
        rows.append(
            {
                "package_type": package_type,
                "distance_km": round(distance, 2),
                "weight_kg": round(weight, 2),
                "urgency": urgency,
                "transport_mode": mode,
                "route_duration_hours": round(route_duration, 2),
                "eta_hours": round(hours, 2),
                "dataset_type": "synthetic",
            }
        )
    return pd.DataFrame(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=4000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--out",
        type=str,
        default=str(Path(__file__).resolve().parents[1] / "data" / "synthetic_logistics.csv"),
    )
    args = parser.parse_args()
    df = generate(args.n, args.seed)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"Wrote {len(df)} synthetic rows to {out}")


if __name__ == "__main__":
    main()
