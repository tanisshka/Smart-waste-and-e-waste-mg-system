import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, WasteTypeBadge, formatDate } from '../components/StatusBadge'
import { Plus, RefreshCw, PackageSearch, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserDashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/my-requests')
      setRequests(data.requests)
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const counts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => ['assigned','in-progress'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'completed').length,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRequests}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link to="/request"
            className="flex items-center gap-1.5 bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition font-medium">
            <Plus className="w-4 h-4" /> New Request
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Requests', value: counts.total, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Pending', value: counts.pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'In Progress', value: counts.inProgress, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Completed', value: counts.completed, color: 'text-green-700', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white shadow-sm`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Requests list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">My Requests</h2>
          <Link to="/centers" className="text-xs text-brand-600 hover:underline">Find E-Waste Centers →</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <PackageSearch className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium">No requests yet</p>
            <p className="text-sm mt-1">Create your first waste collection request</p>
            <Link to="/request" className="mt-4 text-brand-600 text-sm font-medium hover:underline">+ New Request</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {requests.map((req) => (
              <div key={req.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                {/* Image */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  {req.image_url
                    ? <img src={req.image_url} alt="waste" className="w-full h-full object-cover" />
                    : <ImageIcon className="w-6 h-6 text-gray-300" />}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{req.name}</span>
                    <WasteTypeBadge type={req.waste_type} />
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{req.address || `${req.location?.coordinates?.[1]?.toFixed(4)}, ${req.location?.coordinates?.[0]?.toFixed(4)}`}</p>
                  {req.assigned_driver && (
                    <p className="text-xs text-brand-600 mt-0.5">🚛 Driver: {req.assigned_driver}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(req.created_at)}</p>
                </div>
                {/* Request ID */}
                <div className="text-xs text-gray-300 font-mono flex-shrink-0">
                  #{req.id?.slice(-6).toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
