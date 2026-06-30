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
        recent_assessments=recent,
    )
