// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { Toaster } from 'react-hot-toast'
// import { AuthProvider, useAuth } from './context/AuthContext'
// import Navbar from './components/Navbar'
// import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'

// import LoginPage from './pages/LoginPage'
// import AdminLoginPage from './pages/AdminLoginPage'
// import UserDashboard from './pages/UserDashboard'
// import NewRequestPage from './pages/NewRequestPage'
// import EWasteCentersPage from './pages/EWasteCentersPage'
// import AdminDashboard from './pages/AdminDashboard'
// import AdminRequestsPage from './pages/AdminRequestsPage'
// import AdminRoutesPage from './pages/AdminRoutesPage'

// function HomeRedirect() {
//   const { user, isAdmin } = useAuth()
//   if (!user) return <Navigate to="/login" replace />
//   return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
//         <div className="min-h-screen bg-gray-50">
//           <AppContent />
//         </div>
//       </BrowserRouter>
//     </AuthProvider>
//   )
// }

// function AppContent() {
//   const { user } = useAuth()
//   // Don't show navbar on full-screen auth pages
//   const hideNavbar = !user

//   return (
//     <>
//       {!hideNavbar && <Navbar />}
//       <Routes>
//         {/* Public */}
//         <Route path="/" element={<HomeRedirect />} />
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/admin" element={<AdminLoginPage />} />

//         {/* User routes */}
//         <Route path="/dashboard" element={
//           <ProtectedRoute><UserDashboard /></ProtectedRoute>
//         } />
//         <Route path="/request" element={
//           <ProtectedRoute><NewRequestPage /></ProtectedRoute>
//         } />
//         <Route path="/centers" element={
//           <ProtectedRoute><EWasteCentersPage /></ProtectedRoute>
//         } />

//         {/* Admin routes */}
//         <Route path="/admin/dashboard" element={
//           <AdminRoute><AdminDashboard /></AdminRoute>
//         } />
//         <Route path="/admin/requests" element={
//           <AdminRoute><AdminRequestsPage /></AdminRoute>
//         } />
//         <Route path="/admin/routes" element={
//           <AdminRoute><AdminRoutesPage /></AdminRoute>
//         } />

//         {/* Catch-all */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </>
//   )
// }

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import UserDashboard from './pages/UserDashboard'
import NewRequestPage from './pages/NewRequestPage'
import EWasteCentersPage from './pages/EWasteCentersPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminRequestsPage from './pages/AdminRequestsPage'
import AdminRoutesPage from './pages/AdminRoutesPage'

import bgImage from './assets/bg.jpg'   // ✅ IMPORT IMAGE

function HomeRedirect() {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

        {/* ✅ FULL BACKGROUND */}
        <div
          className="min-h-screen bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          {/* ✅ DARK OVERLAY */}
          <div className="min-h-screen bg-black/40">
            <AppContent />
          </div>
        </div>

      </BrowserRouter>
    </AuthProvider>
  )
}

function AppContent() {
  const { user } = useAuth()
  const hideNavbar = !user

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />

        {/* User */}
        <Route path="/dashboard" element={
          <ProtectedRoute><UserDashboard /></ProtectedRoute>
        } />
        <Route path="/request" element={
          <ProtectedRoute><NewRequestPage /></ProtectedRoute>
        } />
        <Route path="/centers" element={
          <ProtectedRoute><EWasteCentersPage /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin/dashboard" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />
        <Route path="/admin/requests" element={
          <AdminRoute><AdminRequestsPage /></AdminRoute>
        } />
        <Route path="/admin/routes" element={
          <AdminRoute><AdminRoutesPage /></AdminRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}