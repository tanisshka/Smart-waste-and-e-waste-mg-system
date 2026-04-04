import { useEffect, useRef } from 'react'

// Dynamic Leaflet import to avoid SSR issues
let L = null

export default function MapView({
  center = [19.076, 72.877], // Default: Mumbai
  zoom = 13,
  userLocation = null,
  centers = [],
  route = null,
  height = '400px',
  onCenterClick = null,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef([])

  useEffect(() => {
    // Dynamically load Leaflet
    import('leaflet').then((leaflet) => {
      L = leaflet.default

      if (mapInstanceRef.current) return // Already initialized

      const mapEl = mapRef.current
      if (!mapEl) return

      // Initialize map
      const map = L.map(mapEl, { zoomControl: true, scrollWheelZoom: true })
      mapInstanceRef.current = map

      // Tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      map.setView(
        userLocation ? [userLocation.lat, userLocation.lon] : center,
        zoom
      )

      drawLayers(map)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Redraw layers when props change
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return
    drawLayers(mapInstanceRef.current)
  }, [userLocation, centers, route])

  function drawLayers(map) {
    // Clear previous layers
    layersRef.current.forEach((l) => map.removeLayer(l))
    layersRef.current = []

    // User location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      const marker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .bindPopup('<b>📍 Your Location</b>')
        .addTo(map)
      layersRef.current.push(marker)
      map.setView([userLocation.lat, userLocation.lon], zoom)
    }

    // E-waste center markers
    centers.forEach((c, i) => {
      const centerIcon = L.divIcon({
        className: '',
        html: `<div style="background:#7c3aed;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-weight:bold">${i + 1}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })
      const popup = `
        <div style="min-width:160px">
          <b>${c.name}</b><br/>
          <small>${c.address}</small><br/>
          ${c.distance_km != null ? `<span style="color:#16a34a;font-weight:600">📏 ${c.distance_km} km away</span>` : ''}
          ${c.phone ? `<br/><small>📞 ${c.phone}</small>` : ''}
        </div>`
      const marker = L.marker([c.latitude, c.longitude], { icon: centerIcon })
        .bindPopup(popup)
        .addTo(map)
      if (onCenterClick) marker.on('click', () => onCenterClick(c))
      layersRef.current.push(marker)
    })

    // Route polyline
    if (route?.geometry?.coordinates) {
      const coords = route.geometry.coordinates.map(([lon, lat]) => [lat, lon])
      const polyline = L.polyline(coords, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.8,
        dashArray: null,
      }).addTo(map)
      layersRef.current.push(polyline)
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] })
    }
  }

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}
      className="border border-gray-200 shadow-sm"
    />
  )
}
