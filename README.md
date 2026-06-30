# AI-Powered Health Risk Assessment System

Decision-support platform for coal mine communities that analyzes blood test reports, assesses health risks using machine learning, and recommends follow-up diagnostic tests.

> **Disclaimer:** This system does not diagnose diseases. It provides risk assessment and recommendations for preventive healthcare. Always consult a qualified medical professional.

## Project Structure

```
Health-Risk-Assessment-System/
├── datasets/          # Training datasets (anemia, CBC, diabetes, CKD)
├── models/            # Trained ML models (.pkl)
├── notebooks/         # Model training scripts
├── backend/           # FastAPI REST API
├── frontend/          # React + Tailwind UI
└── reports/           # Generated PDF reports
```

## Quick Start

### 1. Train ML Models

```bash
cd notebooks
pip install pandas numpy scikit-learn xgboost scipy joblib
python train_models.py
```

### 2. Start Backend

```bash
cd backend
pip install -r requirements.txt
python scripts/fix_libomp.py   # macOS only: XGBoost OpenMP (no Homebrew libomp needed)
cp .env.example .env   # Edit DATABASE_URL if using PostgreSQL
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Database

By default, SQLite is used (`sqlite:///./health_risk.db`) for easy local setup.

For PostgreSQL, set in `backend/.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/health_risk_db
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assessment/analyze` | Run health risk assessment |
| GET | `/api/assessment/{id}` | Get assessment results |
| GET | `/api/assessment/{id}/report` | Download PDF report |
| GET | `/api/admin/stats` | Admin analytics |
| GET | `/api/health` | Health check |

## ML Models

| Model | Features | Output |
|-------|----------|--------|
| Anemia | Gender, Hb, MCH, MCHC, MCV | Low / Medium / High |
| CKD | Blood Urea, Creatinine, Hb, BP, Age | Low / Medium / High |
| Diabetes | Glucose, BMI, BP, Insulin, Age | Low / Medium / High |

## Technology Stack

- **Frontend:** React, Tailwind CSS, Recharts, Vite
- **Backend:** FastAPI, SQLAlchemy, ReportLab
- **ML:** Scikit-learn, XGBoost, Joblib
- **Database:** PostgreSQL (production) / SQLite (dev)

## Deployment

- **Frontend:** Vercel (`npm run build`)
- **Backend:** Render / Railway / AWS (`uvicorn main:app --host 0.0.0.0 --port 8000`)

Set `VITE_API_URL` to your backend URL in production.
