from app.schemas.assessment import TestRecommendation

ANEMIA_TESTS = [
    TestRecommendation(
        test_name="Serum Ferritin",
        purpose="Measures iron stores in the body to confirm iron deficiency",
        priority="High",
    ),
    TestRecommendation(
        test_name="Iron Profile",
        purpose="Evaluates serum iron, TIBC, and transferrin saturation",
        priority="High",
    ),
    TestRecommendation(
        test_name="Peripheral Blood Smear",
        purpose="Examines blood cell morphology for anemia type",
        priority="Medium",
    ),
]

KIDNEY_TESTS = [
    TestRecommendation(
        test_name="eGFR",
        purpose="Estimates glomerular filtration rate for kidney function",
        priority="High",
    ),
    TestRecommendation(
        test_name="Renal Function Test",
        purpose="Comprehensive panel for kidney health assessment",
        priority="High",
    ),
    TestRecommendation(
        test_name="Serum Creatinine",
        purpose="Monitors kidney filtration efficiency",
        priority="Medium",
    ),
]

DIABETES_TESTS = [
    TestRecommendation(
        test_name="HbA1c",
        purpose="Measures average blood sugar over 2-3 months",
        priority="High",
    ),
    TestRecommendation(
        test_name="Fasting Blood Sugar",
        purpose="Screens for impaired fasting glucose",
        priority="High",
    ),
    TestRecommendation(
        test_name="Oral Glucose Tolerance Test",
        purpose="Confirms glucose metabolism abnormalities",
        priority="Medium",
    ),
]

ANEMIA_SUGGESTIONS = [
    "Increase iron-rich foods (spinach, lentils, lean meat)",
    "Schedule regular blood monitoring every 3 months",
    "Consult a physician for anemia evaluation",
]

KIDNEY_SUGGESTIONS = [
    "Maintain adequate hydration throughout the day",
    "Reduce excess salt intake in daily diet",
    "Schedule kidney screening every six months",
]

DIABETES_SUGGESTIONS = [
    "Engage in regular physical exercise (30 min/day)",
    "Focus on weight management and balanced diet",
    "Monitor blood glucose levels regularly",
]

GENERAL_SUGGESTIONS = [
    "Schedule routine medical checkup with your doctor",
    "Maintain a healthy lifestyle with balanced nutrition",
    "Avoid exposure to environmental pollutants when possible",
]


def get_test_recommendations(
    anemia_risk: str, kidney_risk: str, diabetes_risk: str
) -> list[TestRecommendation]:
    tests: list[TestRecommendation] = []
    seen: set[str] = set()

    def add(tests_list: list[TestRecommendation]):
        for t in tests_list:
            if t.test_name not in seen:
                seen.add(t.test_name)
                tests.append(t)

    if anemia_risk == "High":
        add(ANEMIA_TESTS)
    elif anemia_risk == "Medium":
        add(ANEMIA_TESTS[:2])

    if kidney_risk == "High":
        add(KIDNEY_TESTS)
    elif kidney_risk == "Medium":
        add(KIDNEY_TESTS[:2])

    if diabetes_risk == "High":
        add(DIABETES_TESTS)
    elif diabetes_risk == "Medium":
        add(DIABETES_TESTS[:2])

    if not tests:
        tests.append(
            TestRecommendation(
                test_name="Complete Blood Count (CBC)",
                purpose="Routine blood health monitoring",
                priority="Low",
            )
        )

    return tests


def get_health_suggestions(
    anemia_risk: str, kidney_risk: str, diabetes_risk: str
) -> list[str]:
    suggestions: list[str] = []
    if anemia_risk in ("High", "Medium"):
        suggestions.extend(ANEMIA_SUGGESTIONS)
    if kidney_risk in ("High", "Medium"):
        suggestions.extend(KIDNEY_SUGGESTIONS)
    if diabetes_risk in ("High", "Medium"):
        suggestions.extend(DIABETES_SUGGESTIONS)
    suggestions.extend(GENERAL_SUGGESTIONS)
    # Deduplicate while preserving order
    seen: set[str] = set()
    unique = []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    return unique[:8]
