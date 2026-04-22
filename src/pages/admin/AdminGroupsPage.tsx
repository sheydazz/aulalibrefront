import { useMemo, useState, type FormEvent } from 'react'
import { AddProgramModal, AddSubjectModal } from '../../components/admin/ProgramSubjectModals'
import { MOCK_GRUPOS_POO, MOCK_PROGRAMAS } from '../../data/adminMockData'

export default function AdminGroupsPage() {
  // Gestión de grupos por asignatura (cupos, docente y estado).
  const [busqueda, setBusqueda] = useState('')
  const [openProgramaModal, setOpenProgramaModal] = useState(false)
  const [openAsignaturaModal, setOpenAsignaturaModal] = useState(false)
  const [openGrupoModal, setOpenGrupoModal] = useState(false)

  const rows = useMemo(() => {
    // Búsqueda flexible sobre listado de grupos.
    const q = busqueda.trim().toLowerCase()
    if (!q) return MOCK_GRUPOS_POO
    return MOCK_GRUPOS_POO.filter(
      (g) =>
        g.nombre.toLowerCase().includes(q) ||
        g.codigo.includes(q) ||
        (g.docente && g.docente.toLowerCase().includes(q)),
    )
  }, [busqueda])

  const totalCupo = MOCK_GRUPOS_POO.reduce((a, g) => a + g.cupoMax, 0)

  const submitGrupo = (e: FormEvent<HTMLFormElement>) => {
    // En demo solo cierra modal; luego se conecta a API.
    e.preventDefault()
    setOpenGrupoModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con acciones principales del módulo. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de grupos por asignatura</h2>
          <p className="text-sm text-slate-600">
            Crea y administra secciones: cupos, docente asignado y estado de programación para el semestre en curso.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={() => setOpenGrupoModal(true)}
            className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            + Crear nuevo grupo
          </button>
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Selección de asignatura</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              onClick={() => setOpenProgramaModal(true)}
            >
              + Añadir programa
            </button>
            <button
              type="button"
              className="rounded-xl bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800"
              onClick={() => setOpenAsignaturaModal(true)}
            >
              + Añadir asignatura
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-800">
            Programa académico / Asignatura
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100">
              <option>Ingeniería de Sistemas — Programación Orientada a Objetos (IS301)</option>
              <option>Ingeniería de Sistemas — Estructuras de Datos (IS302)</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Jornada
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100">
              <option>Diurna</option>
              <option>Nocturna</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-800">
          <p className="font-bold text-slate-900">Programación Orientada a Objetos</p>
          <p className="mt-1 text-slate-600">
            Código <span className="font-mono font-bold">IS301</span> · 4 créditos · Intensidad 4 h/semana
          </p>
          <div className="mt-3 flex flex-wrap gap-6 text-xs font-bold uppercase tracking-wide text-slate-700">
            <span>Total grupos: {MOCK_GRUPOS_POO.length}</span>
            <span>Cupo total plan: {totalCupo}</span>
          </div>
        </div>
      </section>

      <AddProgramModal open={openProgramaModal} onClose={() => setOpenProgramaModal(false)} />
      <AddSubjectModal
        open={openAsignaturaModal}
        onClose={() => setOpenAsignaturaModal(false)}
        programOptions={MOCK_PROGRAMAS.map((p) => p.nombre)}
      />
      {openGrupoModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Crear nuevo grupo</h3>
            <p className="mt-1 text-sm text-slate-600">
              Define la sección de una asignatura con cupos, docente y estado de programación para el periodo actual.
            </p>
            <form className="mt-4 grid gap-3" onSubmit={submitGrupo}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">
                  Programa / Asignatura *
                  <select
                    required
                    name="programaAsignatura"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    defaultValue="Ingeniería de Sistemas — Programación Orientada a Objetos (IS301)"
                  >
                    <option>Ingeniería de Sistemas — Programación Orientada a Objetos (IS301)</option>
                    <option>Ingeniería de Sistemas — Estructuras de Datos (IS302)</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Código de grupo *
                  <input
                    required
                    name="codigoGrupo"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    placeholder="Ej. 05"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <label className="text-sm font-semibold text-slate-800">
                  Cupo máx. *
                  <input
                    required
                    name="cupoMaximo"
                    type="number"
                    min={1}
                    max={120}
                    defaultValue={40}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Cupo planeado *
                  <input
                    required
                    name="cupoPlaneado"
                    type="number"
                    min={1}
                    max={120}
                    defaultValue={40}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Semestre
                  <input
                    name="semestre"
                    type="number"
                    min={1}
                    max={14}
                    defaultValue={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Jornada
                  <select
                    name="jornada"
                    defaultValue="Diurna"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  >
                    <option>Diurna</option>
                    <option>Nocturna</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                
                <label className="text-sm font-semibold text-slate-800">
                  Estado de programación
                  <select
                    name="estadoProgramacion"
                    defaultValue="Por programar"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  >
                    <option>Por programar</option>
                    <option>Horario asignado</option>
                  </select>
                </label>
              </div>
              <label className="text-sm font-semibold text-slate-800">
                Observaciones
                <textarea
                  name="observaciones"
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  placeholder="Notas para coordinación académica (opcional)"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  onClick={() => setOpenGrupoModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800">
                  Guardar grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Secciones / Grupos</h3>
          <label className="relative w-full sm:max-w-xs">
            <span className="sr-only">Buscar grupo</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Buscar grupo…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Código grupo</th>
                <th className="px-4 py-3">Cupo máx.</th>
                <th className="px-4 py-3">Cupo planeado</th>
                <th className="px-4 py-3">Estado programación</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((g) => (
                <tr key={g.codigo} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-slate-500">{g.codigo}</p>
                    <p className="font-semibold text-slate-900">{g.nombre}</p>
                    <p className="text-xs text-slate-500">{g.semestre}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{g.cupoMax}</td>
                  <td className="px-4 py-3 font-semibold">{g.cupoPlaneado}</td>
               
                  <td className="px-4 py-3">
                    {g.estadoProg === 'horario' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                        📅 Horario asignado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                        📅 Por programar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    <button type="button" className="p-1 hover:text-red-700" aria-label="Editar">
                      ✏️
                    </button>
                    <button type="button" className="p-1 hover:text-red-700" aria-label="Más">
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Mostrando {rows.length} grupos.</span>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-1 font-semibold hover:bg-slate-50">
              Anterior
            </button>
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-1 font-semibold hover:bg-slate-50">
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
