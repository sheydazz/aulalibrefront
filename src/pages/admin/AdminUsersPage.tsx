import { useMemo, useState } from 'react'
import { MOCK_ADMIN_USERS, type AdminUserRow, type RolTag } from '../../data/adminMockData'

const ROL_STYLES: Record<RolTag, string> = {
  Administrador: 'bg-red-100 text-red-800 ring-red-200',
  Secretaria: 'bg-sky-100 text-sky-800 ring-sky-200',
  Docente: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
}

function RolBadge({ rol }: { rol: RolTag }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${ROL_STYLES[rol]}`}>
      {rol}
    </span>
  )
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [draft, setDraft] = useState({ nombre: '', email: '', rol: '' as RolTag | '', activo: true })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MOCK_ADMIN_USERS
    return MOCK_ADMIN_USERS.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.rol.toLowerCase().includes(q),
    )
  }, [query])

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
            onClick={() => {
              setDraft({ nombre: '', email: '', rol: '', activo: true })
              setPanelOpen(true)
            }}
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
                  <UserRow key={u.id} user={u} onEdit={() => setPanelOpen(true)} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Mostrando 1 a {filtered.length} de {MOCK_ADMIN_USERS.length} resultados
            </span>
            <div className="flex gap-2">
              <button type="button" className="rounded-lg border border-slate-200 px-3 py-1 font-semibold hover:bg-slate-50">
                Anterior
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-700 px-3 py-1 font-bold text-white"
              >
                1
              </button>
              <span className="px-1">…</span>
              <button type="button" className="rounded-lg border border-slate-200 px-3 py-1 font-semibold hover:bg-slate-50">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </section>

      {panelOpen ? (
        <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg lg:w-96">
          <h3 className="text-lg font-bold text-slate-900">{draft.nombre ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              setPanelOpen(false)
            }}
          >
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
              <legend className="text-sm font-semibold text-slate-800">Estado inicial</legend>
              <div className="mt-2 flex gap-4 text-sm">
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="estado"
                    checked={draft.activo}
                    onChange={() => setDraft((d) => ({ ...d, activo: true }))}
                  />
                  Activo
                </label>
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="estado"
                    checked={!draft.activo}
                    onChange={() => setDraft((d) => ({ ...d, activo: false }))}
                  />
                  Inactivo
                </label>
              </div>
            </fieldset>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50"
                onClick={() => setPanelOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800">
                Guardar
              </button>
            </div>
          </form>
        </aside>
      ) : null}
    </div>
  )
}

function UserRow({ user, onEdit }: { user: AdminUserRow; onEdit: () => void }) {
  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
            {user.iniciales}
          </span>
          <span className="font-semibold text-slate-900">{user.nombre}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <a className="font-semibold text-blue-600 hover:underline" href={`mailto:${user.email}`}>
          {user.email}
        </a>
      </td>
      <td className="px-4 py-3">
        <RolBadge rol={user.rol} />
      </td>
      <td className="px-4 py-3 text-slate-600">{user.ultimoAcceso}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className={`h-2 w-2 rounded-full ${user.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {user.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-slate-500">
        <button type="button" className="p-1 hover:text-red-700" aria-label="Editar" onClick={onEdit}>
          ✏️
        </button>
        <button type="button" className="p-1 hover:text-red-700" aria-label="Eliminar">
          🗑️
        </button>
      </td>
    </tr>
  )
}
