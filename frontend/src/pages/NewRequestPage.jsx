import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useGeolocation } from '../hooks/useGeolocation'
import toast from 'react-hot-toast'
import { MapPin, Upload, Loader, Camera, CheckCircle, X } from 'lucide-react'
import exifr from 'exifr'

export default function NewRequestPage() {
  const navigate = useNavigate()
  const { location, loading: locLoading, error: locError, detect, setLocation } = useGeolocation()
  const fileRef = useRef()

  const [form, setForm] = useState({
    name: '', phone: '', waste_type: 'normal', address: '', notes: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    
    try {
      const gps = await exifr.gps(file)
      if (gps && gps.latitude && gps.longitude) {
        setLocation({ lat: gps.latitude, lon: gps.longitude })
        toast.success('Location automatically detected from photo', { icon: '📍' })
      }
    } catch (err) {
      console.warn("Could not read EXIF data", err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!location) {
      toast.error('Please detect your location first')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('phone', form.phone)
      fd.append('waste_type', form.waste_type)
      fd.append('latitude', location.lat)
      fd.append('longitude', location.lon)
      if (form.address) fd.append('address', form.address)
      if (form.notes) fd.append('notes', form.notes)
      if (imageFile) fd.append('image', imageFile)

      await api.post('/request', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Request submitted! You\'ll receive an SMS confirmation.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Waste Collection Request</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details and we'll schedule a pickup</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Contact Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>

        {/* Waste Type */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Waste Type *</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'normal', label: '🗑 Normal Waste', desc: 'Household / organic waste' },
              { value: 'e-waste', label: '⚡ E-Waste', desc: 'Electronics, batteries' }
            ].map(opt => (
              <label key={opt.value}
                className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.waste_type === opt.value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                <input type="radio" name="waste_type" value={opt.value}
                  checked={form.waste_type === opt.value}
                  onChange={e => set('waste_type', e.target.value)}
                  className="sr-only" />
                <span className="font-medium text-sm text-gray-900">{opt.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Photo (Optional)</h2>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          {preview ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => { setPreview(null); setImageFile(null) }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors">
              <Camera className="w-8 h-8" />
              <span className="text-sm">Click to upload photo</span>
              <span className="text-xs">JPEG, PNG, WebP up to 10MB</span>
            </button>
          )}
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Location *</h2>
          <button type="button" onClick={detect} disabled={locLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              location
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            } disabled:opacity-60`}>
            {locLoading ? <Loader className="w-4 h-4 animate-spin" /> :
             location ? <CheckCircle className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            {locLoading ? 'Detecting...' : location ? 'Location Detected' : 'Detect My Location'}
          </button>
          {location && (
            <p className="text-xs text-gray-400 font-mono">
              📍 {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
            </p>
          )}
          {locError && <p className="text-xs text-red-500">{locError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
            <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="e.g. 123 Main St, Andheri West"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={3} placeholder="Any special instructions for the collection team..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </div>

        <button type="submit" disabled={submitting || !location}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          {submitting ? <><Loader className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Request'}
        </button>
        {!location && <p className="text-center text-xs text-gray-400">⚠ Location required to submit</p>}
      </form>
    </div>
  )
}
