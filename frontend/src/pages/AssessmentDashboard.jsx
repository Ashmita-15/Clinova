import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, Loader2, AlertTriangle, TestTube, Lightbulb, Droplets } from 'lucide-react'
import { getAssessment, getReportUrl } from '../api/client'
import { ExplanationCard } from '../components/RiskCard'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const CHART_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' }

const PRIORITY_STYLES = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
}

export default function AssessmentDashboard() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAssessment(id)
      .then(setData)
      .catch(() => setError('Failed to load assessment results.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/assessment" className="text-primary-600 hover:underline">Start new assessment</Link>
      </div>
    )
  }

  const chartData = [
    { name: 'Anemia', value: data.anemia.percentage, category: data.anemia.category },
    { name: 'Kidney', value: data.kidney.percentage, category: data.kidney.category },
    { name: 'Diabetes', value: data.diabetes.percentage, category: data.diabetes.category },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Assessment Results</h1>
          <p className="text-slate-600 mt-1">
            {data.patient_name} · {data.age} yrs · {data.gender} · {data.assessment_date}
          </p>
        </div>
        <a
          href={getReportUrl(id)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF Report
        </a>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">{data.disclaimer}</p>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Risk Overview</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Risk Probability']} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={CHART_COLORS[entry.category]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <ExplanationCard title="Anemia Risk" risk={data.anemia} factors={data.anemia.contributing_factors} />
        <ExplanationCard title="Kidney Disease Risk" risk={data.kidney} factors={data.kidney.contributing_factors} />
        <ExplanationCard title="Diabetes Risk" risk={data.diabetes} factors={data.diabetes.contributing_factors} />
      </div>

      {/* Entered Clinical Parameters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Entered Clinical Parameters</h2>
            <p className="text-xs text-slate-400">Values provided during this assessment</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            { label: 'Hemoglobin', value: data.blood.hemoglobin, unit: 'g/dL' },
            { label: 'MCV', value: data.blood.mcv, unit: 'fL' },
            { label: 'MCH', value: data.blood.mch, unit: 'pg' },
            { label: 'MCHC', value: data.blood.mchc, unit: 'g/dL' },
            { label: 'RBC', value: data.blood.rbc, unit: 'million/µL' },
            { label: 'WBC', value: data.blood.wbc, unit: 'cells/µL' },
            { label: 'Platelets', value: data.blood.platelets, unit: '/µL' },
            { label: 'Blood Urea', value: data.blood.blood_urea, unit: 'mg/dL' },
            { label: 'Serum Creatinine', value: data.blood.serum_creatinine, unit: 'mg/dL' },
            { label: 'Glucose', value: data.blood.glucose, unit: 'mg/dL' },
            { label: 'BMI', value: data.blood.bmi, unit: 'kg/m²' },
            { label: 'Blood Pressure', value: data.blood.blood_pressure, unit: 'mmHg' },
            { label: 'Insulin', value: data.blood.insulin, unit: 'µU/mL' },
          ].map((param, index) => (
            <div key={index} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors duration-200">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{param.label}</p>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {param.value !== null && param.value !== undefined ? `${param.value} ${param.unit}` : 'Not Entered'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Test Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-5">
          <TestTube className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-slate-800">Recommended Diagnostic Tests</h2>
        </div>
        <div className="space-y-4">
          {data.recommended_tests.map((test, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <p className="font-medium text-slate-800">{test.test_name}</p>
                <p className="text-sm text-slate-600 mt-0.5">{test.purpose}</p>
              </div>
              <span className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_STYLES[test.priority]}`}>
                {test.priority} Priority
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Health Suggestions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-slate-800">Personalized Health Suggestions</h2>
        </div>
        <ul className="grid sm:grid-cols-2 gap-3">
          {data.health_suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <span className="text-emerald-500 font-bold">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center">
        <Link to="/assessment" className="text-primary-600 hover:underline font-medium">
          Start another assessment →
        </Link>
      </div>
    </div>
  )
}
