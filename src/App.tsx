import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { clearSession, getSession } from './auth'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RolePage from './pages/RolePage'
import StudentDashboardTailwindPage from './pages/StudentDashboardTailwindPage'

function StudentEstudianteGate() {
  const session = getSession()
  if (!session) return null
  if (session.role !== 'estudiante') {
    return <Navigate to="/dashboard" replace />
  }
  return <StudentDashboardTailwindPage />
}

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const session = getSession()

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}

function AppLayout({ children }: { children: ReactNode }) {
  const session = getSession()
  const location = useLocation()

  const hideChromeForStudentHome = location.pathname.startsWith('/estudiante')
  const showTopBar = session && location.pathname !== '/login' && !hideChromeForStudentHome

  return (
    <>
      {showTopBar ? (
        <header className="bg-zinc-900 text-slate-100">
          <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <span className="text-sm font-bold tracking-wide sm:text-base">AulaLibre</span>
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span>{session.email}</span>
              <a
                className="font-semibold text-rose-300 hover:text-rose-200"
                href="/login"
                onClick={(event) => {
                  event.preventDefault()
                  clearSession()
                  window.location.assign('/login')
                }}
              >
                Salir
              </a>
            </div>
          </div>
        </header>
      ) : null}
      {children}
    </>
  )
}

function postLoginHome() {
  const session = getSession()
  if (!session) return '/login'
  return session.role === 'estudiante' ? '/estudiante' : '/dashboard'
}

export default function App() {
  const session = getSession()

  return (
    <AppLayout>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={session ? postLoginHome() : '/login'} replace />}
        />
        <Route
          path="/login"
          element={session ? <Navigate to={postLoginHome()} replace /> : <LoginPage />}
        />
        <Route
          path="/estudiante"
          element={
            <RequireAuth>
              <StudentEstudianteGate />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/pantallas/:role"
          element={
            <RequireAuth>
              <RolePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
