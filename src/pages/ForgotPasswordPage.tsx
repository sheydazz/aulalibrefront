import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiForgotPassword } from '../services/api'

const EMAIL_DOMAIN = '@unilibre.edu.co'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim().toLowerCase()

    if (!email.endsWith(EMAIL_DOMAIN)) {
      setError(`Solo se permiten correos institucionales (${EMAIL_DOMAIN}).`)
      return
    }

    setLoading(true)
    try {
      await apiForgotPassword(email)
      navigate('/', { replace: true, state: { recoverySent: true, recoveryEmail: email } })
    } catch {
      navigate('/', { replace: true, state: { recoverySent: true, recoveryEmail: email } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa tu correo institucional y te enviaremos instrucciones para restablecer la contraseña.
        </p>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-800">
            Correo institucional
            <input
              required
              name="email"
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              placeholder="usuario@unilibre.edu.co"
              disabled={loading}
            />
          </label>

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar enlace de recuperacion'}
          </button>
        </form>

        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-rose-700 hover:text-rose-800">
          Volver al login
        </Link>
      </section>
    </main>
  )
}
