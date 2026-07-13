import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Loader2,
  User,
  Droplets,
  History,
  ArrowRight,
  Activity,
  ClipboardList,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  ExternalLink
} from 'lucide-react'
import {
  analyzeAssessment,
  getAssessments,
  analyzeBulkAssessments,
  getReportUrl
} from '../api/client'

const initialPatient = { name: '', age: '', gender: 'Male' }

const initialBlood = {
  hemoglobin: '',
  rbc: '',
  hematocrit: '',
  mcv: '',
  mch: '',
  mchc: '',
  rdw: '',
  wbc: '',
  platelets: '',
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

const RISK_BADGES_TABLE = {
  High: 'bg-rose-50 text-rose-700 border-rose-100 font-bold',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100 font-bold',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold',
}

export default function AssessmentForm() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('single')
  
  // Single Assessment State
  const [patient, setPatient] = useState(initialPatient)
  const [blood, setBlood] = useState(initialBlood)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Bulk Assessment State
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [bulkResults, setBulkResults] = useState(null)
  const [bulkSearch, setBulkSearch] = useState('')

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

          rbc: parseFloat(blood.rbc),
          
          hematocrit: parseFloat(blood.hematocrit),
          
          mcv: parseFloat(blood.mcv),
          
          mch: parseFloat(blood.mch),
          
          mchc: parseFloat(blood.mchc),
          
          rdw: parseFloat(blood.rdw),
          
          wbc: blood.wbc ? parseFloat(blood.wbc) : null,
          
          platelets: blood.platelets ? parseFloat(blood.platelets) : null,
          
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

  // Bulk Actions
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const ext = droppedFile.name.split('.').pop().toLowerCase()
      if (['csv', 'xlsx', 'xls'].includes(ext)) {
        setFile(droppedFile)
        setBulkError('')
      } else {
        setBulkError('Invalid file type. Please upload a CSV or Excel file.')
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const ext = selectedFile.name.split('.').pop().toLowerCase()
      if (['csv', 'xlsx', 'xls'].includes(ext)) {
        setFile(selectedFile)
        setBulkError('')
      } else {
        setBulkError('Invalid file type. Please upload a CSV or Excel file.')
      }
    }
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setBulkError('')
    setBulkUploading(true)
    try {
      const results = await analyzeBulkAssessments(file)
      setBulkResults(results)
      // Refresh recent records sidebar
      getAssessments(5).then(setRecent)
    } catch (err) {
      setBulkError(err.response?.data?.detail || 'Bulk processing failed. Please verify that compulsory columns are present and data ranges are correct.')
    } finally {
      setBulkUploading(false)
    }
  }

  const downloadTemplateCSV = () => {
    const headers = ["patient_name","age","gender","hemoglobin","rbc","hematocrit","mcv", "mch","mchc","rdw","wbc", "platelets", "blood_urea","serum_creatinine","glucose","bmi", "blood_pressure","insulin"]
    const rows = [
      [
      "John Doe",
      "45",
      "Male",
      "14.2",
      "4.8",
      "42",
      "89",
      "30",
      "33",
      "13.5",
      "7500",
      "250000",
      "24",
      "0.9",
      "98",
      "23.5",
      "120",
      "80"
      ],
      
      [
      "Jane Smith",
      "29",
      "Female",
      "11.5",
      "3.8",
      "36",
      "78",
      "24",
      "31",
      "15.2",
      "6200",
      "280000",
      "18",
      "0.7",
      "85",
      "21.2",
      "115",
      ""
      ],
      
      [
      "Alex Brown",
      "62",
      "Other",
      "13.8",
      "4.6",
      "41",
      "92",
      "31",
      "34",
      "12.8",
      "",
      "",
      "45",
      "1.4",
      "140",
      "28.1",
      "135",
      "120"
      ]
    ]
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "clinova_bulk_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadResultsCSV = () => {
    if (!bulkResults) return
    const headers = [
      "Patient Name", "Age", "Gender", "Assessment Date",
      "Hemoglobin", "MCV", "MCH", "MCHC",
      "Anemia Risk Level", "Anemia Prob",
      "Kidney Risk Level", "Kidney Prob",
      "Diabetes Risk Level", "Diabetes Prob"
    ]
    const csvRows = bulkResults.map(r => [
      `"${r.patient_name}"`,
      r.age,
      r.gender,
      `"${r.assessment_date}"`,
      r.blood.hemoglobin,
      r.blood.mcv,
      r.blood.mch,
      r.blood.mchc,
      r.anemia.category,
      r.anemia.probability.toFixed(3),
      r.kidney.category,
      r.kidney.probability.toFixed(3),
      r.diabetes.category,
      r.diabetes.probability.toFixed(3)
    ])
    
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `clinova_bulk_results_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate bulk summary details
  const getBulkSummary = () => {
    if (!bulkResults) return null
    let total = bulkResults.length
    let high = 0
    let medium = 0
    let low = 0

    bulkResults.forEach(r => {
      if (r.anemia.category === 'High' || r.kidney.category === 'High' || r.diabetes.category === 'High') {
        high++
      } else if (r.anemia.category === 'Medium' || r.kidney.category === 'Medium' || r.diabetes.category === 'Medium') {
        medium++
      } else {
        low++
      }
    })

    return { total, high, medium, low }
  }

  const summary = getBulkSummary()

  // Filter bulk results
  const filteredBulk = bulkResults
    ? bulkResults.filter(r => r.patient_name.toLowerCase().includes(bulkSearch.toLowerCase()))
    : []

  return (
    <div className="bg-slate-50/50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-50 border border-primary-100 text-primary-800 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-primary-600 animate-pulse" />
            Decision Support System
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Health Assessment Portal
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Evaluate community health risks via single patient forms or bulk spreadsheet uploads.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-12 bg-slate-200/60 p-1.5 rounded-2xl max-w-md mx-auto border border-slate-200/40 shadow-sm">
          <button
            onClick={() => { setActiveTab('single'); setError(''); }}
            className={`flex-grow py-3 px-6 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'single'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            Single Assessment
          </button>
          <button
            onClick={() => { setActiveTab('bulk'); setBulkError(''); }}
            className={`flex-grow py-3 px-6 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            Bulk Entry Assessment
          </button>
        </div>

        {activeTab === 'single' ? (
          <div>
            {error && (
              <div className="max-w-6xl mx-auto mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm">
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
                      <Field label="RBC (million/µL)" name="rbc" value={blood.rbc} onChange={handleBlood} placeholder="4.8"/>
                      <Field label="MCV (fL)" name="mcv" value={blood.mcv} onChange={handleBlood} placeholder="90" />
                      <Field label="MCH (pg)" name="mch" value={blood.mch} onChange={handleBlood} placeholder="29" />
                      <Field label="MCHC (g/dL)" name="mchc" value={blood.mchc} onChange={handleBlood} placeholder="33" />
                      <Field label="RDW (%)" name="rdw" value={blood.rdw} onChange={handleBlood} placeholder="13.5"/>
                      <Field label="PCV(%)" name="hematocrit" value={blood.hematocrit} onChange={handleBlood} placeholder="42"/>
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

              {/* Sidebar - Recent Assessments */}
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
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Bulk Upload Tab Content */}
            {!bulkResults ? (
              <div className="grid lg:grid-cols-3 gap-8 items-start">
                
                {/* Drag-and-drop Card */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-primary-700" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">Upload Dataset</h2>
                        <p className="text-xs text-slate-400">Process health risks for multiple individuals using CSV or Excel workbooks</p>
                      </div>
                    </div>

                    {bulkError && (
                      <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>{bulkError}</span>
                      </div>
                    )}

                    <form onSubmit={handleBulkSubmit}>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center ${
                          dragActive 
                            ? 'border-primary-600 bg-primary-50/20' 
                            : file 
                              ? 'border-emerald-300 bg-emerald-50/5' 
                              : 'border-slate-300 hover:border-primary-500 bg-slate-50/20 hover:bg-slate-50/50'
                        }`}
                        onClick={() => document.getElementById('file-upload-input').click()}
                      >
                        <input
                          id="file-upload-input"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        
                        {file ? (
                          <>
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-4">
                              <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 truncate max-w-xs">{file.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                              }}
                              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Remove File
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-14 h-14 bg-primary-50 text-primary-700 border border-primary-100 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                              <Upload className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">Drag & Drop your spreadsheet here</h3>
                            <p className="text-xs text-slate-500 mt-1.5">or click to browse your local computer</p>
                            <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Supports CSV, XLSX, XLS</p>
                          </>
                        )}
                      </div>

                      <div className="mt-8 flex justify-end">
                        <button
                          type="submit"
                          disabled={!file || bulkUploading}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-800 text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-primary-900 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-lg shadow-primary-900/10 cursor-pointer text-sm"
                        >
                          {bulkUploading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing Bulk Evaluation...
                            </>
                          ) : (
                            <>
                              Process Bulk Assessment
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Instructions / Template Download */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-slate-500" />
                      Spreadsheet Instructions
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      To run diagnostic evaluations, formatting headers matches are done automatically. Ensure your sheet includes these columns:
                    </p>
                    <div className="space-y-3 mb-6">
                      <div>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                          Required Columns
                        </span>
                        <p className="text-[11px] font-mono text-slate-600 mt-1">
                          patient_name, age, gender, hemoglobin, rbc, hematocrit, mcv, mch, mchc, rdw
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          Optional Columns
                        </span>
                        <p className="text-[11px] font-mono text-slate-500 mt-1">
                          wbc, platelets, blood_urea, serum_creatinine, glucose, bmi, blood_pressure, insulin
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={downloadTemplateCSV}
                      className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download Template CSV
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Bulk Results Table & Summary View */
              <div className="space-y-8">
                
                {/* Summary Row */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Patients</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">{summary.total}</p>
                  </div>
                  <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-5 shadow-sm">
                    <p className="text-xs text-rose-600 uppercase font-bold tracking-wider">High Risk Identified</p>
                    <p className="text-2xl font-extrabold text-rose-800 mt-1">{summary.high}</p>
                  </div>
                  <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 shadow-sm">
                    <p className="text-xs text-amber-600 uppercase font-bold tracking-wider">Medium Risk Identified</p>
                    <p className="text-2xl font-extrabold text-amber-800 mt-1">{summary.medium}</p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-5 shadow-sm">
                    <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Low Risk Patients</p>
                    <p className="text-2xl font-extrabold text-emerald-800 mt-1">{summary.low}</p>
                  </div>
                </div>

                {/* Table & Filtering */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                  
                  {/* Actions Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Evaluated Patient Records</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Evaluation findings generated successfully</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search patient name..."
                          value={bulkSearch}
                          onChange={(e) => setBulkSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all duration-200 text-xs shadow-sm"
                        />
                      </div>
                      
                      <button
                        onClick={downloadResultsCSV}
                        className="inline-flex items-center gap-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm shadow-emerald-700/5"
                        style={{ backgroundColor: '#10b981' }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export Results CSV
                      </button>

                      <button
                        onClick={() => { setBulkResults(null); setFile(null); }}
                        className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                      >
                        Upload Another Sheet
                      </button>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-slate-500">
                          <th className="px-6 py-4">Patient Name</th>
                          <th className="px-6 py-4">Demographics</th>
                          <th className="px-6 py-4">Anemia Risk</th>
                          <th className="px-6 py-4">Kidney Risk</th>
                          <th className="px-6 py-4">Diabetes Risk</th>
                          <th className="px-6 py-4 text-right">Report Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBulk.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                              No matching patients found.
                            </td>
                          </tr>
                        ) : (
                          filteredBulk.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                              <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                                {item.patient_name}
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-medium">
                                {item.age} yrs · {item.gender}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] border ${RISK_BADGES_TABLE[item.anemia.category]}`}>
                                  {item.anemia.category} ({item.anemia.percentage}%)
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] border ${RISK_BADGES_TABLE[item.kidney.category]}`}>
                                  {item.kidney.category} ({item.kidney.percentage}%)
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] border ${RISK_BADGES_TABLE[item.diabetes.category]}`}>
                                  {item.diabetes.category} ({item.diabetes.percentage}%)
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <a
                                    href={getReportUrl(item.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-lg transition duration-200 cursor-pointer"
                                    title="Download PDF"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                  <Link
                                    to={`/results/${item.id}`}
                                    target="_blank"
                                    className="p-1.5 text-primary-650 hover:text-white bg-primary-50 hover:bg-primary-755 rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer"
                                    title="View Dashboard"
                                    style={{ color: '#4f46e5' }}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
