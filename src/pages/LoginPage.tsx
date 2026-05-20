import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { saveSession, saveToken, type UserRole } from '../auth'
import { apiLogin } from '../services/api'

const EMAIL_DOMAIN = '@unilibre.edu.co'

function getHomeByRole(role: UserRole) {
  if (role === 'admin') return '/admin'
  if (role === 'docente') return '/docente'
  return '/estudiante'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const cleanedEmail = email.trim().toLowerCase()
  const hasValidEmail = useMemo(() => cleanedEmail.endsWith(EMAIL_DOMAIN), [cleanedEmail])

  const recoverySent = (location.state as { recoverySent?: boolean; recoveryEmail?: string } | null)?.recoverySent
  const recoveryEmail = (location.state as { recoverySent?: boolean; recoveryEmail?: string } | null)?.recoveryEmail

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!cleanedEmail || !password) {
      setError('Debes completar correo y contraseña.')
      return
    }
    if (!hasValidEmail) {
      setError(`Usa tu correo institucional (${EMAIL_DOMAIN}).`)
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      const { token, user } = await apiLogin(cleanedEmail, password)
      saveToken(token)
      saveSession({ id: user.id, email: user.email, role: user.role, nombre: user.nombre, iniciales: user.iniciales, remember })
      navigate(getHomeByRole(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        aria-label="Inicio de sesion"
      >
        <header className="border-b border-slate-100 px-6 py-7 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-rose-100 font-bold text-rose-800">
            AL
          </div>
          <h1 className="text-3xl font-bold text-slate-900">AulaLibre</h1>
          <p className="mt-1 text-sm font-semibold text-rose-700">Sistema Academico</p>
        </header>

        <form className="flex flex-col gap-2 p-6" onSubmit={handleSubmit}>
          <label className="text-sm font-semibold text-slate-900" htmlFor="email">
            Correo Institucional
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            id="email"
            type="email"
            placeholder="usuario@unilibre.edu.co"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={loading}
          />

          <label className="mt-2 text-sm font-semibold text-slate-900" htmlFor="password">
            Contraseña
          </label>
          <div className="relative">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-3 pr-20 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="******"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-rose-700 hover:text-rose-800"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                className="h-4 w-4 rounded border-slate-300 text-rose-700 focus:ring-rose-300"
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                disabled={loading}
              />
              Mantener sesion iniciada
            </label>
            <Link to="/recuperar-contrasena" className="text-sm font-semibold text-rose-700 hover:text-rose-800">
              Olvidaste tu contraseña?
            </Link>
          </div>

          {recoverySent ? (
            <p className="mt-1 text-sm font-semibold text-emerald-700">
              Te enviamos instrucciones de recuperacion a {recoveryEmail}.
            </p>
          ) : null}
          {error ? <p className="mt-1 text-sm font-semibold text-rose-600">{error}</p> : null}

          <button
            className="mt-3 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesion'}
          </button>

          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <strong>Demo:</strong> ana.lopez@unilibre.edu.co / admin123 &nbsp;·&nbsp;
            alberto.martinez@unilibre.edu.co / docente123
          </p>
        </form>
      </section>
    </main>
  )
}
