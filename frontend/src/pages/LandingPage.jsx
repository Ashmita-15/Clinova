import { Link } from 'react-router-dom'
import {
  Activity,
  Brain,
  FileText,
  Shield,
  Stethoscope,
  TestTube,
  ArrowRight,
  Mail,
  MapPin,
} from 'lucide-react'
import doctorsImage from '../assets/pp.jpg' // Import the doctors image

const features = [
  {
    icon: Brain,
    title: 'ML Risk Assessment',
    desc: 'Analyzes blood parameters using trained models for anemia, kidney disease, and diabetes risk.',
  },
  {
    icon: Shield,
    title: 'Explainable AI',
    desc: 'Understand contributing factors behind each risk score with transparent clinical insights.',
  },
  {
    icon: TestTube,
    title: 'Test Recommendations',
    desc: 'Get prioritized follow-up diagnostic tests based on identified health risks.',
  },
  {
    icon: FileText,
    title: 'PDF Reports',
    desc: 'Download comprehensive health assessment reports for medical consultations.',
  },
]

const stack = [
  'React.js', 'Tailwind CSS', 'Recharts', 'FastAPI', 'Python',
  'Scikit-learn', 'XGBoost', 'SQLite', 'Joblib',
]

export default function LandingPage() {
  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* Hero */}
      <section className="relative bg-white overflow-hidden">
        {/* Layered wave shapes */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 1440 640"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <path
            d="M0,280 C420,120 780,380 1440,220 L1440,0 L0,0 Z"
            className="fill-primary-50"
          />
          <path
            d="M540,0 C880,60 1080,180 1440,100 L1440,640 L0,640 L0,500 C180,580 360,420 540,400 Z"
            className="fill-primary-100/80"
          />
          <path
            d="M820,640 C980,500 1180,540 1440,420 L1440,640 Z"
            className="fill-primary-500/10"
          />
          <path
            d="M960,0 C1120,140 1280,100 1440,240 L1440,0 Z"
            className="fill-primary-500/15"
          />
          <ellipse
            cx="1180"
            cy="320"
            rx="280"
            ry="260"
            className="fill-primary-200/40"
          />
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center min-h-[520px] py-16 lg:py-20">
            {/* Copy */}
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/80 border border-primary-100 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-700 mb-6 shadow-sm">
                <Activity className="w-4 h-4 text-primary-600" />
                Coal Mine Community Health Initiative
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] text-slate-800 mb-6">
                AI-Powered Health Triage for Mining Communities
              </h1>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
                A clinical decision-support tool that analyzes blood test parameters using machine learning, assessments explanations, and generates structured PDF reports to support preventive community healthcare.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/assessment"
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-7 py-3.5 rounded-full font-semibold hover:bg-primary-700 transition-all duration-200 shadow-md shadow-primary-600/25 text-sm cursor-pointer"
                >
                  Start Health Assessment
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#about"
                  className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-primary-200 hover:bg-primary-50/50 text-slate-700 px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Circular Doctor Image */}
            <div className="relative z-10 flex items-center justify-center lg:justify-end h-[240px] sm:h-[300px] lg:h-[440px] -mx-4 sm:mx-0">
              {/* Circular Frame Background with Gradient */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <div
className="
relative
w-[450px]
h-[450px]
lg:w-[600px]
lg:h-[600px]
translate-x-24
"
>
                  {/* Outer Blue Border Ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 shadow-2xl" />
                  {/* Inner White Ring */}
                  <div className="absolute inset-[8px] rounded-full bg-white" />
                  {/* Image Container */}
                  <div className="absolute inset-[18px] rounded-full overflow-hidden bg-red-500">
                    <img
  src={doctorsImage}
  alt="Professional healthcare doctors and medical experts team"
  className="w-full h-full object-cover object-[60%_center] scale-125"
/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Soft fade into the section below */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white pointer-events-none"
          aria-hidden="true"
        />
      </section>

      {/* About */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-12 h-12 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mb-6">
                <Stethoscope className="w-6 h-6 text-primary-700" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">About the Initiative</h2>
              <p className="text-slate-500 leading-relaxed font-medium mb-4">
                Communities living near coal mining operations face long-term environmental factors that can influence hematological and metabolic health. Regular diagnostics are vital, but expert triage can be scarce.
              </p>
              <p className="text-slate-500 leading-relaxed font-medium">
                This platform is built as a <strong>decision-support tool</strong>. It evaluates clinical biomarkers via trained random forests and gradient boosted ensembles, generating risk triage metrics to assist healthcare workers and residents.
              </p>
            </div>
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/60 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Target Community Audience</h3>
              <ul className="space-y-4">
                {[
                  'Coal mine workers and nearby community residents',
                  'Community-based health screening initiatives',
                  'Paramedics and clinic staff requiring diagnostic triage',
                  'Preventive health monitoring programs',
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-sm text-slate-600 font-medium">
                    <span className="text-primary-600 font-bold text-base leading-none">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50/50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Platform Features</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              An end-to-end clinical workflow designed for reliability, clarity, and explainability.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-primary-700" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Technology Stack</h2>
          <p className="text-slate-500 mb-10 max-w-2xl mx-auto font-medium">
            Powered by robust frameworks and libraries for clinical intelligence and UI fidelity.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {stack.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-slate-50 text-slate-700 rounded-2xl text-xs font-semibold border border-slate-200/60 shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-4">Clinical Partnership & Support</h2>
              <p className="text-slate-300 mb-8 font-medium leading-relaxed">
                For community outreach clinics, partnerships, or technical integration questions, please contact our community desk.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                  <Mail className="w-5 h-5 text-primary-400" />
                  <span>healthscreening@bccl-community.org</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                  <MapPin className="w-5 h-5 text-primary-400" />
                  <span>Coal Mine Community Health Center, BCCL Region</span>
                </div>
              </div>
            </div>
            <div className="flex md:justify-end">
              <Link
                to="/assessment"
                className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 shadow-lg shadow-primary-900/40 cursor-pointer"
              >
                Begin Your Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
