import json
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.config import settings
from app.schemas.assessment import AssessmentResponse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPORTS_DIR = os.path.join(ROOT, settings.reports_dir.lstrip("./").lstrip("../"))


def _ensure_reports_dir() -> str:
    path = REPORTS_DIR
    if not os.path.isdir(path):
        alt = os.path.abspath(os.path.join(ROOT, "..", "reports"))
        os.makedirs(alt, exist_ok=True)
        return alt
    os.makedirs(path, exist_ok=True)
    return path


def generate_pdf_report(assessment: AssessmentResponse) -> str:
    reports_path = _ensure_reports_dir()
    filename = f"health_report_{assessment.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(reports_path, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#1e40af"),
        spaceAfter=12,
    )
    heading = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#1e3a5f"),
        spaceBefore=14,
        spaceAfter=8,
    )
    body = styles["Normal"]
    disclaimer = ParagraphStyle(
        "Disclaimer",
        parent=styles["Italic"],
        fontSize=9,
        textColor=colors.grey,
    )

    story = []
    story.append(Paragraph("Health Risk Assessment Report", title_style))
    story.append(
        Paragraph(
            "AI-Powered Health Screening for Coal Mine Communities",
            body,
        )
    )
    story.append(Spacer(1, 0.2 * inch))

    patient_data = [
        ["Patient Name", assessment.patient_name],
        ["Age", str(assessment.age)],
        ["Gender", assessment.gender],
        ["Assessment Date", assessment.assessment_date],
    ]
    t = Table(patient_data, colWidths=[2.2 * inch, 4 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eff6ff")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ]
        )
    )
    story.append(t)

    def fmt(val, unit):
        return f"{val} {unit}" if val is not None else "Not Entered"

    story.append(Paragraph("Entered Blood Test Parameters", heading))
    clinical_data = [
        ["Haemoglobin", fmt(assessment.blood.haemoglobin, "g/dL"), "MCV", fmt(assessment.blood.mcv, "fL")],
        ["MCH", fmt(assessment.blood.mch, "pg"), "MCHC", fmt(assessment.blood.mchc, "g/dL")],
        ["RBC", fmt(assessment.blood.rbc, "million/µL"), "WBC", fmt(assessment.blood.wbc, "cells/µL")],
        ["Platelets", fmt(assessment.blood.platelets, "/µL"), "Blood Urea", fmt(assessment.blood.blood_urea, "mg/dL")],
        ["Serum Creatinine", fmt(assessment.blood.serum_creatinine, "mg/dL"), "Glucose", fmt(assessment.blood.glucose, "mg/dL")],
        ["BMI", fmt(assessment.blood.bmi, "kg/m²"), "Blood Pressure", fmt(assessment.blood.blood_pressure, "mmHg")],
        ["Insulin", fmt(assessment.blood.insulin, "µU/mL"), "", ""],
    ]
    ct = Table(clinical_data, colWidths=[2.0 * inch, 1.1 * inch, 2.0 * inch, 1.1 * inch])
    ct.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
                ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#f8fafc")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ]
        )
    )
    story.append(ct)
    story.append(Spacer(1, 0.1 * inch))

    story.append(Paragraph("Risk Assessment Summary", heading))
    risk_data = [
        ["Condition", "Risk Level", "Probability"],
        [
            "Anemia",
            assessment.anemia.category,
            f"{assessment.anemia.percentage:.1f}%",
        ],
        [
            "Kidney Disease",
            assessment.kidney.category,
            f"{assessment.kidney.percentage:.1f}%",
        ],
        [
            "Diabetes",
            assessment.diabetes.category,
            f"{assessment.diabetes.percentage:.1f}%",
        ],
    ]
    rt = Table(risk_data, colWidths=[2.2 * inch, 2 * inch, 2 * inch])
    rt.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ]
        )
    )
    story.append(rt)

    for label, risk in [
        ("Anemia", assessment.anemia),
        ("Kidney Disease", assessment.kidney),
        ("Diabetes", assessment.diabetes),
    ]:
        story.append(Paragraph(f"{label} — Contributing Factors", heading))
        for factor in risk.contributing_factors:
            story.append(Paragraph(f"• {factor}", body))

    story.append(Paragraph("Recommended Diagnostic Tests", heading))
    for test in assessment.recommended_tests:
        story.append(
            Paragraph(
                f"<b>{test.test_name}</b> [{test.priority}] — {test.purpose}",
                body,
            )
        )

    story.append(Paragraph("Health Suggestions", heading))
    for suggestion in assessment.health_suggestions:
        story.append(Paragraph(f"• {suggestion}", body))

    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph(assessment.disclaimer, disclaimer))

    doc.build(story)
    return filepath
