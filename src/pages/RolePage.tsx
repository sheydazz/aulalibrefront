import { Link, Navigate, useParams } from 'react-router-dom'
import { clearSession, getSession } from '../auth'
import type { UserRole } from '../auth'

const titleMap: Record<UserRole, string> = {
  admin: 'Panel administrativo',
  docente: 'Panel docente',
  estudiante: 'Panel estudiante',
}

export default function RolePage() {
  const { role } = useParams<{ role: UserRole }>()
  const session = getSession()

  if (!session) return <Navigate to="/login" replace />
  if (!role || !titleMap[role]) return <Navigate to="/dashboard" replace />

  const canAccess =
    session.role === role ||
    session.role === 'admin' ||
    (session.role === 'docente' && role === 'estudiante')

  if (!canAccess) return <Navigate to="/dashboard" replace />

  if (role === 'estudiante') {
    return <Navigate to="/estudiante" replace />
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  if (role === 'docente') {
    return <Navigate to="/docente" replace />
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{titleMap[role]}</h1>
      <p className="mt-2 text-slate-600">Esta vista ya esta lista para que agregues el contenido real.</p>
      <p className="mt-1 text-sm text-slate-500">Sesion activa: {session.email}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-300"
          to="/dashboard"
        >
          Volver al dashboard
        </Link>
        <Link
          className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-300"
          to="/login"
          onClick={() => clearSession()}
        >
          Cerrar sesion
        </Link>
      </div>
    </main>
  )
}
