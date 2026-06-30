from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(120), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)

    hemoglobin = Column(Float)
    rbc = Column(Float)
    wbc = Column(Float)
    platelets = Column(Float)
    mcv = Column(Float)
    mch = Column(Float)
    mchc = Column(Float)
    blood_urea = Column(Float)
    serum_creatinine = Column(Float)
    glucose = Column(Float)
    bmi = Column(Float)
    blood_pressure = Column(Float)
    insulin = Column(Float, nullable=True)

    anemia_risk = Column(String(20))
    anemia_probability = Column(Float)
    kidney_risk = Column(String(20))
    kidney_probability = Column(Float)
    diabetes_risk = Column(String(20))
    diabetes_probability = Column(Float)

    explanations = Column(Text)
    recommended_tests = Column(Text)
    health_suggestions = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
