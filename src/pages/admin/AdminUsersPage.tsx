import { useEffect, useMemo, useState } from 'react'
import { apiGetUsers, apiCreateUser, apiUpdateUser, apiDeleteUser, type ApiUser } from '../../services/api'

type RolTag = 'Administrador' | 'Secretaria' | 'Docente'

const ROL_STYLES: Record<RolTag, string> = {
  Administrador: 'bg-red-100 text-red-800 ring-red-200',
  Secretaria: 'bg-sky-100 text-sky-800 ring-sky-200',
  Docente: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
}

function RolBadge({ rol }: { rol: string }) {
  const style = ROL_STYLES[rol as RolTag] ?? 'bg-slate-100 text-slate-800 ring-slate-200'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${style}`}>
      {rol}
    </span>
  )
}

type DraftUser = { nombre: string; email: string; rol: RolTag | ''; activo: boolean; password: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftUser>({ nombre: '', email: '', rol: '', activo: true, password: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const load = () => {
    setLoading(true)
    apiGetUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.rol.toLowerCase().includes(q),
    )
  }, [query, users])

  const openNew = () => {
    setEditingId(null)
    setDraft({ nombre: '', email: '', rol: '', activo: true, password: '' })
    setSaveError('')
    setPanelOpen(true)
  }

  const openEdit = (u: ApiUser) => {
    setEditingId(u.id)
    setDraft({ nombre: u.nombre, email: u.email, rol: u.rol as RolTag, activo: u.activo, password: '' })
    setSaveError('')
    setPanelOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.nombre || !draft.email || !draft.rol) return
    setSaving(true)
    setSaveError('')
    try {
      if (editingId) {
        const updated = await apiUpdateUser(editingId, { nombre: draft.nombre, email: draft.email, rol: draft.rol, activo: draft.activo })
        setUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)))
      } else {
        const created = await apiCreateUser({ nombre: draft.nombre, email: draft.email, rol: draft.rol, activo: draft.activo, password: draft.password || undefined })
        setUsers((prev) => [...prev, created])
      }
      setPanelOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await apiDeleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500">Cargando usuarios...</div>
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-bold">Error al cargar usuarios</p>
        <p>{error}</p>
        <button type="button" onClick={load} className="mt-2 font-semibold underline">Reintentar</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <section className="flex-1 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestión de usuarios y roles</h2>
            <p className="text-sm text-slate-600">
              Administra los accesos, roles y el estado de los usuarios dentro de la plataforma académica.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative flex-1">
            <span className="sr-only">Buscar usuarios</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-red-100 focus:border-red-500 focus:ring-2"
              placeholder="Buscar usuarios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-800"
          >
            + Agregar usuario
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre completo</th>
                  <th className="px-4 py-3">Correo electrónico</th>
                  <th className="px-4 py-3">Rol asignado</th>
                  <th className="px-4 py-3">Último acceso</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                          {u.iniciales}
                        </span>
                        <span className="font-semibold text-slate-900">{u.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a className="font-semibold text-blue-600 hover:underline" href={`mailto:${u.email}`}>
                        {u.email}
                      </a>
                    </td>
                    <td className="px-4 py-3"><RolBadge rol={u.rol} /></td>
                    <td className="px-4 py-3 text-slate-600">{u.ultimoAcceso}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <span className={`h-2 w-2 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      <button type="button" className="p-1 hover:text-red-700" onClick={() => openEdit(u)}>✏️</button>
                      <button type="button" className="p-1 hover:text-red-700" onClick={() => handleDelete(u.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Sin resultados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            Mostrando {filtered.length} de {users.length} usuarios
          </div>
        </div>
      </section>

      {panelOpen ? (
        <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg lg:w-96">
          <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <form className="mt-4 flex flex-col gap-3" onSubmit={handleSave}>
            <label className="text-sm font-semibold text-slate-800">
              Nombre completo *
              <input
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Ej. Juan Pérez"
                value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Correo institucional *
              <input
                required
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="usuario@unilibre.edu.co"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              />
            </label>
            {!editingId ? (
              <label className="text-sm font-semibold text-slate-800">
                Contraseña inicial
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  placeholder="Mín. 6 caracteres (default: changeme123)"
                  value={draft.password}
                  onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                />
              </label>
            ) : null}
            <label className="text-sm font-semibold text-slate-800">
              Rol asignado *
              <select
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                value={draft.rol}
                onChange={(e) => setDraft((d) => ({ ...d, rol: e.target.value as RolTag }))}
              >
                <option value="">Seleccionar rol…</option>
                <option>Administrador</option>
                <option>Secretaria</option>
                <option>Docente</option>
              </select>
            </label>
            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">Estado</legend>
              <div className="mt-2 flex gap-4 text-sm">
                <label className="flex items-center gap-2 font-medium">
                  <input type="radio" name="estado" checked={draft.activo} onChange={() => setDraft((d) => ({ ...d, activo: true }))} />
                  Activo
                </label>
                <label className="flex items-center gap-2 font-medium">
                  <input type="radio" name="estado" checked={!draft.activo} onChange={() => setDraft((d) => ({ ...d, activo: false }))} />
                  Inactivo
                </label>
              </div>
            </fieldset>
            {saveError ? <p className="text-sm font-semibold text-red-600">{saveError}</p> : null}
            <div className="mt-4 flex gap-2">
              <button type="button" className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50" onClick={() => setPanelOpen(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </aside>
      ) : null}
    </div>
  )
}
