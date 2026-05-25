import { useNavigate } from 'react-router-dom'
import { clearSession } from '../auth'

/** Cierra sesión sin recargar la página (evita 404 en SPA en producción). */
export function useLogout() {
  const navigate = useNavigate()

  return () => {
    clearSession()
    navigate('/login', { replace: true })
  }
}
