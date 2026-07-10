import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

export async function analyzeAssessment(data) {
  const res = await client.post('/api/assessment/analyze', data)
  return res.data
}

export async function analyzeBulkAssessments(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post('/api/assessment/analyze-bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}


export async function getAssessment(id) {
  const res = await client.get(`/api/assessment/${id}`)
  return res.data
}

export function getReportUrl(id) {
  return `${API_BASE}/api/assessment/${id}/report`
}

export async function getAdminStats() {
  const res = await client.get('/api/admin/stats')
  return res.data
}

export async function getAssessments(limit) {
  const res = await client.get('/api/assessment', { params: { limit } })
  return res.data
}

export default client
