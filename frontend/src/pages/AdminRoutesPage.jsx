import { useState } from 'react'
import api from '../utils/api'
import MapView from '../components/MapView'
import { WasteTypeBadge, StatusBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'
import { Zap, Loader, Truck, MapPin, Clock, Route, Users } from 'lucide-react'

const CLUSTER_COLORS = [
  '#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6',
  '#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'
]

export default function AdminRoutesPage() {
  const [optimizing, setOptimizing] = useState(false)
  const [routes, setRoutes] = useState([])
  const [summary, setSummary] = useState(null)
  const [selectedCluster, setSelectedCluster] = useState(null)
  const [nClusters, setNClusters] = useState('')
  const [assigning, setAssigning] = useState(null)

  const optimize = async () => {
    setOptimizing(true)
    setRoutes([])
    setSummary(null)
    try {
      const { data } = await api.post('/admin/optimize-route', {
        n_clusters: nClusters ? parseInt(nClusters) : null
      })
      setRoutes(data.routes)
      setSummary({
        total: data.total_requests,
        clusters: data.total_clusters,
        message: data.message
      })
      if (data.routes.length > 0) setSelectedCluster(data.routes[0])
      toast.success(data.message)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Optimization failed')
    } finally {
      setOptimizing(false)
    }
  }

  const assignDriver = async (clusterId) => {
    const driver = window.prompt('Enter driver name to assign this route:')
    if (!driver) return
    setAssigning(clusterId)
    try {
      const { data } = await api.post('/admin/assign-route', null, {
        params: { cluster_id: clusterId, driver_name: driver }
      })
      toast.success(`Route assigned to ${driver}`)
      setRoutes(prev => prev.map(r =>
        r.cluster_id === clusterId
          ? { ...r, assigned_driver: driver }
          : r
      ))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Assignment failed')
    } finally {
      setAssigning(null)
    }
  }

  // Build map markers from selected cluster's ordered requests
  const clusterMarkers = selectedCluster?.ordered_requests?.map((req, i) => ({
    id: req._id || req.id,
    name: `Stop ${i + 1}: ${req.name}`,
    address: req.address || '',
    latitude: req.location?.coordinates?.[1],
    longitude: req.location?.coordinates?.[0],
    distance_km: null,
  })) || []

  // All markers from all clusters for overview
  const allMarkers = routes.flatMap((route, ri) =>
    (route.ordered_requests || []).map((req, i) => ({
      id: req._id || req.id,
      name: `Cluster ${ri + 1} Stop ${i + 1}: ${req.name}`,
      address: req.address || '',
      latitude: req.location?.coordinates?.[1],
      longitude: req.location?.coordinates?.[0],
      distance_km: null,
    }))
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Optimizer</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            K-Means clustering + Nearest Neighbor TSP for optimal pickup routes
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Clusters
            <span className="text-gray-400 font-normal ml-1">(leave blank for auto)</span>
          </label>
          <input
            type="number" min={1} max={20} value={nClusters}
            onChange={e => setNClusters(e.target.value)}
            placeholder="Auto"
            className="w-28 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          onClick={optimize} disabled={optimizing}
          className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-brand-700 disabled:opacity-60 transition">
          {optimizing ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {optimizing ? 'Optimizing...' : 'Optimize Routes'}
        </button>

        {summary && (
          <div className="ml-auto text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            ✅ {summary.total} requests → {summary.clusters} route{summary.clusters !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {routes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Routes list */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm mb-2">Optimized Routes</h2>
            {routes.map((route, ri) => {
              const color = CLUSTER_COLORS[ri % CLUSTER_COLORS.length]
              const isSelected = selectedCluster?.cluster_id === route.cluster_id
              return (
                <div
                  key={route.cluster_id}
                  onClick={() => setSelectedCluster(route)}
                  className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'shadow-md' : 'border-gray-100'
                  }`}
                  style={{ borderColor: isSelected ? color : undefined }}
                >
                  {/* Cluster header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: color }} />
                      <span className="font-semibold text-gray-900 text-sm">
                        Route {ri + 1}
                      </span>
                      {route.assigned_driver && (
                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                          🚛 {route.assigned_driver}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {route.stop_count} stop{route.stop_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-4 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Route className="w-3.5 h-3.5" />
                      <span className="font-medium text-gray-800">{route.total_distance_km} km</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-medium text-gray-800">~{route.estimated_time_minutes} min</span>
                    </div>
                  </div>

                  {/* Stop list (compact) */}
                  <div className="space-y-1">
                    {route.ordered_requests.map((req, i) => (
                      <div key={req._id || req.id} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="truncate">{req.name}</span>
                        <WasteTypeBadge type={req.waste_type} />
                      </div>
                    ))}
                  </div>

                  {/* Assign button */}
                  <button
                    onClick={e => { e.stopPropagation(); assignDriver(route.cluster_id) }}
                    disabled={assigning === route.cluster_id}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs border border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 py-1.5 rounded-lg transition font-medium"
                  >
                    {assigning === route.cluster_id
                      ? <Loader className="w-3.5 h-3.5 animate-spin" />
                      : <Truck className="w-3.5 h-3.5" />}
                    {route.assigned_driver ? 'Reassign Driver' : 'Assign Driver'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="font-semibold text-gray-800 text-sm">
                {selectedCluster
                  ? `Route ${routes.findIndex(r => r.cluster_id === selectedCluster.cluster_id) + 1} Map`
                  : 'Overview Map'}
              </h2>
              {selectedCluster && (
                <button onClick={() => setSelectedCluster(null)}
                  className="text-xs text-gray-400 hover:text-gray-600">
                  (show all)
                </button>
              )}
            </div>
            <MapView
              centers={selectedCluster ? clusterMarkers : allMarkers}
              height="500px"
            />
            {selectedCluster && (
              <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-800 mb-2">Pickup Sequence</p>
                <div className="flex flex-wrap gap-1">
                  {selectedCluster.ordered_requests.map((req, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                      <span className="w-4 h-4 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="text-gray-700">{req.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!optimizing && routes.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Route className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-medium text-gray-500">No routes generated yet</p>
          <p className="text-sm mt-1">Click "Optimize Routes" to cluster pending requests and generate optimal pickup routes</p>
        </div>
      )}
    </div>
  )
}
