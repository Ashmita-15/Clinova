import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, User, Droplets, History, ArrowRight, Activity, ClipboardList } from 'lucide-react'
import { analyzeAssessment, getAssessments } from '../api/client'

const initialPatient = { name: '', age: '', gender: 'Male' }

const initialBlood = {
  hemoglobin: '',
  rbc: '',
  wbc: '',
  platelets: '',
  mcv: '',
  mch: '',
  mchc: '',
  blood_urea: '',
  serum_creatinine: '',
  glucose: '',
  bmi: '',
  blood_pressure: '',
  insulin: '',
}

function Field({ label, name, value, onChange, type = 'number', step = 'any', placeholder, required = true }) {
  return (
    <div className="flex flex-col">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex justify-between items-center">
        <span>{label}</span>
        {!required && (
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            optional
          </span>
        )}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all duration-200 text-sm text-slate-800 placeholder-slate-400 shadow-sm"
      />
    </div>
  )
}

const RISK_BADGES = {
  High: 'bg-rose-50 text-rose-700 border-rose-100',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
}

export default function AssessmentForm() {
  const navigate = useNavigate()
  const [patient, setPatient] = useState(initialPatient)
  const [blood, setBlood] = useState(initialBlood)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAssessments(5)
      .then(setRecent)
      .catch((err) => console.error('Failed to fetch recent assessments:', err))
  }, [])

  const handlePatient = (e) => setPatient({ ...patient, [e.target.name]: e.target.value })
  const handleBlood = (e) => setBlood({ ...blood, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        patient: {
          name: patient.name,
          age: parseInt(patient.age, 10),
          gender: patient.gender,
        },
        blood: {
          hemoglobin: parseFloat(blood.hemoglobin),
          rbc: blood.rbc ? parseFloat(blood.rbc) : null,
          wbc: blood.wbc ? parseFloat(blood.wbc) : null,
          platelets: blood.platelets ? parseFloat(blood.platelets) : null,
          mcv: parseFloat(blood.mcv),
          mch: parseFloat(blood.mch),
          mchc: parseFloat(blood.mchc),
          blood_urea: blood.blood_urea ? parseFloat(blood.blood_urea) : null,
          serum_creatinine: blood.serum_creatinine ? parseFloat(blood.serum_creatinine) : null,
          glucose: blood.glucose ? parseFloat(blood.glucose) : null,
          bmi: blood.bmi ? parseFloat(blood.bmi) : null,
          blood_pressure: blood.blood_pressure ? parseFloat(blood.blood_pressure) : null,
          insulin: blood.insulin ? parseFloat(blood.insulin) : null,
        },
      }
      const result = await analyzeAssessment(payload)
      navigate(`/results/${result.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Assessment failed. Please check your inputs and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-50/50 min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-50 border border-primary-100 text-primary-800 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-primary-600 animate-pulse" />
            Decision Support System
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Health Assessment Portal
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Enter clinical markers below to evaluate health risks. Only anemia diagnostics parameters are required.
          </p>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          
          {/* Main Form Section */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
            
            {/* Patient Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Patient Profile</h2>
                  <p className="text-xs text-slate-400">Demographic factors for risk analysis calculations</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-6">
                <Field
                  label="Full Name"
                  name="name"
                  value={patient.name}
                  onChange={handlePatient}
                  type="text"
                  placeholder="John Doe"
                />
                <Field
                  label="Age"
                  name="age"
                  value={patient.age}
                  onChange={handlePatient}
                  placeholder="45"
                />
                <div className="flex flex-col">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={patient.gender}
                    onChange={handlePatient}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all duration-200 text-sm text-slate-800 shadow-sm cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Diagnostic Parameters Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Clinical Markers</h2>
                  <p className="text-xs text-slate-400">Complete Blood Count (CBC) and Metabolic panel</p>
                </div>
              </div>

              {/* Compulsory Fields Segment */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                    Compulsory Markers
                  </span>
                  <span className="h-[1px] bg-slate-100 flex-grow" />
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
                  <Field label="Hemoglobin (g/dL)" name="hemoglobin" value={blood.hemoglobin} onChange={handleBlood} placeholder="13.5" />
                  <Field label="MCV (fL)" name="mcv" value={blood.mcv} onChange={handleBlood} placeholder="90" />
                  <Field label="MCH (pg)" name="mch" value={blood.mch} onChange={handleBlood} placeholder="29" />
                  <Field label="MCHC (g/dL)" name="mchc" value={blood.mchc} onChange={handleBlood} placeholder="33" />
                </div>
              </div>

              {/* Optional Fields Segment */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Optional Markers
                  </span>
                  <span className="h-[1px] bg-slate-100 flex-grow" />
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Field label="RBC (million/µL)" name="rbc" value={blood.rbc} onChange={handleBlood} placeholder="4.8" required={false} />
                  <Field label="WBC (cells/µL)" name="wbc" value={blood.wbc} onChange={handleBlood} placeholder="7500" required={false} />
                  <Field label="Platelets (/µL)" name="platelets" value={blood.platelets} onChange={handleBlood} placeholder="250000" required={false} />
                  <Field label="Blood Urea (mg/dL)" name="blood_urea" value={blood.blood_urea} onChange={handleBlood} placeholder="25" required={false} />
                  <Field label="Serum Creatinine (mg/dL)" name="serum_creatinine" value={blood.serum_creatinine} onChange={handleBlood} placeholder="1.0" step="0.01" required={false} />
                  <Field label="Glucose (mg/dL)" name="glucose" value={blood.glucose} onChange={handleBlood} placeholder="100" required={false} />
                  <Field label="BMI (kg/m²)" name="bmi" value={blood.bmi} onChange={handleBlood} placeholder="24.5" required={false} />
                  <Field label="Blood Pressure (mmHg)" name="blood_pressure" value={blood.blood_pressure} onChange={handleBlood} placeholder="120" required={false} />
                  <Field label="Insulin (µU/mL)" name="insulin" value={blood.insulin} onChange={handleBlood} placeholder="80" required={false} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-800 text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-primary-900 focus:ring-4 focus:ring-primary-500/20 disabled:opacity-60 transition-all duration-200 shadow-lg shadow-primary-900/10 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Running ML Classifiers...
                  </>
                ) : (
                  <>
                    Evaluate Health Risks
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sidebar - Recent Assessments (Latest 5) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-800">Recent Assessments</h3>
                </div>
                <Link to="/history" className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors">
                  View all
                </Link>
              </div>

              {recent.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium">No recent entries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recent.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary-50 border border-primary-100/50 flex items-center justify-center text-[10px] font-bold text-primary-700">
                            {item.patient_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{item.patient_name}</p>
                            <p className="text-[10px] text-slate-400">{item.age} yrs · {item.gender}</p>
                          </div>
                        </div>
                        <Link to={`/results/${item.id}`} className="text-[10px] font-bold text-primary-600 hover:underline">
                          Report →
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100/50 text-[9px] font-medium text-slate-500">
                        <span className={`px-1.5 py-0.5 rounded border ${RISK_BADGES[item.anemia.category] || 'bg-slate-50 text-slate-700'}`}>
                          Anemia: {item.anemia.category}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border ${RISK_BADGES[item.kidney.category] || 'bg-slate-50 text-slate-700'}`}>
                          Kidney: {item.kidney.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Support Box */}
            <div className="bg-gradient-to-br from-primary-900 to-primary-800 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
              <Activity className="w-8 h-8 text-primary-300 mb-3" />
              <h4 className="text-sm font-bold mb-1">Clinical Guidelines</h4>
              <p className="text-xs text-primary-100/80 leading-relaxed">
                The models analyze patterns using XGBoost. Standard clinical limits apply. Make sure to download and sign the PDF report after receiving findings.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
