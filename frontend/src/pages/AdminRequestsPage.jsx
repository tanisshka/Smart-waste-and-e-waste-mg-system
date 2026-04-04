import { useState, useEffect } from 'react'
import api from '../utils/api'
import { StatusBadge, WasteTypeBadge, formatDate } from '../components/StatusBadge'
import toast from 'react-hot-toast'
import { RefreshCw, Filter, CheckCircle, Loader, Image as ImageIcon, ChevronDown } from 'lucide-react'

const STATUSES = ['', 'pending', 'assigned', 'in-progress', 'completed']
const WASTE_TYPES = ['', 'normal', 'e-waste']

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [wasteFilter, setWasteFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [updating, setUpdating] = useState(null) // request ID being updated

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (statusFilter) params.status = statusFilter
      if (wasteFilter) params.waste_type = wasteFilter
      const { data } = await api.get('/admin/requests', { params })
      setRequests(data.requests)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [statusFilter, wasteFilter])

  const updateStatus = async (requestId, newStatus, driver = null) => {
    setUpdating(requestId)
    try {
      await api.put('/admin/update-status', {
        request_id: requestId,
        status: newStatus,
        assigned_driver: driver,
      })
      toast.success(`Status updated to "${newStatus}"`)
      setRequests(prev =>
        prev.map(r => r.id === requestId
          ? { ...r, status: newStatus, assigned_driver: driver || r.assigned_driver }
          : r
        )
      )
    } catch {
      toast.error('Update failed')
    } finally {
      setUpdating(null)
    }
  }

  const promptDriverAndAssign = async (requestId) => {
    const driver = window.prompt('Enter driver name:')
    if (!driver) return
    await updateStatus(requestId, 'assigned', driver)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total requests</p>
        </div>
        <button onClick={fetchRequests} disabled={loading}
          className="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filter:</span>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          {STATUSES.map(s => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
          ))}
        </select>
        <select value={wasteFilter} onChange={e => setWasteFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          {WASTE_TYPES.map(t => (
            <option key={t} value={t}>{t ? t : 'All Waste Types'}</option>
          ))}
        </select>
        {(statusFilter || wasteFilter) && (
          <button onClick={() => { setStatusFilter(''); setWasteFilter('') }}
            className="text-sm text-red-500 hover:text-red-700 px-2">✕ Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No requests match your filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['ID', 'Name / Phone', 'Type', 'Address', 'Status', 'Driver', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    {/* ID */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {req.image_url
                          ? <img src={req.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                          : <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-300" />
                            </div>}
                        <span className="font-mono text-xs text-gray-400">#{req.id?.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{req.name}</p>
                      <p className="text-xs text-gray-400">{req.phone}</p>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3"><WasteTypeBadge type={req.waste_type} /></td>
                    {/* Address */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-500 max-w-[160px] truncate">
                        {req.address || `${req.location?.coordinates?.[1]?.toFixed(4)}, ${req.location?.coordinates?.[0]?.toFixed(4)}`}
                      </p>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    {/* Driver */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{req.assigned_driver || '—'}</span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(req.created_at)}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      {updating === req.id ? (
                        <Loader className="w-4 h-4 animate-spin text-brand-500" />
                      ) : (
                        <div className="flex items-center gap-1">
                          {req.status === 'pending' && (
                            <button onClick={() => promptDriverAndAssign(req.id)}
                              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-md font-medium transition">
                              Assign
                            </button>
                          )}
                          {req.status === 'assigned' && (
                            <button onClick={() => updateStatus(req.id, 'in-progress')}
                              className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded-md font-medium transition">
                              Start
                            </button>
                          )}
                          {req.status === 'in-progress' && (
                            <button onClick={() => updateStatus(req.id, 'completed')}
                              className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded-md font-medium transition flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Complete
                            </button>
                          )}
                          {/* Status dropdown for manual override */}
                          <div className="relative group">
                            <button className="text-gray-300 hover:text-gray-500 p-1">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-6 bg-white border border-gray-100 rounded-lg shadow-lg z-10 hidden group-hover:block w-32">
                              {['pending','assigned','in-progress','completed'].map(s => (
                                <button key={s} onClick={() => updateStatus(req.id, s)}
                                  className={`block w-full text-left text-xs px-3 py-2 hover:bg-gray-50 capitalize ${req.status === s ? 'text-brand-600 font-medium' : 'text-gray-600'}`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
