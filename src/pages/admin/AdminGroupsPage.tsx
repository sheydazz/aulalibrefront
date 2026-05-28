import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AddProgramModal, AddSubjectModal } from '../../components/admin/ProgramSubjectModals'
import {
  apiGetGroups,
  apiGetPrograms,
  apiGetSubjects,
  apiCreateGroup,
  type ApiGroup,
  type ApiProgram,
  type ApiSubject,
} from '../../services/api'

export default function AdminGroupsPage() {
  const [grupos, setGrupos] = useState<ApiGroup[]>([])
  const [programas, setProgramas] = useState<ApiProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [openProgramaModal, setOpenProgramaModal] = useState(false)
  const [openAsignaturaModal, setOpenAsignaturaModal] = useState(false)
  const [openGrupoModal, setOpenGrupoModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingError, setSavingError] = useState<string | null>(null)

  // Modal state
  const [modalProgramaId, setModalProgramaId] = useState('')
  const [modalSubjects, setModalSubjects] = useState<ApiSubject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  useEffect(() => {
    Promise.all([apiGetGroups(), apiGetPrograms()])
      .then(([g, p]) => {
        setGrupos(g)
        setProgramas(p)
        if (p.length > 0) setModalProgramaId(p[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!modalProgramaId) return
    setLoadingSubjects(true)
    apiGetSubjects(modalProgramaId)
      .then(setModalSubjects)
      .catch(() => setModalSubjects([]))
      .finally(() => setLoadingSubjects(false))
  }, [modalProgramaId])

  const handleOpenModal = () => {
    setSavingError(null)
    setOpenGrupoModal(true)
  }

  const rows = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return grupos
    return grupos.filter(
      (g) =>
        g.nombre.toLowerCase().includes(q) ||
        g.codigo.includes(q) ||
        (g.docente && g.docente.toLowerCase().includes(q)) ||
        (g.asignatura && g.asignatura.toLowerCase().includes(q)),
    )
  }, [busqueda, grupos])

  const totalCupo = grupos.reduce((a, g) => a + g.cupoMax, 0)

  const submitGrupo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const asignaturaId = Number(fd.get('asignaturaId'))
    const subject = modalSubjects.find((s) => s.id === asignaturaId)
    if (!subject) {
      setSavingError('Selecciona una asignatura válida.')
      return
    }
    setSaving(true)
    setSavingError(null)
    try {
      const nuevo = await apiCreateGroup({
        codigo: String(fd.get('codigo')).trim(),
        nombre: subject.nombre,
        semestre: `Semestre ${subject.semestre}`,
        programaId: modalProgramaId,
        asignatura: subject.nombre,
        semestreNum: subject.semestre,
        grupoSeccion: String(fd.get('grupoSeccion')).toUpperCase().trim(),
        cupoMax: Number(fd.get('cupoMax')),
        cupoPlaneado: Number(fd.get('cupoPlaneado')),
        estadoProg: fd.get('estadoProg') === 'Horario asignado' ? 'horario' : 'pendiente',
      })
      setGrupos((prev) => [...prev, nuevo])
      setOpenGrupoModal(false)
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Error al crear grupo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de grupos por asignatura</h2>
          <p className="text-sm text-slate-600">
            Crea secciones de asignaturas con cupos, docente y estado de programación para el semestre en curso.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            onClick={() => setOpenProgramaModal(true)}
          >
            + Añadir programa
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            onClick={() => setOpenAsignaturaModal(true)}
          >
            + Añadir asignatura
          </button>
          <button
            type="button"
            onClick={handleOpenModal}
            className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            + Crear nuevo grupo
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-800">
        <div className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-wide text-slate-700">
          <span>Total grupos: {grupos.length}</span>
          <span>Cupo total plan: {totalCupo}</span>
        </div>
      </div>

      <AddProgramModal open={openProgramaModal} onClose={() => setOpenProgramaModal(false)} />
      <AddSubjectModal
        open={openAsignaturaModal}
        onClose={() => setOpenAsignaturaModal(false)}
        programOptions={programas.map((p) => p.nombre)}
      />

      {openGrupoModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Crear nuevo grupo</h3>
            <p className="mt-1 text-sm text-slate-600">
              Elige programa, asignatura y sección. El grupo quedará disponible en el constructor de horarios.
            </p>
            <form className="mt-4 grid gap-3" onSubmit={submitGrupo}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">
                  Programa *
                  <select
                    required
                    value={modalProgramaId}
                    onChange={(e) => setModalProgramaId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  >
                    {programas.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Asignatura *
                  <select
                    required
                    name="asignaturaId"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    disabled={loadingSubjects || modalSubjects.length === 0}
                  >
                    {loadingSubjects ? (
                      <option value="">Cargando...</option>
                    ) : modalSubjects.length === 0 ? (
                      <option value="">Sin asignaturas registradas</option>
                    ) : (
                      modalSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} (Sem. {s.semestre})
                        </option>
                      ))
                    )}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-sm font-semibold text-slate-800">
                  Sección *
                  <input
                    required
                    name="grupoSeccion"
                    maxLength={4}
                    placeholder="Ej. A"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Código *
                  <input
                    required
                    name="codigo"
                    placeholder="Ej. 01"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Estado
                  <select
                    name="estadoProg"
                    defaultValue="Por programar"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  >
                    <option>Por programar</option>
                    <option>Horario asignado</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold text-slate-800">
                  Cupo máximo *
                  <input
                    required
                    name="cupoMax"
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
              </div>
              {savingError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {savingError}
                </p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  onClick={() => setOpenGrupoModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || modalSubjects.length === 0}
                  className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar grupo'}
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
              placeholder="Buscar por asignatura, código o docente…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            Cargando grupos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Asignatura / Sección</th>
                  <th className="px-4 py-3">Sem.</th>
                  <th className="px-4 py-3">Cupo máx.</th>
                  <th className="px-4 py-3">Cupo plan.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                      {busqueda ? 'Sin resultados para la búsqueda.' : 'No hay grupos registrados. Crea el primero.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((g) => (
                    <tr key={g.id ?? g.codigo} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{g.asignatura ?? g.nombre}</p>
                        <p className="font-mono text-xs text-slate-500">
                          {g.codigo}{g.grupoSeccion ? ` · Sección ${g.grupoSeccion}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {g.semestreNum ? `${g.semestreNum}°` : g.semestre}
                      </td>
                      <td className="px-4 py-3 font-semibold">{g.cupoMax}</td>
                      <td className="px-4 py-3 font-semibold">{g.cupoPlaneado}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          Mostrando {rows.length} de {grupos.length} grupos.
        </div>
      </section>
    </div>
  )
}
