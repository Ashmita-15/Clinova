import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import Assessment, get_db
from app.schemas.assessment import (
    AssessmentRequest,
    AssessmentResponse,
    RiskResult,
)
from app.services.explainability import (
    explain_anemia,
    explain_diabetes,
    explain_kidney,
)
from app.services.ml_service import ml_service
from app.services.pdf_service import generate_pdf_report
from app.services.recommendation_engine import (
    get_health_suggestions,
    get_test_recommendations,
)

router = APIRouter(prefix="/api/assessment", tags=["Assessment"])


def _build_response(
    db_assessment: Assessment,
    anemia_factors: list[str],
    kidney_factors: list[str],
    diabetes_factors: list[str],
    tests,
    suggestions: list[str],
) -> AssessmentResponse:
    from app.schemas.assessment import BloodParametersResponse
    return AssessmentResponse(
        id=db_assessment.id,
        patient_name=db_assessment.patient_name,
        age=db_assessment.age,
        gender=db_assessment.gender,
        assessment_date=db_assessment.created_at.strftime("%Y-%m-%d %H:%M UTC"),
        blood=BloodParametersResponse(
            hemoglobin=db_assessment.hemoglobin,
            mcv=db_assessment.mcv,
            mch=db_assessment.mch,
            mchc=db_assessment.mchc,
            rbc=db_assessment.rbc,
            wbc=db_assessment.wbc,
            platelets=db_assessment.platelets,
            blood_urea=db_assessment.blood_urea,
            serum_creatinine=db_assessment.serum_creatinine,
            glucose=db_assessment.glucose,
            bmi=db_assessment.bmi,
            blood_pressure=db_assessment.blood_pressure,
            insulin=db_assessment.insulin,
        ),
        anemia=RiskResult(
            category=db_assessment.anemia_risk,
            probability=db_assessment.anemia_probability,
            percentage=round(db_assessment.anemia_probability * 100, 1),
            contributing_factors=anemia_factors,
        ),
        kidney=RiskResult(
            category=db_assessment.kidney_risk,
            probability=db_assessment.kidney_probability,
            percentage=round(db_assessment.kidney_probability * 100, 1),
            contributing_factors=kidney_factors,
        ),
        diabetes=RiskResult(
            category=db_assessment.diabetes_risk,
            probability=db_assessment.diabetes_probability,
            percentage=round(db_assessment.diabetes_probability * 100, 1),
            contributing_factors=diabetes_factors,
        ),
        recommended_tests=tests,
        health_suggestions=suggestions,
    )


@router.get("", response_model=list[AssessmentResponse])
def get_all_assessments(limit: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Assessment).order_by(Assessment.created_at.desc())
    if limit is not None:
        query = query.limit(limit)
    records = query.all()

    results = []
    from app.schemas.assessment import TestRecommendation
    for record in records:
        explanations = json.loads(record.explanations or "{}")
        tests_raw = json.loads(record.recommended_tests or "[]")
        suggestions = json.loads(record.health_suggestions or "[]")
        tests = [TestRecommendation(**t) for t in tests_raw]
        results.append(
            _build_response(
                record,
                explanations.get("anemia", []),
                explanations.get("kidney", []),
                explanations.get("diabetes", []),
                tests,
                suggestions,
            )
        )
    return results


@router.post("/analyze", response_model=AssessmentResponse)
def analyze_assessment(request: AssessmentRequest, db: Session = Depends(get_db)):
    patient = request.patient
    blood = request.blood.model_dump()

    try:
        anemia_cat, anemia_proba, anemia_feats = ml_service.predict_anemia(
            patient.gender, blood
        )
        kidney_cat, kidney_proba, kidney_feats = ml_service.predict_kidney(
            patient.age, blood
        )
        diabetes_cat, diabetes_proba, diabetes_feats = ml_service.predict_diabetes(
            patient.age, blood
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    anemia_imp = ml_service.get_feature_importance("anemia")
    kidney_imp = ml_service.get_feature_importance("ckd")
    diabetes_imp = ml_service.get_feature_importance("diabetes")

    anemia_factors = explain_anemia(patient.gender, anemia_feats, anemia_imp)
    kidney_factors = explain_kidney(patient.age, kidney_feats, kidney_imp)
    diabetes_factors = explain_diabetes(patient.age, diabetes_feats, diabetes_imp)

    tests = get_test_recommendations(anemia_cat, kidney_cat, diabetes_cat)
    suggestions = get_health_suggestions(anemia_cat, kidney_cat, diabetes_cat)

    db_assessment = Assessment(
        patient_name=patient.name,
        age=patient.age,
        gender=patient.gender,
        hemoglobin=blood["hemoglobin"],
        rbc=blood["rbc"],
        wbc=blood["wbc"],
        platelets=blood["platelets"],
        mcv=blood["mcv"],
        mch=blood["mch"],
        mchc=blood["mchc"],
        blood_urea=blood["blood_urea"],
        serum_creatinine=blood["serum_creatinine"],
        glucose=blood["glucose"],
        bmi=blood["bmi"],
        blood_pressure=blood["blood_pressure"],
        insulin=blood.get("insulin"),
        anemia_risk=anemia_cat,
        anemia_probability=anemia_proba,
        kidney_risk=kidney_cat,
        kidney_probability=kidney_proba,
        diabetes_risk=diabetes_cat,
        diabetes_probability=diabetes_proba,
        explanations=json.dumps(
            {
                "anemia": anemia_factors,
                "kidney": kidney_factors,
                "diabetes": diabetes_factors,
            }
        ),
        recommended_tests=json.dumps([t.model_dump() for t in tests]),
        health_suggestions=json.dumps(suggestions),
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)

    return _build_response(
        db_assessment, anemia_factors, kidney_factors, diabetes_factors, tests, suggestions
    )


@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(assessment_id: int, db: Session = Depends(get_db)):
    record = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")

    explanations = json.loads(record.explanations or "{}")
    tests_raw = json.loads(record.recommended_tests or "[]")
    suggestions = json.loads(record.health_suggestions or "[]")

    from app.schemas.assessment import TestRecommendation

    tests = [TestRecommendation(**t) for t in tests_raw]

    return _build_response(
        record,
        explanations.get("anemia", []),
        explanations.get("kidney", []),
        explanations.get("diabetes", []),
        tests,
        suggestions,
    )


@router.get("/{assessment_id}/report")
def download_report(assessment_id: int, db: Session = Depends(get_db)):
    record = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")

    explanations = json.loads(record.explanations or "{}")
    tests_raw = json.loads(record.recommended_tests or "[]")
    suggestions = json.loads(record.health_suggestions or "[]")

    from app.schemas.assessment import TestRecommendation

    tests = [TestRecommendation(**t) for t in tests_raw]
    response = _build_response(
        record,
        explanations.get("anemia", []),
        explanations.get("kidney", []),
        explanations.get("diabetes", []),
        tests,
        suggestions,
    )

    filepath = generate_pdf_report(response)
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"health_assessment_{assessment_id}.pdf",
    )
