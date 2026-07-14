from pydantic import BaseModel, Field


class PatientInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., pattern="^(Male|Female|male|female|Other|other)$")


class BloodParameters(BaseModel):
    hemoglobin: float = Field(..., ge=0, le=25)

    rbc: float = Field(..., ge=0, le=10)

    pcv: float = Field(..., ge=0, le=70)

    mcv: float = Field(..., ge=0, le=150)

    mch: float = Field(..., ge=0, le=50)

    mchc: float = Field(..., ge=0, le=50)

    wbc: float | None = Field(default=None, ge=0, le=50000)

    platelets: float | None = Field(default=None, ge=0, le=1000000)

    blood_urea: float | None = Field(default=None, ge=0, le=300)

    serum_creatinine: float | None = Field(default=None, ge=0, le=20)

    glucose: float | None = Field(default=None, ge=0, le=500)

    bmi: float | None = Field(default=None, ge=5, le=80)

    blood_pressure: float | None = Field(default=None, ge=40, le=250)

    insulin: float | None = Field(default=None, ge=0, le=1000)


class BloodParametersResponse(BaseModel):
    hemoglobin: float

    rbc: float

    pcv: float

    mcv: float

    mch: float

    mchc: float

    wbc: float | None = None

    platelets: float | None = None

    blood_urea: float | None = None

    serum_creatinine: float | None = None

    glucose: float | None = None

    bmi: float | None = None

    blood_pressure: float | None = None

    insulin: float | None = None


class AssessmentRequest(BaseModel):
    patient: PatientInput
    blood: BloodParameters


class RiskResult(BaseModel):
    category: str
    probability: float
    percentage: float
    contributing_factors: list[str]


class TestRecommendation(BaseModel):
    test_name: str
    purpose: str
    priority: str


class AssessmentResponse(BaseModel):
    id: int
    patient_name: str
    age: int
    gender: str
    assessment_date: str
    blood: BloodParametersResponse
    anemia: RiskResult
    kidney: RiskResult
    diabetes: RiskResult
    recommended_tests: list[TestRecommendation]
    health_suggestions: list[str]
    disclaimer: str = (
        "This system provides health risk assessment and decision support only. "
        "It does not diagnose diseases. Please consult a qualified healthcare professional."
    )


class AdminStats(BaseModel):
    total_assessments: int
    risk_distribution: dict[str, int]
    anemia_distribution: dict[str, int]
    kidney_distribution: dict[str, int]
    diabetes_distribution: dict[str, int]
    age_risk_distribution: list[dict]
    recent_assessments: list[dict]
