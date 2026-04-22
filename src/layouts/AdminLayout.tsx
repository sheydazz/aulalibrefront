import { NavLink, Outlet } from 'react-router-dom'
import { clearSession, getSession } from '../auth'

const NAV = [
  { to: '/admin/usuarios', label: 'Usuarios y accesos' },
  { to: '/admin/programas', label: 'Programas y semestres' },
  { to: '/admin/grupos', label: 'Grupos por asignatura' },
  { to: '/admin/docentes', label: 'Perfil docente' },
  { to: '/admin/infraestructura', label: 'Espacios físicos' },
  { to: '/admin/horarios', label: 'Constructor de horarios' },
] as const

function navClass(isActive: boolean) {
  return [
    'rounded-full px-3 py-1.5 text-sm font-semibold transition',
    isActive
      ? 'bg-red-700 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')
}

export default function AdminLayout() {
  const session = getSession()
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-700 text-sm font-bold text-white">
              FI
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Facultad de Ingeniería — Universidad Libre
              </p>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Panel de administración</h1>
              <p className="text-sm text-slate-500">Gestión académica, accesos e infraestructura</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <p className="font-semibold text-slate-900">Admin Usuario</p>
              <p className="text-xs text-slate-500">{session?.email}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              AU
            </div>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                clearSession()
                window.location.assign('/login')
              }}
            >
              Salir
            </button>
          </div>
        </div>

        <nav className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 sm:flex-row sm:items-center sm:px-6">
          <span>© 2026 Universidad Libre — Facultad de Ingeniería</span>
          <div className="flex flex-wrap gap-4">
            <a className="font-semibold text-slate-600 hover:text-red-700" href="#">
              Políticas de privacidad
            </a>
            <a className="font-semibold text-slate-600 hover:text-red-700" href="#">
              Soporte técnico
            </a>
            <a className="font-semibold text-slate-600 hover:text-red-700" href="#">
              Ayuda
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
