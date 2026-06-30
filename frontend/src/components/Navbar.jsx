import { Link, useLocation } from 'react-router-dom'
import { Activity, Menu, X } from 'lucide-react'
import { useState } from 'react'

const links = [
  { to: '/', label: 'Home' },
  { to: '/assessment', label: 'Assessment' },
  { to: '/history', label: 'History' },
  { to: '/admin', label: 'Admin' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 text-primary-800 font-bold text-lg">
            <Activity className="w-7 h-7 text-primary-600" />
            <span>HealthRisk AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/assessment"
              className="ml-3 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Start Assessment
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 space-y-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
