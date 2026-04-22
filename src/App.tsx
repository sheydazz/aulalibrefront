import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { clearSession, getSession } from './auth'
import AdminLayout from './layouts/AdminLayout'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LoginPage from './pages/LoginPage'
import AdminGroupsPage from './pages/admin/AdminGroupsPage'
import AdminProgramsPage from './pages/admin/AdminProgramsPage'
import AdminScheduleBuilderPage from './pages/admin/AdminScheduleBuilderPage'
import AdminSpacesPage from './pages/admin/AdminSpacesPage'
import AdminTeacherPage from './pages/admin/AdminTeacherPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import RolePage from './pages/RolePage'
import TeacherDashboardPage from './pages/TeacherDashboardPage'
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

function RequireAdmin({ children }: { children: ReactNode }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function DocenteGate() {
  const session = getSession()
  if (!session) return null
  if (session.role !== 'docente') return <Navigate to="/dashboard" replace />
  return <TeacherDashboardPage />
}

function AppLayout({ children }: { children: ReactNode }) {
  const session = getSession()
  const location = useLocation()

  const hideChromeForAdmin = location.pathname.startsWith('/admin')
  const showTopBar = session && location.pathname !== '/login' && !hideChromeForAdmin

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
  if (session.role === 'admin') return '/admin'
  if (session.role === 'docente') return '/docente'
  return '/estudiante'
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
          path="/recuperar-contrasena"
          element={session ? <Navigate to={postLoginHome()} replace /> : <ForgotPasswordPage />}
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
          path="/docente"
          element={
            <RequireAuth>
              <DocenteGate />
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
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="usuarios" replace />} />
          <Route path="usuarios" element={<AdminUsersPage />} />
          <Route path="programas" element={<AdminProgramsPage />} />
          <Route path="grupos" element={<AdminGroupsPage />} />
          <Route path="docentes" element={<AdminTeacherPage />} />
          <Route path="disponibilidad" element={<Navigate to="/admin/docentes" replace />} />
          <Route path="infraestructura" element={<AdminSpacesPage />} />
          <Route path="horarios" element={<AdminScheduleBuilderPage />} />
        </Route>
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
