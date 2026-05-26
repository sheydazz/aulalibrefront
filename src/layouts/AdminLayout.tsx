import { Link, NavLink, Outlet } from 'react-router-dom'
import UniversidadLogo from '../components/UniversidadLogo'
import { getSession } from '../auth'
import { useLogout } from '../hooks/useLogout'

const NAV: { to: string; label: string; end?: boolean }[] = [
  { to: '/admin', label: 'Inicio', end: true },
  { to: '/admin/usuarios', label: 'Usuarios y accesos' },
  { to: '/admin/programas', label: 'Programas y semestres' },
  { to: '/admin/grupos', label: 'Grupos por asignatura' },
  { to: '/admin/docentes', label: 'Perfil docente' },
  { to: '/admin/infraestructura', label: 'Espacios físicos' },
  { to: '/admin/horarios', label: 'Constructor de horarios' },
]

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
  const logout = useLogout()
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/admin" className="flex items-center gap-3 transition hover:opacity-90">
            <UniversidadLogo size="md" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-700">
                Universidad Libre
              </p>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Panel de administración</h1>
              <p className="text-sm text-slate-500">Gestión académica, accesos e infraestructura</p>
            </div>
          </Link>

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
              onClick={logout}
            >
              Salir
            </button>
          </div>
        </div>

        <nav className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => navClass(isActive)}
              >
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
          <span>© 2026 Universidad Libre</span>
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
