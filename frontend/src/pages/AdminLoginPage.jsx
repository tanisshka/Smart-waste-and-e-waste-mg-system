import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { ShieldCheck, Loader, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password, true)
      toast.success(`Admin access granted. Welcome, ${user.name}!`)
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-1">SmartWaste Management System</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartwaste.com"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2.5 pr-10 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Sign In as Admin
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-5">
            Default: admin@smartwaste.com / Admin@123
          </p>
        </div>
      </div>
    </div>
  )
}
