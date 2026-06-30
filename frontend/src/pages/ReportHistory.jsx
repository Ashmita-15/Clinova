import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Download, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  ClipboardList, 
  Calendar, 
  User, 
  Activity, 
  Filter 
} from 'lucide-react'
import { getAssessments, getReportUrl } from '../api/client'

const RISK_BADGES = {
  High: 'bg-rose-50 text-rose-700 border-rose-100 font-bold',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100 font-bold',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold',
}

export default function ReportHistory() {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRisk, setSelectedRisk] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    getAssessments()
      .then(setAssessments)
      .catch(() => setError('Failed to retrieve assessment history.'))
      .finally(() => setLoading(false))
  }, [])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const filtered = assessments.filter((a) => {
    const nameMatch = a.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
    if (selectedRisk === 'All') return nameMatch

    const riskMatch =
      a.anemia.category === selectedRisk ||
      a.kidney.category === selectedRisk ||
      a.diabetes.category === selectedRisk

    return nameMatch && riskMatch
  })

  const formatParam = (val, unit) => {
    return val !== null && val !== undefined ? `${val} ${unit}` : 'Not Entered'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <div className="bg-slate-50/50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            <ClipboardList className="w-4 h-4 text-slate-400" />
            Registry
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Report History</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Search, filter, and review clinical details of all health risk assessments.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Filter controls */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 mb-8 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-slate-50/50 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition duration-200 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full md:w-48 px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition duration-200 text-sm cursor-pointer"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">Contains High Risk</option>
              <option value="Medium">Contains Medium Risk</option>
              <option value="Low">Low Risk Only</option>
            </select>
          </div>
        </div>

        {/* Table/List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No assessments found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Try adjusting your search criteria or start a new health assessment.
            </p>
            <Link
              to="/assessment"
              className="inline-flex items-center gap-2 bg-primary-800 text-white px-5 py-2.5 rounded-xl font-semibold text-xs mt-6 hover:bg-primary-900 transition-colors shadow-sm cursor-pointer"
            >
              Start New Assessment
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Patient Information</th>
                    <th className="px-6 py-4">Anemia Risk</th>
                    <th className="px-6 py-4">Kidney Risk</th>
                    <th className="px-6 py-4">Diabetes Risk</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => {
                    const isExpanded = expandedId === item.id
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                              {item.patient_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{item.patient_name}</p>
                              <p className="text-xs text-slate-400 font-medium">
                                {item.age} yrs · {item.gender} · {item.assessment_date}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs border ${RISK_BADGES[item.anemia.category] || 'bg-slate-50 text-slate-600'}`}>
                            {item.anemia.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs border ${RISK_BADGES[item.kidney.category] || 'bg-slate-50 text-slate-600'}`}>
                            {item.kidney.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs border ${RISK_BADGES[item.diabetes.category] || 'bg-slate-50 text-slate-600'}`}>
                            {item.diabetes.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl transition duration-200 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                              title="Toggle Clinical Values"
                            >
                              Clinical Data
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={getReportUrl(item.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl transition duration-200 cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <Link
                              to={`/results/${item.id}`}
                              className="p-2 text-primary-600 hover:text-white bg-primary-50 hover:bg-primary-700 rounded-xl transition duration-200 cursor-pointer"
                              title="View Full Dashboard"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Expandable section overlay */}
            {expandedId !== null && (
              <div className="bg-slate-50/80 border-t border-slate-100 p-8">
                {(() => {
                  const expandedItem = assessments.find((a) => a.id === expandedId)
                  if (!expandedItem) return null
                  const blood = expandedItem.blood
                  return (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-primary-600 animate-pulse" />
                        Clinical Parameters for {expandedItem.patient_name}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hemoglobin</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.hemoglobin, 'g/dL')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">MCV</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.mcv, 'fL')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">MCH</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.mch, 'pg')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">MCHC</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.mchc, 'g/dL')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">RBC</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.rbc, 'million/µL')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">WBC</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.wbc, 'cells/µL')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Platelets</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.platelets, '/µL')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Blood Urea</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.blood_urea, 'mg/dL')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Serum Creatinine</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.serum_creatinine, 'mg/dL')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Glucose</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.glucose, 'mg/dL')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">BMI</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.bmi, 'kg/m²')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Blood Pressure</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.blood_pressure, 'mmHg')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Insulin</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{formatParam(blood.insulin, 'µU/mL')}</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}