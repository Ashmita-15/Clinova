import os

import joblib
import numpy as np
import pandas as pd

from app.config import settings

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS_PATH = os.path.join(ROOT, settings.models_dir.lstrip("./").lstrip("../"))


def _resolve_models_path() -> str:
    candidates = [
        MODELS_PATH,
        os.path.join(ROOT, "models"),
        os.path.abspath(os.path.join(ROOT, "..", "models")),
    ]
    for path in candidates:
        if os.path.isdir(path):
            return path
    return os.path.join(ROOT, "models")


class MLService:
    def __init__(self):
        self.models_path = _resolve_models_path()
        self._artifacts: dict = {}
        self._scalers: dict = {}

    def _load(self, name: str) -> dict:
        if name not in self._artifacts:
            path = os.path.join(self.models_path, f"{name}_model.pkl")
            if not os.path.exists(path):
                raise FileNotFoundError(
                    f"Model not found: {path}. Run notebooks/train_models.py first."
                )
            self._artifacts[name] = joblib.load(path)
        return self._artifacts[name]
    
    def _load_scaler(self, name: str):
        if name not in self._scalers:

            path = os.path.join(
                elf.models_path,
                f"{name}_scaler.pkl"
            )

            self._scalers[name] = joblib.load(path)

        return self._scalers[name]

    @staticmethod
    def probability_to_category(proba: float) -> str:
        if proba < 0.35:
            return "Low"
        if proba < 0.65:
            return "Medium"
        return "High"

    def predict_anemia(self, gender: str, blood: dict) -> tuple[str, float, dict]:
    # Load model artifact and scaler
        artifact = self._load("anemia")
        scaler = self._load_scaler("anemia")

        # Encode gender
        gender_val = 1 if gender.lower() in ("male", "m") else 0

        # Build input row
        row = {
            "GENDER": gender_val,
            "HGB": blood["hemoglobin"],
            "RBC": blood["rbc"],
            "HCT": blood["hematocrit"],
            "MCV": blood["mcv"],
            "MCH": blood["mch"],
            "MCHC": blood["mchc"],
            "RDW": blood["rdw"],
        }

        # Create DataFrame
        X = pd.DataFrame([row])

        # Ensure feature order matches training
        X = X[artifact["features"]]

        # Scale features
        X_scaled = scaler.transform(X)

        # Predict
        model = artifact["model"]
        proba = float(model.predict_proba(X_scaled)[0][1])

        # Convert probability to category
        category = self.probability_to_category(proba)

        return category, proba, row

    def predict_kidney(self, age: int, blood: dict) -> tuple[str, float, dict]:
        artifact = self._load("ckd")
        bu_val = blood.get("blood_urea") if blood.get("blood_urea") is not None else 20.0
        sc_val = blood.get("serum_creatinine") if blood.get("serum_creatinine") is not None else 1.0
        bp_val = blood.get("blood_pressure") if blood.get("blood_pressure") is not None else 120.0
        row = {
            "bu": bu_val,
            "sc": sc_val,
            "hemo": blood["hemoglobin"],
            "bp": bp_val,
            "age": age,
        }
        X = pd.DataFrame([row])[artifact["features"]]
        proba = float(artifact["model"].predict_proba(X)[0][1])
        category = self.probability_to_category(proba)
        return category, proba, row

    def predict_diabetes(self, age: int, blood: dict) -> tuple[str, float, dict]:
        artifact = self._load("diabetes")
        glucose_val = blood.get("glucose") if blood.get("glucose") is not None else 95.0
        bmi_val = blood.get("bmi") if blood.get("bmi") is not None else 22.0
        bp_val = blood.get("blood_pressure") if blood.get("blood_pressure") is not None else 120.0
        insulin_val = blood.get("insulin") if blood.get("insulin") is not None else 80.0
        row = {
            "Glucose": glucose_val,
            "BMI": bmi_val,
            "BloodPressure": bp_val,
            "Insulin": insulin_val,
            "Age": age,
        }
        X = pd.DataFrame([row])[artifact["features"]]
        proba = float(artifact["model"].predict_proba(X)[0][1])
        category = self.probability_to_category(proba)
        return category, proba, row

    def get_feature_importance(self, model_name: str) -> dict[str, float]:
        artifact = self._load(model_name)
        model = artifact["model"]
        features = artifact["features"]
        labels = artifact.get("feature_labels", {})
        importances = getattr(model, "feature_importances_", None)
        if importances is None:
            return {labels.get(f, f): 1.0 for f in features}
        return {
            labels.get(f, f): float(imp)
            for f, imp in zip(features, importances)
        }


ml_service = MLService()
