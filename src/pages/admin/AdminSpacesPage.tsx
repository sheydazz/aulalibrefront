import { useMemo, useState, type FormEvent } from 'react'
import { MOCK_ESPACIOS, type EspacioRow } from '../../data/adminMockData'

const ICON: Record<EspacioRow['icon'], string> = {
  book: '📘',
  flask: '🧪',
  pc: '🖥️',
}

const TIPO_BADGE: Record<EspacioRow['tipoUso'], string> = {
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

export default function AdminSpacesPage() {
  // Inventario de espacios físicos con capacidad y tipo de uso.
  const [q, setQ] = useState('')
  const [openNuevoEspacio, setOpenNuevoEspacio] = useState(false)
  const [draft, setDraft] = useState({
    tipoEspacio: 'Aula' as 'Aula' | 'Sala de informática' | 'Laboratorio',
    nombre: '',
    codigo: '',
    capacidad: '40',
    tipoUso: 'Teórico' as EspacioRow['tipoUso'],
    claseLaboratorio: '',
    softwareInput: '',
    softwareList: [] as string[],
    equipamientoInput: '',
    equipamientoCantidad: '1',
    equipamientos: [] as Array<{ nombre: string; cantidad: number }>,
  })

  const rows = useMemo(() => {
    // Filtra espacios por código o nombre.
    const t = q.trim().toLowerCase()
    if (!t) return MOCK_ESPACIOS
    return MOCK_ESPACIOS.filter((e) => e.codigo.toLowerCase().includes(t) || e.nombre.toLowerCase().includes(t))
  }, [q])

  const titleNombre = useMemo(() => {
    // Ajusta etiqueta del formulario según el tipo de espacio.
    if (draft.tipoEspacio === 'Laboratorio') return 'Nombre del laboratorio'
    if (draft.tipoEspacio === 'Sala de informática') return 'Nombre de la sala'
    return 'Nombre del aula'
  }, [draft.tipoEspacio])

  const resetDraft = () => {
    // Limpia el formulario de creación de espacio.
    setDraft({
      tipoEspacio: 'Aula',
      nombre: '',
      codigo: '',
      capacidad: '40',
      tipoUso: 'Teórico',
      claseLaboratorio: '',
      softwareInput: '',
      softwareList: [],
      equipamientoInput: '',
      equipamientoCantidad: '1',
      equipamientos: [],
    })
  }

  const addSoftware = () => {
    // Agrega software evitando entradas vacías o duplicadas.
    const value = draft.softwareInput.trim()
    if (!value) return
    if (draft.softwareList.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setDraft((d) => ({ ...d, softwareInput: '' }))
      return
    }
    setDraft((d) => ({ ...d, softwareList: [...d.softwareList, value], softwareInput: '' }))
  }

  const removeSoftware = (idx: number) => {
    setDraft((d) => ({ ...d, softwareList: d.softwareList.filter((_, i) => i !== idx) }))
  }

  const addEquipamiento = () => {
    const nombre = draft.equipamientoInput.trim()
    const cantidad = Number.parseInt(draft.equipamientoCantidad, 10)
    if (!nombre || !Number.isFinite(cantidad) || cantidad < 1) return
    setDraft((d) => ({
      ...d,
      equipamientos: [...d.equipamientos, { nombre, cantidad }],
      equipamientoInput: '',
      equipamientoCantidad: '1',
    }))
  }

  const removeEquipamiento = (idx: number) => {
    setDraft((d) => ({ ...d, equipamientos: d.equipamientos.filter((_, i) => i !== idx) }))
  }

  const submitNuevoEspacio = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setOpenNuevoEspacio(false)
    resetDraft()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventario de espacios y capacidades</h2>
          <p className="text-sm text-slate-600">
            Gestión centralizada de salones y equipamiento para compatibilizar tipo de asignatura y cupos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpenNuevoEspacio(true)}
            className="rounded-xl  outline-dashed border-red-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            + Nuevo espacio
          </button>
            
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Filtros de espacios</p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100">
            <option>Tipo de uso</option>
            <option>Teórico</option>
            <option>Práctico</option>
          </select>
          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100">
            <option>Equipamiento</option>
            <option>Proyector</option>
            <option>aire acondicionado</option>
          </select>
          <button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
            Aplicar filtros
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <div className="rounded-2xl bg-red-700 p-4 text-white shadow-sm">
            <p className="text-xs font-bold uppercase text-red-100">Total espacios activos</p>
            <p className="mt-1 text-3xl font-black">124</p>
            <p className="mt-1 text-xs text-red-100">100% operativos actualmente</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Ocupación promedio</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">78%</p>
            <p className="text-xs font-semibold text-amber-700">Alta</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[78%] rounded-full bg-amber-400" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Distribución por tipo</p>
            <ul className="mt-3 space-y-3 text-xs">
              <li>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Salones teóricos</span>
                  <span>65% (80)</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[65%] rounded-full bg-blue-500" />
                </div>
              </li>
              <li>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Laboratorios</span>
                  <span>20% (25)</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[40%] rounded-full bg-amber-500" />
                </div>
              </li>
              <li>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Salas de cómputo</span>
                  <span>15% (19)</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[30%] rounded-full bg-emerald-500" />
                </div>
              </li>
            </ul>
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
            <label className="relative w-full sm:max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Buscar salón o laboratorio…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código / Nombre</th>
                  <th className="px-4 py-3">Tipo de uso</th>
                  <th className="px-4 py-3">Capacidad máx.</th>
                  <th className="px-4 py-3">Equipamiento</th>
                  <th className="px-4 py-3">Ocupación actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((e) => (
                  <tr key={e.codigo} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ICON[e.icon]}</span>
                        <div>
                          <p className="font-bold text-slate-900">
                            {e.codigo} <span className="font-normal text-slate-500">{e.nombre}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${TIPO_BADGE[e.tipoUso]}`}>
                        {e.tipoUso}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{e.capacidad} est.</td>
                    <td className="px-4 py-3 text-lg text-slate-500">📽️ 💻 ❄️ 🔊</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 max-w-[140px] overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${barColor(e.ocupacion)}`} style={{ width: `${e.ocupacion}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{e.ocupacion}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3 text-xs">
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-1 font-semibold">
              Anterior
            </button>
            <button type="button" className="rounded-lg bg-red-700 px-3 py-1 font-bold text-white">
              1
            </button>
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-1 font-semibold">
              Siguiente
            </button>
          </div>
        </section>
      </div>

      {openNuevoEspacio ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Crear nuevo espacio</h3>
            <p className="mt-1 text-sm text-slate-600">
              Registra aulas, salas de informática o laboratorios con capacidad, software y equipamiento según el tipo.
            </p>

            <form className="mt-4 grid gap-3" onSubmit={submitNuevoEspacio}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">
                  Tipo de espacio *
                  <select
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    value={draft.tipoEspacio}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        tipoEspacio: e.target.value as 'Aula' | 'Sala de informática' | 'Laboratorio',
                        tipoUso: e.target.value === 'Laboratorio' ? 'Práctico' : e.target.value === 'Sala de informática' ? 'Mixto' : 'Teórico',
                        claseLaboratorio: e.target.value === 'Laboratorio' ? d.claseLaboratorio : '',
                        softwareList: e.target.value === 'Sala de informática' ? d.softwareList : [],
                        equipamientos: e.target.value === 'Laboratorio' ? d.equipamientos : [],
                      }))
                    }
                  >
                    <option>Aula</option>
                    <option>Sala de informática</option>
                    <option>Laboratorio</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  {titleNombre} *
                  <input
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    placeholder={
                      draft.tipoEspacio === 'Laboratorio'
                        ? 'Ej. Laboratorio de Física'
                        : draft.tipoEspacio === 'Sala de informática'
                          ? 'Ej. Sala Sistemas 2'
                          : 'Ej. Aula 204'
                    }
                    value={draft.nombre}
                    onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <label className="text-sm font-semibold text-slate-800">
                  Código *
                  <input
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    placeholder="Ej. L-205"
                    value={draft.codigo}
                    onChange={(e) => setDraft((d) => ({ ...d, codigo: e.target.value }))}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Capacidad máxima *
                  <input
                    required
                    type="number"
                    min={1}
                    max={200}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    value={draft.capacidad}
                    onChange={(e) => setDraft((d) => ({ ...d, capacidad: e.target.value }))}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Tipo de uso *
                  <select
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    value={draft.tipoUso}
                    onChange={(e) => setDraft((d) => ({ ...d, tipoUso: e.target.value as EspacioRow['tipoUso'] }))}
                  >
                    <option>Teórico</option>
                    <option>Práctico</option>
                    <option>Mixto</option>
                  </select>
                </label>
              </div>

              {draft.tipoEspacio === 'Sala de informática' ? (
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-bold text-slate-900">Software de la sala</h4>
                  <p className="mt-1 text-xs text-slate-600">
                    Agrega los programas disponibles en esta sala (IDE, CAD, simuladores, etc.).
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      placeholder="Ej. MATLAB R2025a"
                      value={draft.softwareInput}
                      onChange={(e) => setDraft((d) => ({ ...d, softwareInput: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={addSoftware}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      + Agregar software
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {draft.softwareList.length ? (
                      draft.softwareList.map((software, idx) => (
                        <span key={`${software}-${idx}`} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {software}
                          <button type="button" className="text-slate-500 hover:text-red-700" onClick={() => removeSoftware(idx)}>
                            ✕
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Sin software agregado todavía.</span>
                    )}
                  </div>
                </section>
              ) : null}

              {draft.tipoEspacio === 'Laboratorio' ? (
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-bold text-slate-900">Detalle de laboratorio</h4>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <label className="text-sm font-semibold text-slate-800 sm:col-span-3">
                      Clase de laboratorio *
                      <select
                        required
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        value={draft.claseLaboratorio}
                        onChange={(e) => setDraft((d) => ({ ...d, claseLaboratorio: e.target.value }))}
                      >
                        <option value="">Seleccionar clase...</option>
                        <option>Física</option>
                        <option>Química</option>
                        <option>Electrónica</option>
                        <option>Redes</option>
                        <option>Mecánica</option>
                      </select>
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      placeholder="Ej. Medidor de voltaje"
                      value={draft.equipamientoInput}
                      onChange={(e) => setDraft((d) => ({ ...d, equipamientoInput: e.target.value }))}
                    />
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 sm:w-24"
                      value={draft.equipamientoCantidad}
                      onChange={(e) => setDraft((d) => ({ ...d, equipamientoCantidad: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={addEquipamiento}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      + Agregar
                    </button>
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Equipamiento físico</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {draft.equipamientos.length ? (
                        draft.equipamientos.map((item, idx) => (
                          <li key={`${item.nombre}-${idx}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                            <span className="font-medium text-slate-800">
                              {item.nombre} <span className="text-slate-500">x{item.cantidad}</span>
                            </span>
                            <button
                              type="button"
                              className="text-xs font-bold text-slate-500 hover:text-red-700"
                              onClick={() => removeEquipamiento(idx)}
                            >
                              Eliminar
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-slate-500">
                          Sin equipamiento registrado todavía. Ejemplo: medidores, osciloscopios, balanzas, etc.
                        </li>
                      )}
                    </ul>
                  </div>
                </section>
              ) : null}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  onClick={() => {
                    setOpenNuevoEspacio(false)
                    resetDraft()
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800">
                  Guardar espacio
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
