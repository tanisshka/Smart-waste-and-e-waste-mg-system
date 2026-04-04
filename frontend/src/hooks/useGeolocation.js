// import { useState, useCallback } from 'react'

// export function useGeolocation() {
//   const [location, setLocation] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)

//   const detect = useCallback(() => {
//     if (!navigator.geolocation) {
//       setError('Geolocation is not supported by your browser')
//       return
//     }
//     setLoading(true)
//     setError(null)
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
//         setLoading(false)
//       },
//       (err) => {
//         setError('Could not detect location. Please allow location access.')
//         setLoading(false)
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     )
//   }, [])

//   return { location, loading, error, detect }
// }

import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("✅ Location detected:", pos.coords)

        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        })

        setLoading(false)
      },
      (err) => {
        console.error("❌ Location error:", err)

        setError(err.message)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0   // 🔥 IMPORTANT FIX
      }
    )
  }, [])

  return { location, loading, error, detect, setLocation }
}