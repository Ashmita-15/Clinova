import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import AssessmentForm from './pages/AssessmentForm'
import AssessmentDashboard from './pages/AssessmentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ReportHistory from './pages/ReportHistory'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/assessment" element={<AssessmentForm />} />
          <Route path="/results/:id" element={<AssessmentDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/history" element={<ReportHistory />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
