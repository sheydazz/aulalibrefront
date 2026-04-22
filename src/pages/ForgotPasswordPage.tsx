import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Dominio institucional permitido para recuperación.
const EMAIL_DOMAIN = '@unilibre.edu.co'

export default function ForgotPasswordPage() {
  // Navegación para volver a login con mensaje de confirmación.
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Flujo demo de recuperación:
    // 1) valida dominio institucional,
    // 2) redirige a login con estado de "correo enviado".
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    if (!email.endsWith(EMAIL_DOMAIN)) return
    navigate('/login', {
      replace: true,
      state: { recoverySent: true, recoveryEmail: email },
    })
  }

  return (
    // Vista simple de recuperación con CTA de retorno al login.
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Recuperar contrasena</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa tu correo institucional y te enviaremos instrucciones para restablecer la contrasena.
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
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-800"
          >
            Enviar enlace de recuperacion
          </button>
        </form>

        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-rose-700 hover:text-rose-800">
          Volver al login
        </Link>
      </section>
    </main>
  )
}
