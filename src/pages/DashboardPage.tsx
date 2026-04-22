import { Link, Navigate } from 'react-router-dom'
import { getSession } from '../auth'

export default function DashboardPage() {
  const session = getSession()

  if (!session) return null
  if (session.role === 'estudiante') {
    return <Navigate to="/estudiante" replace />
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Bienvenida, {session.email}</h1>
      <p className="mt-2 text-slate-600">
        Tu rol detectado es <strong>{session.role}</strong>. Este dashboard ya
        te permite entrar a tus demas pantallas.
      </p>

      <nav className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link
          to={session.role === 'admin' ? '/admin' : '/pantallas/admin'}
          className="rounded-xl border border-slate-200 bg-white px-4 py-5 font-bold text-slate-900 transition hover:border-emerald-400"
        >
          {session.role === 'admin' ? 'Panel de administración' : 'Pantalla Admin'}
        </Link>
        <Link
          to="/pantallas/docente"
          className="rounded-xl border border-slate-200 bg-white px-4 py-5 font-bold text-slate-900 transition hover:border-emerald-400"
        >
          Pantalla Docente
        </Link>
        <Link
          to="/pantallas/estudiante"
          className="rounded-xl border border-slate-200 bg-white px-4 py-5 font-bold text-slate-900 transition hover:border-emerald-400"
        >
          Pantalla Estudiante
        </Link>
      </nav>
    </main>
  )
}
