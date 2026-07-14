import json
import io
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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
            pcv=db_assessment.pcv,
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
            patient.gender, patient.age,blood
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
        pcv=blood["pcv"],
        mcv=blood["mcv"],
        mch=blood["mch"],
        mchc=blood["mchc"],
        wbc=blood["wbc"],
        platelets=blood["platelets"],
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


@router.post("/analyze-bulk", response_model=list[AssessmentResponse])
def analyze_bulk_assessments(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = file.file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload a CSV or Excel file.",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Normalize column names: lowercase, strip, replace spaces/underscores
    normalized_cols = {}
    for col in df.columns:
        norm = str(col).lower().strip().replace(" ", "").replace("_", "")
        normalized_cols[norm] = col

    column_mappings = {
        "name": ["name", "patientname", "fullname", "patient"],
        "age": ["age"],
        "gender": ["gender", "sex"],
        "hemoglobin": ["hemoglobin", "hemo", "hb"],
        "mcv": ["mcv"],
        "mch": ["mch"],
        "mchc": ["mchc"],
        "rbc": ["rbc"],
        "wbc": ["wbc"],
        "platelets": ["platelets"],
        "blood_urea": ["bloodurea", "bu", "blood_urea"],
        "serum_creatinine": ["serumcreatinine", "sc", "serum_creatinine"],
        "glucose": ["glucose"],
        "bmi": ["bmi"],
        "blood_pressure": ["bloodpressure", "bp", "blood_pressure"],
        "insulin": ["insulin"],
        "pcv": ["pcv", "hematocrit", "hct", "pcv/hct"],
    }

    mapped_columns = {}
    for target, aliases in column_mappings.items():
        for alias in aliases:
            norm_alias = alias.replace("_", "").lower()
            if norm_alias in normalized_cols:
                mapped_columns[target] = normalized_cols[norm_alias]
                break

    compulsory_keys = ["name","age","gender","hemoglobin","rbc","pcv","mcv","mch","mchc",]
    missing_compulsory = [k for k in compulsory_keys if k not in mapped_columns]
    if missing_compulsory:
        raise HTTPException(
            status_code=400,
            detail=f"Missing compulsory columns: {', '.join(missing_compulsory)}. Please check your spreadsheet headers.",
        )

    results = []

    for index, row in df.iterrows():
        row_num = index + 2  # Row index in Excel/CSV is 1-based + 1 for header
        try:
            raw_name = str(row[mapped_columns["name"]]).strip()
            if not raw_name or pd.isna(row[mapped_columns["name"]]):
                raw_name = f"Patient {index + 1}"

            raw_age = row[mapped_columns["age"]]
            if pd.isna(raw_age):
                raise ValueError("Age is missing")
            age = int(float(raw_age))
            if age < 1 or age > 120:
                raise ValueError(f"Age {age} must be between 1 and 120")

            raw_gender = str(row[mapped_columns["gender"]]).strip().lower()
            if raw_gender in ("male", "m"):
                gender = "Male"
            elif raw_gender in ("female", "f"):
                gender = "Female"
            else:
                gender = "Other"

           # Compulsory blood parameters
            hemoglobin = float(row[mapped_columns["hemoglobin"]])
            rbc = float(row[mapped_columns["rbc"]])
            pcv = float(row[mapped_columns["pcv"]])
            mcv = float(row[mapped_columns["mcv"]])
            mch = float(row[mapped_columns["mch"]])
            mchc = float(row[mapped_columns["mchc"]])


            if not (0 <= hemoglobin <= 25):
                raise ValueError(f"Hemoglobin value {hemoglobin} out of range [0, 25]")

            if not (0 <= rbc <= 10):
                raise ValueError(f"RBC value {rbc} out of range [0, 10]")

            if not (0 <= pcv <= 70):
                raise ValueError(f"PCV value {PCV} out of range [0, 70]")

            if not (0 <= mcv <= 150):
                raise ValueError(f"MCV value {mcv} out of range [0, 150]")

            if not (0 <= mch <= 50):
                raise ValueError(f"MCH value {mch} out of range [0, 50]")

            if not (0 <= mchc <= 50):
                raise ValueError(f"MCHC value {mchc} out of range [0, 50]")

            

            # Optional blood parameters helper
            def get_optional_float(key, min_val, max_val):
                if key in mapped_columns:
                    val = row[mapped_columns[key]]
                    if not pd.isna(val):
                        f_val = float(val)
                        if min_val <= f_val <= max_val:
                            return f_val
                return None


            wbc = get_optional_float("wbc", 0, 50000)
            platelets = get_optional_float("platelets", 0, 1000000)
            blood_urea = get_optional_float("blood_urea", 0, 300)
            serum_creatinine = get_optional_float("serum_creatinine", 0, 20)
            glucose = get_optional_float("glucose", 0, 500)
            bmi = get_optional_float("bmi", 5, 80)
            blood_pressure = get_optional_float("blood_pressure", 40, 250)
            insulin = get_optional_float("insulin", 0, 1000)

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: validation failed: {str(e)}",
            )

        # Assemble blood dictionary for predictions
        blood_dict = {
            "hemoglobin": hemoglobin,
            "rbc": rbc,
            "pcv": pcv,
            "mcv": mcv,
            "mch": mch,
            "mchc": mchc,
            "wbc": wbc,
            "platelets": platelets,
            "blood_urea": blood_urea,
            "serum_creatinine": serum_creatinine,
            "glucose": glucose,
            "bmi": bmi,
            "blood_pressure": blood_pressure,
            "insulin": insulin,
        }

        # Run predictions
        try:
            anemia_cat, anemia_proba, anemia_feats = ml_service.predict_anemia(
                gender, age,blood_dict
            )
            kidney_cat, kidney_proba, kidney_feats = ml_service.predict_kidney(
                age, blood_dict
            )
            diabetes_cat, diabetes_proba, diabetes_feats = ml_service.predict_diabetes(
                age, blood_dict
            )
        except FileNotFoundError as e:
            raise HTTPException(status_code=503, detail=str(e))

        anemia_imp = ml_service.get_feature_importance("anemia")
        kidney_imp = ml_service.get_feature_importance("ckd")
        diabetes_imp = ml_service.get_feature_importance("diabetes")

        anemia_factors = explain_anemia(gender, anemia_feats, anemia_imp)
        kidney_factors = explain_kidney(age, kidney_feats, kidney_imp)
        diabetes_factors = explain_diabetes(age, diabetes_feats, diabetes_imp)

        tests = get_test_recommendations(anemia_cat, kidney_cat, diabetes_cat)
        suggestions = get_health_suggestions(anemia_cat, kidney_cat, diabetes_cat)

        db_assessment = Assessment(
            patient_name=raw_name,
            age=age,
            gender=gender,
            hemoglobin=hemoglobin,
            rbc=rbc,
            pcv=pcv,
            wbc=wbc,
            platelets=platelets,
            mcv=mcv,
            mch=mch,
            mchc=mchc,
            blood_urea=blood_urea,
            serum_creatinine=serum_creatinine,
            glucose=glucose,
            bmi=bmi,
            blood_pressure=blood_pressure,
            insulin=insulin,
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

        results.append(
            _build_response(
                db_assessment,
                anemia_factors,
                kidney_factors,
                diabetes_factors,
                tests,
                suggestions,
            )
        )

    return results
