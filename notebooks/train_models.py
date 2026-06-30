"""Train anemia, CKD, and diabetes risk models and save to models/."""

import os
import sys
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASETS = os.path.join(ROOT, "datasets")
MODELS_DIR = os.path.join(ROOT, "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def risk_label(proba: float) -> str:
    if proba < 0.35:
        return "Low"
    if proba < 0.65:
        return "Medium"
    return "High"


def train_anemia_model():
    df = pd.read_csv(os.path.join(DATASETS, "anemia.csv"))
    features = ["Gender", "Hemoglobin", "MCH", "MCHC", "MCV"]
    X = df[features]
    y = df["Result"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric="logloss",
    )
    model.fit(X_train, y_train)

    acc = model.score(X_test, y_test)
    print(f"Anemia model accuracy: {acc:.3f}")

    artifact = {
        "model": model,
        "features": features,
        "model_type": "anemia",
        "feature_labels": {
            "Gender": "Gender",
            "Hemoglobin": "Hemoglobin",
            "MCH": "MCH",
            "MCHC": "MCHC",
            "MCV": "MCV",
        },
    }
    path = os.path.join(MODELS_DIR, "anemia_model.pkl")
    joblib.dump(artifact, path)
    print(f"Saved {path}")
    return artifact


def load_ckd_dataframe() -> pd.DataFrame:
    """Load CKD ARFF with manual parsing to handle whitespace in nominal values."""
    filepath = os.path.join(DATASETS, "chronic_kidney_disease_full.arff")
    rows = []
    in_data = False
    with open(filepath, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("%"):
                continue
            if line.lower() == "@data":
                in_data = True
                continue
            if not in_data:
                continue
            parts = [p.strip() for p in line.split(",")]
            # Drop trailing empty fields from malformed rows
            while parts and parts[-1] == "":
                parts.pop()
            if len(parts) != 25:
                continue
            rows.append(parts)

    columns = [
        "age", "bp", "sg", "al", "su", "rbc", "pc", "pcc", "ba", "bgr",
        "bu", "sc", "sod", "pot", "hemo", "pcv", "wbcc", "rbcc",
        "htn", "dm", "cad", "appet", "pe", "ane", "class",
    ]
    df = pd.DataFrame(rows, columns=columns)
    df = df.replace("?", np.nan)
    numeric_cols = [
        "age",
        "bp",
        "bgr",
        "bu",
        "sc",
        "sod",
        "pot",
        "hemo",
        "pcv",
        "wbcc",
        "rbcc",
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=["bu", "sc", "hemo", "bp", "age", "class"])
    return df


def train_ckd_model():
    df = load_ckd_dataframe()
    features = ["bu", "sc", "hemo", "bp", "age"]
    feature_labels = {
        "bu": "Blood Urea",
        "sc": "Serum Creatinine",
        "hemo": "Hemoglobin",
        "bp": "Blood Pressure",
        "age": "Age",
    }

    X = df[features]
    y = (df["class"] == "ckd").astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric="logloss",
    )
    model.fit(X_train, y_train)

    acc = model.score(X_test, y_test)
    print(f"CKD model accuracy: {acc:.3f}")

    artifact = {
        "model": model,
        "features": features,
        "model_type": "ckd",
        "feature_labels": feature_labels,
    }
    path = os.path.join(MODELS_DIR, "ckd_model.pkl")
    joblib.dump(artifact, path)
    print(f"Saved {path}")
    return artifact


def train_diabetes_model():
    df = pd.read_csv(os.path.join(DATASETS, "diabetes.csv"))
    features = ["Glucose", "BMI", "BloodPressure", "Insulin", "Age"]
    feature_labels = {
        "Glucose": "Glucose",
        "BMI": "BMI",
        "BloodPressure": "Blood Pressure",
        "Insulin": "Insulin",
        "Age": "Age",
    }

    # Replace zeros with median for clinical fields where 0 is invalid
    for col in ["Glucose", "BloodPressure", "BMI", "Insulin"]:
        median = df.loc[df[col] > 0, col].median()
        df[col] = df[col].replace(0, median)

    X = df[features]
    y = df["Outcome"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric="logloss",
    )
    model.fit(X_train, y_train)

    acc = model.score(X_test, y_test)
    print(f"Diabetes model accuracy: {acc:.3f}")

    artifact = {
        "model": model,
        "features": features,
        "model_type": "diabetes",
        "feature_labels": feature_labels,
    }
    path = os.path.join(MODELS_DIR, "diabetes_model.pkl")
    joblib.dump(artifact, path)
    print(f"Saved {path}")
    return artifact


if __name__ == "__main__":
    print("Training health risk models...")
    train_anemia_model()
    train_ckd_model()
    train_diabetes_model()
    print("All models trained successfully.")
