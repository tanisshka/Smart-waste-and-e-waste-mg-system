import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { Users, Package, CheckCircle, Clock, Zap, Truck, MapPin, BarChart2 } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
      Loading dashboard...
    </div>
  )

  const cards = [
    { label: 'Total Requests', value: stats?.total_requests, icon: Package, color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: 'Pending', value: stats?.pending, icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    { label: 'In Progress', value: stats?.in_progress + stats?.assigned, icon: Truck, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Completed', value: stats?.completed, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'E-Waste', value: stats?.ewaste_requests, icon: Zap, color: 'text-purple-700', bg: 'bg-purple-50' },
    { label: 'Normal Waste', value: stats?.normal_requests, icon: Package, color: 'text-orange-700', bg: 'bg-orange-50' },
    { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    { label: 'E-Waste Centers', value: stats?.total_centers, icon: MapPin, color: 'text-teal-700', bg: 'bg-teal-50' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Overview of waste collection operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-5 border border-white shadow-sm`}>
            <c.icon className={`w-5 h-5 ${c.color} mb-2`} />
            <div className={`text-3xl font-bold ${c.color}`}>{c.value ?? '—'}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/admin/requests', icon: Package, label: 'Manage Requests', desc: 'View, filter and update all collection requests', color: 'bg-brand-600' },
          { to: '/admin/routes', icon: BarChart2, label: 'Optimize Routes', desc: 'Cluster requests and generate optimal pickup routes', color: 'bg-blue-600' },
          { to: '/admin/requests', icon: Truck, label: 'Assign Drivers', desc: 'Assign optimized routes to drivers', color: 'bg-purple-600' },
        ].map(a => (
          <Link key={a.to} to={a.to}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              <a.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">{a.label}</h3>
            <p className="text-sm text-gray-400 mt-1">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
