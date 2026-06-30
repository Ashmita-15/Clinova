const COLORS = {
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  High: 'bg-red-100 text-red-800 border-red-200',
}

const BAR_COLORS = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
}

export function RiskBadge({ category }) {
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${COLORS[category] || COLORS.Low}`}>
      {category} Risk
    </span>
  )
}

export function RiskBar({ percentage, category }) {
  const color = BAR_COLORS[category] || BAR_COLORS.Low
  return (
    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
      />
    </div>
  )
}

export function ExplanationCard({ title, risk, factors }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <RiskBadge category={risk.category} />
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">Risk Probability</span>
          <span className="font-bold text-slate-800">{risk.percentage}%</span>
        </div>
        <RiskBar percentage={risk.percentage} category={risk.category} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">Contributing Factors</p>
        <ul className="space-y-1">
          {factors.map((f, i) => (
            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">•</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
