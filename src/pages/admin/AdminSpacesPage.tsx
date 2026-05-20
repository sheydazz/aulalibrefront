import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { apiGetSpaces, apiCreateSpace, type ApiSpace } from '../../services/api'

const ICON: Record<string, string> = { book: '📘', flask: '🧪', pc: '🖥️' }

const TIPO_BADGE: Record<string, string> = {
  Teórico: 'bg-blue-100 text-blue-800 ring-blue-200',
  Práctico: 'bg-amber-100 text-amber-900 ring-amber-200',
  Mixto: 'bg-violet-100 text-violet-900 ring-violet-200',
}

function barColor(pct: number) {
  if (pct >= 95) return 'bg-red-500'
  if (pct >= 60) return 'bg-emerald-500'
  if (pct <= 0) return 'bg-slate-200'
  return 'bg-orange-400'
}

type DraftSpace = {
  tipoEspacio: 'Aula' | 'Sala de informática' | 'Laboratorio'
  nombre: string; codigo: string; capacidad: string; tipoUso: string
  claseLaboratorio: string; softwareInput: string; softwareList: string[]
  equipamientoInput: string; equipamientoCantidad: string
  equipamientos: Array<{ nombre: string; cantidad: number }>
}

export default function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<ApiSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [openNuevoEspacio, setOpenNuevoEspacio] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [draft, setDraft] = useState<DraftSpace>({
    tipoEspacio: 'Aula', nombre: '', codigo: '', capacidad: '40', tipoUso: 'Teórico',
    claseLaboratorio: '', softwareInput: '', softwareList: [],
    equipamientoInput: '', equipamientoCantidad: '1', equipamientos: [],
  })

  const load = (search?: string) => {
    setLoading(true)
    apiGetSpaces(search)
      .then(setSpaces)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return spaces
    return spaces.filter((e) => e.codigo.toLowerCase().includes(t) || e.nombre.toLowerCase().includes(t))
  }, [spaces, q])

  const titleNombre = useMemo(() => {
    if (draft.tipoEspacio === 'Laboratorio') return 'Nombre del laboratorio'
    if (draft.tipoEspacio === 'Sala de informática') return 'Nombre de la sala'
    return 'Nombre del aula'
  }, [draft.tipoEspacio])

  const resetDraft = () => {
    setDraft({
      tipoEspacio: 'Aula', nombre: '', codigo: '', capacidad: '40', tipoUso: 'Teórico',
      claseLaboratorio: '', softwareInput: '', softwareList: [],
      equipamientoInput: '', equipamientoCantidad: '1', equipamientos: [],
    })
  }

  const addSoftware = () => {
    const value = draft.softwareInput.trim()
    if (!value || draft.softwareList.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setDraft((d) => ({ ...d, softwareInput: '' }))
      return
    }
    setDraft((d) => ({ ...d, softwareList: [...d.softwareList, value], softwareInput: '' }))
  }

  const addEquipamiento = () => {
    const nombre = draft.equipamientoInput.trim()
    const cantidad = Number.parseInt(draft.equipamientoCantidad, 10)
    if (!nombre || !Number.isFinite(cantidad) || cantidad < 1) return
    setDraft((d) => ({ ...d, equipamientos: [...d.equipamientos, { nombre, cantidad }], equipamientoInput: '', equipamientoCantidad: '1' }))
  }

  const submitNuevoEspacio = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      const created = await apiCreateSpace({
        codigo: draft.codigo, nombre: draft.nombre, tipoEspacio: draft.tipoEspacio,
        tipoUso: draft.tipoUso, capacidad: Number.parseInt(draft.capacidad, 10) || 40,
        claseLaboratorio: draft.claseLaboratorio || undefined,
        software: draft.softwareList, equipamiento: draft.equipamientos,
      })
      setSpaces((prev) => [...prev, created])
      setOpenNuevoEspacio(false)
      resetDraft()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Cargando espacios...</div>
  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <p className="font-bold">Error al cargar espacios</p><p>{error}</p>
      <button type="button" onClick={() => load()} className="mt-2 font-semibold underline">Reintentar</button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventario de espacios y capacidades</h2>
          <p className="text-sm text-slate-600">Gestión centralizada de salones y equipamiento para compatibilizar tipo de asignatura y cupos.</p>
        </div>
        <button type="button" onClick={() => setOpenNuevoEspacio(true)}
          className="rounded-xl outline-dashed border-red-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
          + Nuevo espacio
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <div className="rounded-2xl bg-red-700 p-4 text-white shadow-sm">
            <p className="text-xs font-bold uppercase text-red-100">Total espacios activos</p>
            <p className="mt-1 text-3xl font-black">{spaces.length}</p>
            <p className="mt-1 text-xs text-red-100">registrados en el sistema</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Ocupación promedio</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {spaces.length ? Math.round(spaces.reduce((a, s) => a + s.ocupacion, 0) / spaces.length) : 0}%
            </p>
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
            <label className="relative w-full sm:max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Buscar salón o laboratorio…" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código / Nombre</th>
                  <th className="px-4 py-3">Tipo de uso</th>
                  <th className="px-4 py-3">Capacidad máx.</th>
                  <th className="px-4 py-3">Ocupación actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((e) => (
                  <tr key={e.codigo} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ICON[e.icon] ?? '📘'}</span>
                        <div><p className="font-bold text-slate-900">{e.codigo} <span className="font-normal text-slate-500">{e.nombre}</span></p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${TIPO_BADGE[e.tipoUso] ?? ''}`}>{e.tipoUso}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{e.capacidad} est.</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 max-w-[140px] flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${barColor(e.ocupacion)}`} style={{ width: `${e.ocupacion}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{e.ocupacion}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Sin espacios registrados</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {openNuevoEspacio ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Crear nuevo espacio</h3>
            <form className="mt-4 grid gap-3" onSubmit={submitNuevoEspacio}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">
                  Tipo de espacio *
                  <select required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    value={draft.tipoEspacio}
                    onChange={(e) => setDraft((d) => ({
                      ...d,
                      tipoEspacio: e.target.value as DraftSpace['tipoEspacio'],
                      tipoUso: e.target.value === 'Laboratorio' ? 'Práctico' : e.target.value === 'Sala de informática' ? 'Mixto' : 'Teórico',
                      claseLaboratorio: e.target.value === 'Laboratorio' ? d.claseLaboratorio : '',
                      softwareList: e.target.value === 'Sala de informática' ? d.softwareList : [],
                      equipamientos: e.target.value === 'Laboratorio' ? d.equipamientos : [],
                    }))}>
                    <option>Aula</option><option>Sala de informática</option><option>Laboratorio</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  {titleNombre} *
                  <input required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    value={draft.nombre} onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                    placeholder={draft.tipoEspacio === 'Laboratorio' ? 'Ej. Laboratorio de Física' : draft.tipoEspacio === 'Sala de informática' ? 'Ej. Sala Sistemas 2' : 'Ej. Aula 204'} />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-sm font-semibold text-slate-800">
                  Código *
                  <input required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    value={draft.codigo} onChange={(e) => setDraft((d) => ({ ...d, codigo: e.target.value }))} placeholder="Ej. L-205" />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Capacidad máxima *
                  <input required type="number" min={1} max={200} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    value={draft.capacidad} onChange={(e) => setDraft((d) => ({ ...d, capacidad: e.target.value }))} />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Tipo de uso *
                  <select required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    value={draft.tipoUso} onChange={(e) => setDraft((d) => ({ ...d, tipoUso: e.target.value }))}>
                    <option>Teórico</option><option>Práctico</option><option>Mixto</option>
                  </select>
                </label>
              </div>

              {draft.tipoEspacio === 'Sala de informática' ? (
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-bold text-slate-900">Software de la sala</h4>
                  <div className="mt-3 flex gap-2">
                    <input className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
                      placeholder="Ej. MATLAB R2025a" value={draft.softwareInput}
                      onChange={(e) => setDraft((d) => ({ ...d, softwareInput: e.target.value }))} />
                    <button type="button" onClick={addSoftware}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">+ Software</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {draft.softwareList.map((sw, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {sw}
                        <button type="button" className="text-slate-500 hover:text-red-700" onClick={() => setDraft((d) => ({ ...d, softwareList: d.softwareList.filter((_, i) => i !== idx) }))}>✕</button>
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {draft.tipoEspacio === 'Laboratorio' ? (
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-bold text-slate-900">Equipamiento del laboratorio</h4>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_96px_auto]">
                    <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
                      placeholder="Ej. Osciloscopio" value={draft.equipamientoInput}
                      onChange={(e) => setDraft((d) => ({ ...d, equipamientoInput: e.target.value }))} />
                    <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
                      type="number" min={1} value={draft.equipamientoCantidad}
                      onChange={(e) => setDraft((d) => ({ ...d, equipamientoCantidad: e.target.value }))} />
                    <button type="button" onClick={addEquipamiento}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">+ Equipo</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {draft.equipamientos.map((eq, idx) => (
                      <span key={`${eq.nombre}-${idx}`} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {eq.nombre} x{eq.cantidad}
                        <button type="button" className="text-slate-500 hover:text-red-700" onClick={() => setDraft((d) => ({ ...d, equipamientos: d.equipamientos.filter((_, i) => i !== idx) }))}>×</button>
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {saveError ? <p className="text-sm font-semibold text-red-600">{saveError}</p> : null}
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => { setOpenNuevoEspacio(false); resetDraft() }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
                  {saving ? 'Guardando...' : 'Guardar espacio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
