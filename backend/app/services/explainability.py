"""Clinical threshold-based explainability for risk factors."""

ANEMIA_THRESHOLDS = {
    "Hemoglobin": {
        "low": lambda v, g: v < (13.0 if g.lower() == "male" else 12.0),
        "message_low": "Low Hemoglobin",
    },
    "MCV": {"low": lambda v, _: v < 80, "message_low": "Low MCV"},
    "MCH": {"low": lambda v, _: v < 27, "message_low": "Low MCH"},
    "MCHC": {"low": lambda v, _: v < 32, "message_low": "Low MCHC"},
}

KIDNEY_THRESHOLDS = {
    "Blood Urea": {"high": lambda v: v > 40, "message_high": "High Blood Urea"},
    "Serum Creatinine": {
        "high": lambda v: v > 1.2,
        "message_high": "High Serum Creatinine",
    },
    "Hemoglobin": {"low": lambda v: v < 12, "message_low": "Low Hemoglobin"},
    "Blood Pressure": {
        "high": lambda v: v > 140,
        "message_high": "Elevated Blood Pressure",
    },
    "Age": {"high": lambda v: v > 60, "message_high": "Advanced Age (risk factor)"},
}

DIABETES_THRESHOLDS = {
    "Glucose": {"high": lambda v: v > 140, "message_high": "Elevated Glucose"},
    "BMI": {"high": lambda v: v > 30, "message_high": "High BMI (obesity risk)"},
    "Blood Pressure": {
        "high": lambda v: v > 130,
        "message_high": "Elevated Blood Pressure",
    },
    "Insulin": {"high": lambda v: v > 200, "message_high": "High Insulin levels"},
    "Age": {"high": lambda v: v > 45, "message_high": "Age-related risk factor"},
}


def _check_thresholds(
    values: dict,
    thresholds: dict,
    gender: str | None = None,
) -> list[str]:
    factors = []
    for key, rules in thresholds.items():
        val = values.get(key)
        if val is None:
            continue
        if "low" in rules:
            check = rules["low"]
            ok = check(val, gender) if gender else check(val)
            if ok:
                factors.append(rules["message_low"])
        if "high" in rules:
            if rules["high"](val):
                factors.append(rules["message_high"])
    return factors


def explain_anemia(gender: str, features: dict, importances: dict) -> list[str]:
    labeled = {
        "Hemoglobin": features.get("Hemoglobin"),
        "MCV": features.get("MCV"),
        "MCH": features.get("MCH"),
        "MCHC": features.get("MCHC"),
    }
    factors = _check_thresholds(labeled, ANEMIA_THRESHOLDS, gender)
    if not factors:
        top = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:2]
        factors = [f"Elevated influence from {name}" for name, _ in top]
    return factors


def explain_kidney(age: int, features: dict, importances: dict) -> list[str]:
    labeled = {
        "Blood Urea": features.get("bu"),
        "Serum Creatinine": features.get("sc"),
        "Hemoglobin": features.get("hemo"),
        "Blood Pressure": features.get("bp"),
        "Age": age,
    }
    factors = _check_thresholds(labeled, KIDNEY_THRESHOLDS)
    if not factors:
        top = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:2]
        factors = [f"Elevated influence from {name}" for name, _ in top]
    return factors


def explain_diabetes(age: int, features: dict, importances: dict) -> list[str]:
    labeled = {
        "Glucose": features.get("Glucose"),
        "BMI": features.get("BMI"),
        "Blood Pressure": features.get("BloodPressure"),
        "Insulin": features.get("Insulin"),
        "Age": age,
    }
    factors = _check_thresholds(labeled, DIABETES_THRESHOLDS)
    if not factors:
        top = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:2]
        factors = [f"Elevated influence from {name}" for name, _ in top]
    return factors
