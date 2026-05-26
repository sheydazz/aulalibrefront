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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-red-50/40 to-slate-200 p-4">
      {/* Puntos translúcidos */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle, rgb(185 28 28 / 0.14) 1.5px, transparent 1.5px), radial-gradient(circle, rgb(148 163 184 / 0.2) 1px, transparent 1px)',
          backgroundSize: '32px 32px, 20px 20px',
          backgroundPosition: '0 0, 10px 10px',
        }}
      />
      {/* Ondas decorativas */}
      <svg
        className="pointer-events-none absolute -left-1/4 top-0 h-[45%] w-[150%] text-red-200/50"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,192L48,197.3C96,203,192,213,288,218.7C384,224,480,224,576,208C672,192,768,160,864,154.7C960,149,1056,171,1152,181.3C1248,192,1344,192,1392,192L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
        />
      </svg>
      <svg
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[40%] w-[150%] text-rose-300/40"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,229.3C672,224,768,192,864,181.3C960,171,1056,181,1152,186.7C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-[18%] left-0 h-24 w-full text-slate-300/30"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z"
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-100/90 via-transparent to-white/40"
        aria-hidden
      />

      <section
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-300/40 backdrop-blur-sm"
        aria-label="Inicio de sesion"
      >
        <header className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-red-50/90 via-white to-white px-6 pb-8 pt-8 text-center">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-100/60 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-8 h-24 w-24 rounded-full bg-slate-100/80 blur-2xl"
            aria-hidden
          />
          <div className="relative mx-auto w-fit rounded-2xl bg-white px-5 py-4 shadow-md ring-1 ring-slate-200/80">
            <img
              src="/logounilibre.png"
              alt="Universidad Libre"
              className="mx-auto h-auto max-h-24 w-auto max-w-[200px] object-contain"
            />
          </div>
          
          <h1 className="relative mt-1.5 text-3xl font-bold tracking-tight text-slate-900">AulaLibre</h1>
          <p className="relative mt-1 text-sm font-medium text-slate-500">Sistema académico institucional</p>
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
