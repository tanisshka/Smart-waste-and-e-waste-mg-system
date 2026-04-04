import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useGeolocation } from '../hooks/useGeolocation'
import MapView from '../components/MapView'
import toast from 'react-hot-toast'
import { MapPin, Navigation, Clock, Phone, ExternalLink, Loader, RefreshCw } from 'lucide-react'

export default function EWasteCentersPage() {
  const { location, loading: locLoading, detect } = useGeolocation()
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [route, setRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)

  const fetchCenters = async () => {
    if (!location) return
    setLoading(true)
    try {
      const { data } = await api.get('/nearest-centers', {
        params: { latitude: location.lat, longitude: location.lon, limit: 8 }
      })
      setCenters(data.centers)
    } catch {
      toast.error('Failed to load centers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (location) fetchCenters() }, [location])

  const getRoute = async (center) => {
    if (!location) return
    setSelected(center)
    setRouteLoading(true)
    setRoute(null)
    try {
      const { data } = await api.get('/route/directions', {
        params: {
          from_lat: location.lat, from_lon: location.lon,
          to_lat: center.latitude, to_lon: center.longitude
        }
      })
      setRoute(data)
    } catch {
      toast.error('Could not fetch route')
    } finally {
      setRouteLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">E-Waste Collection Centers</h1>
        <p className="text-gray-500 text-sm mt-1">Find the nearest e-waste drop-off center near you</p>
      </div>

      {/* Location detect */}
      {!location && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-brand-800">Detect your location</p>
            <p className="text-sm text-brand-600 mt-0.5">We need your location to find the nearest centers</p>
          </div>
          <button onClick={detect} disabled={locLoading}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition">
            {locLoading ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {locLoading ? 'Detecting...' : 'Detect Location'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Centers list */}
        <div className="lg:col-span-2 space-y-3">
          {location && (
            <button onClick={fetchCenters} disabled={loading}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader className="w-5 h-5 animate-spin mr-2" /> Finding centers...
            </div>
          )}

          {!loading && centers.map((c, i) => (
            <div key={c.id}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                selected?.id === c.id ? 'border-brand-400 shadow-md ring-1 ring-brand-400' : 'border-gray-100'
              }`}
              onClick={() => setSelected(c)}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{c.address}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-green-600 font-medium">📏 {c.distance_km} km</span>
                    {c.operating_hours && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {c.operating_hours}
                      </span>
                    )}
                  </div>
                  {c.accepted_items?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.accepted_items.slice(0, 3).map(item => (
                        <span key={item} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item}</span>
                      ))}
                      {c.accepted_items.length > 3 && (
                        <span className="text-xs text-gray-400">+{c.accepted_items.length - 3} more</span>
                      )}
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); getRoute(c) }}
                    className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 font-medium hover:text-brand-700">
                    <Navigation className="w-3 h-3" /> Get Directions
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && location && centers.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p>No centers found within 50km</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 space-y-3">
          <MapView
            userLocation={location}
            centers={centers}
            route={route}
            height="480px"
            onCenterClick={getRoute}
          />

          {/* Route info */}
          {routeLoading && (
            <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-2 text-blue-700 text-sm">
              <Loader className="w-4 h-4 animate-spin" /> Fetching route...
            </div>
          )}
          {route && !routeLoading && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-medium text-gray-900 text-sm mb-2">
                Route to {selected?.name}
              </p>
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold text-brand-700">{route.distance_km} km</p>
                  <p className="text-xs text-gray-400">Distance</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-700">~{route.duration_minutes} min</p>
                  <p className="text-xs text-gray-400">Estimated time</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">via {route.source === 'osrm' ? 'OSRM' : 'OpenRouteService'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
