import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-slate-300 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            <span className="font-semibold text-white">HealthRisk AI</span>
          </div>
          <p className="text-sm text-center md:text-right max-w-xl">
            Decision-support tool for coal mine communities. Not a substitute for professional medical diagnosis.
          </p>
        </div>
        <div className="mt-6 pt-6 border-t border-primary-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Health Risk Assessment System. BCCL Community Health Initiative.
        </div>
      </div>
    </footer>
  )
}
