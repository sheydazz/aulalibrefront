import { Link } from 'react-router-dom'
import { getSession } from '../../auth'

const QUICK_LINKS = [
  { to: '/admin/usuarios', label: 'Usuarios y accesos', description: 'Gestión de cuentas, roles y permisos del sistema.' },
  { to: '/admin/programas', label: 'Programas y semestres', description: 'Planes de estudio, materias y periodos académicos.' },
  { to: '/admin/grupos', label: 'Grupos por asignatura', description: 'Organización de grupos y cupos por curso.' },
  { to: '/admin/docentes', label: 'Perfil docente', description: 'Disponibilidad y datos del cuerpo docente.' },
  { to: '/admin/infraestructura', label: 'Espacios físicos', description: 'Aulas, laboratorios y recursos del campus.' },
  { to: '/admin/horarios', label: 'Constructor de horarios', description: 'Armado y validación de horarios académicos.' },
] as const

export default function AdminHomePage() {
  const session = getSession()
  const displayName = session?.nombre?.trim() || session?.email?.split('@')[0] || 'Administrador'

  return (
    <div className="flex flex-1 flex-col gap-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col justify-center gap-4 p-8 sm:p-10 lg:p-12">
            <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-4xl color-red-700">
              Universidad Libre
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-slate-600">
              Bienvenido al panel <strong className="text-slate-900">AulaLibre</strong>. Desde aquí puedes
              coordinar la gestión académica, los accesos y la infraestructura de la facultad.
            </p>
            <p className="text-sm text-slate-500">
              Hola, <span className="font-semibold text-slate-800">{displayName}</span>. Elige un módulo en el
              menú superior o en los accesos rápidos.
            </p>
          </div>
          <div className="relative min-h-[220px] bg-gradient-to-br from-red-50 via-white to-slate-100 lg:min-h-0">
            <img
              src="/logounilibre.png"
              alt="Universidad Libre — Facultad de Ingeniería"
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Accesos rápidos</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow-md"
            >
              <p className="font-bold text-slate-900 group-hover:text-red-800">{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-red-700 group-hover:text-red-800">
                Abrir módulo →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
