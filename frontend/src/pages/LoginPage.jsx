import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Recycle, Eye, EyeOff, Loader } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password)
        toast.success(`Welcome back, ${user.name}!`)
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
      } else {
        const user = await register(form.name, form.email, form.password, form.phone)
        toast.success(`Account created! Welcome, ${user.name}!`)
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-3 shadow-lg">
            <Recycle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SmartWaste</h1>
          <p className="text-gray-500 text-sm mt-1">Waste Collection & E-Waste Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Tab toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Admin?{' '}
            <Link to="/admin" className="text-brand-600 hover:underline font-medium">
              Admin Login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
