import { useEffect, useState } from 'react'
import { Loader2, Users, BarChart3 } from 'lucide-react'
import { getAdminStats } from '../api/client'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6']

function distToChart(dist) {
  return Object.entries(dist).map(([name, value]) => ({ name, value }))
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-600">
        Unable to load admin statistics. Ensure the backend is running.
      </div>
    )
  }

  const combinedRisk = distToChart(stats.risk_distribution)
  const anemiaData = distToChart(stats.anemia_distribution)
  const kidneyData = distToChart(stats.kidney_distribution)
  const diabetesData = distToChart(stats.diabetes_distribution)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Assessment analytics and risk distribution overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Assessments</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total_assessments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sm:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <p className="font-semibold text-slate-800">Most Common Risk Levels</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {combinedRisk.sort((a, b) => b.value - a.value).map((r) => (
              <span key={r.name} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
                {r.name}: <strong>{r.value}</strong>
              </span>
            ))}
            {combinedRisk.length === 0 && (
              <span className="text-slate-500 text-sm">No assessments yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <ChartCard title="Overall Risk Distribution" data={combinedRisk} />
        <ChartCard title="Anemia Risk Distribution" data={anemiaData} />
        <ChartCard title="Kidney Risk Distribution" data={kidneyData} />
        <ChartCard title="Diabetes Risk Distribution" data={diabetesData} />
      </div>

      {/* Age-Risk Distribution stacked chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Age-Risk Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={stats.age_risk_distribution}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="age_group" tick={{ fontSize: 13 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value, name) => [value, `${name} Risk`]} />
            <Legend />
            <Bar dataKey="Low" stackId="risk" fill="#10b981" />
            <Bar dataKey="Medium" stackId="risk" fill="#f59e0b" />
            <Bar dataKey="High" stackId="risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart comparison */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Risk Category Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { condition: 'Anemia', ...stats.anemia_distribution },
              { condition: 'Kidney', ...stats.kidney_distribution },
              { condition: 'Diabetes', ...stats.diabetes_distribution },
            ].map((row) => ({
              condition: row.condition,
              Low: row.Low || 0,
              Medium: row.Medium || 0,
              High: row.High || 0,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="condition" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Low" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Medium" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="High" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent assessments table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Recent Assessments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-6 py-3 font-medium">ID</th>
                <th className="text-left px-6 py-3 font-medium">Patient</th>
                <th className="text-left px-6 py-3 font-medium">Age</th>
                <th className="text-left px-6 py-3 font-medium">Anemia</th>
                <th className="text-left px-6 py-3 font-medium">Kidney</th>
                <th className="text-left px-6 py-3 font-medium">Diabetes</th>
                <th className="text-left px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_assessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No assessments recorded yet
                  </td>
                </tr>
              ) : (
                stats.recent_assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-500">#{a.id}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{a.patient_name}</td>
                    <td className="px-6 py-3">{a.age}</td>
                    <td className="px-6 py-3"><RiskPill level={a.anemia_risk} /></td>
                    <td className="px-6 py-3"><RiskPill level={a.kidney_risk} /></td>
                    <td className="px-6 py-3"><RiskPill level={a.diabetes_risk} /></td>
                    <td className="px-6 py-3 text-slate-500">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, data }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>
      {data.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function RiskPill({ level }) {
  const styles = {
    Low: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    High: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[level] || 'bg-slate-100 text-slate-600'}`}>
      {level || '—'}
    </span>
  )
}
