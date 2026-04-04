import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Recycle, LogOut, User, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-brand-700">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            SmartWaste
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
            {user && !isAdmin && (
              <>
                <Link to="/dashboard" className="hover:text-brand-700 transition-colors">Dashboard</Link>
                <Link to="/request" className="hover:text-brand-700 transition-colors">New Request</Link>
                <Link to="/centers" className="hover:text-brand-700 transition-colors">E-Waste Centers</Link>
              </>
            )}
            {isAdmin && (
              <>
                <Link to="/admin/dashboard" className="hover:text-brand-700 transition-colors flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/admin/requests" className="hover:text-brand-700 transition-colors">Requests</Link>
                <Link to="/admin/routes" className="hover:text-brand-700 transition-colors">Route Optimizer</Link>
              </>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-brand-700" />
                  </div>
                  <span className="hidden sm:block font-medium">{user.name}</span>
                  {isAdmin && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
