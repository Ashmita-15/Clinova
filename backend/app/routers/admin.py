from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import Assessment, get_db
from app.schemas.assessment import AdminStats

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(db: Session = Depends(get_db)):
    assessments = db.query(Assessment).order_by(Assessment.created_at.desc()).all()
    total = len(assessments)

    risk_counter: Counter = Counter()
    anemia_dist: Counter = Counter()
    kidney_dist: Counter = Counter()
    diabetes_dist: Counter = Counter()

    age_groups = {
        "Under 30": {"Low": 0, "Medium": 0, "High": 0},
        "30-45": {"Low": 0, "Medium": 0, "High": 0},
        "46-60": {"Low": 0, "Medium": 0, "High": 0},
        "Over 60": {"Low": 0, "Medium": 0, "High": 0},
    }

    risk_weights = {"Low": 0, "Medium": 1, "High": 2}
    risk_labels = {0: "Low", 1: "Medium", 2: "High"}

    for a in assessments:
        for risk in (a.anemia_risk, a.kidney_risk, a.diabetes_risk):
            if risk:
                risk_counter[f"{risk} Risk"] += 1
        if a.anemia_risk:
            anemia_dist[a.anemia_risk] += 1
        if a.kidney_risk:
            kidney_dist[a.kidney_risk] += 1
        if a.diabetes_risk:
            diabetes_dist[a.diabetes_risk] += 1

        # Group by Age Group
        if a.age < 30:
            group = "Under 30"
        elif a.age <= 45:
            group = "30-45"
        elif a.age <= 60:
            group = "46-60"
        else:
            group = "Over 60"

        # Determine overall max risk for this patient
        patient_risks = [a.anemia_risk, a.kidney_risk, a.diabetes_risk]
        valid_risks = [r for r in patient_risks if r in risk_weights]
        if valid_risks:
            max_risk_val = max(risk_weights[r] for r in valid_risks)
            max_risk_label = risk_labels[max_risk_val]
            age_groups[group][max_risk_label] += 1

    age_risk_dist = [
        {
            "age_group": group,
            "Low": counts["Low"],
            "Medium": counts["Medium"],
            "High": counts["High"],
        }
        for group, counts in age_groups.items()
    ]

    recent = [
        {
            "id": a.id,
            "patient_name": a.patient_name,
            "age": a.age,
            "gender": a.gender,
            "anemia_risk": a.anemia_risk,
            "kidney_risk": a.kidney_risk,
            "diabetes_risk": a.diabetes_risk,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in assessments[:10]
    ]

    return AdminStats(
        total_assessments=total,
        risk_distribution=dict(risk_counter),
        anemia_distribution=dict(anemia_dist),
        kidney_distribution=dict(kidney_dist),
        diabetes_distribution=dict(diabetes_dist),
        age_risk_distribution=age_risk_dist,
        recent_assessments=recent,
    )
