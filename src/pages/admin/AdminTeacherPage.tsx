import { useMemo, useState, type FormEvent } from 'react'
import DocenteDisponibilidadGrid from '../../components/admin/DocenteDisponibilidadGrid'
import {
  MOCK_DOCENTES_PERFIL,
  type CargaDocenteRow,
  type DocentePerfil,
  type VinculacionDocente,
} from '../../data/adminMockData'

type DocenteTab = 'general' | 'carga' | 'disponibilidad'

function totalHoras(carga: CargaDocenteRow[]) {
  return carga.reduce((a, r) => a + r.horasSemana, 0)
}

function inicialesDeNombre(nombreCompleto: string) {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)
  const a = partes[0]?.[0] ?? ''
  const b = partes.length > 1 ? (partes[1]?.[0] ?? '') : (partes[0]?.[1] ?? '')
  return (a + b).toUpperCase() || '??'
}

export default function AdminTeacherPage() {
  const [docentes, setDocentes] = useState<DocentePerfil[]>(() => [...MOCK_DOCENTES_PERFIL])
  const [selectedId, setSelectedId] = useState(MOCK_DOCENTES_PERFIL[0].id)
  const [tab, setTab] = useState<DocenteTab>('carga')
  const [q, setQ] = useState('')
  const [modalAgregar, setModalAgregar] = useState(false)
  const [formNuevo, setFormNuevo] = useState({
    nombreCompleto: '',
    tituloProfesional: 'Ing.',
    email: '',
    telefono: '',
    departamento: '',
    vinculacion: 'Cátedra' as VinculacionDocente,
    maxHorasSemana: '40',
  })

  const docente = useMemo(() => docentes.find((d) => d.id === selectedId) ?? docentes[0], [docentes, selectedId])

  const horas = useMemo(() => totalHoras(docente.carga), [docente.carga])
  const maxHoras = docente.maxHorasSemana
  const pctHoras = maxHoras > 0 ? Math.min(100, (horas / maxHoras) * 100) : 0
  const limiteOk = horas <= maxHoras

  const filasCarga = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return docente.carga
    return docente.carga.filter(
      (r) =>
        r.asignatura.toLowerCase().includes(t) ||
        r.codigo.toLowerCase().includes(t) ||
        r.grupo.toLowerCase().includes(t),
    )
  }, [docente.carga, q])

  const abrirAgregar = () => {
    setFormNuevo({
      nombreCompleto: '',
      tituloProfesional: 'Ing.',
      email: '',
      telefono: '',
      departamento: '',
      vinculacion: 'Cátedra',
      maxHorasSemana: '40',
    })
    setModalAgregar(true)
  }

  const guardarNuevoDocente = (e: FormEvent) => {
    e.preventDefault()
    const nombre = formNuevo.nombreCompleto.trim()
    const email = formNuevo.email.trim().toLowerCase()
    const departamento = formNuevo.departamento.trim()
    if (!nombre || !email || !departamento) return

    const max = Number.parseInt(formNuevo.maxHorasSemana, 10)
    const nuevo: DocentePerfil = {
      id: `d-${typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto ? globalThis.crypto.randomUUID() : String(Date.now())}`,
      nombreCompleto: nombre,
      tituloProfesional: formNuevo.tituloProfesional,
      iniciales: inicialesDeNombre(nombre),
      vinculacion: formNuevo.vinculacion,
      departamento,
      email,
      telefono: formNuevo.telefono.trim() || '—',
      maxHorasSemana: Number.isFinite(max) && max > 0 ? max : 40,
      gruposActivos: 0,
      asignaturasDistintas: 0,
      espaciosFrecuentes: [],
      ultimaActualizacionCarga: 'Sin asignaciones en el periodo actual',
      carga: [],
    }
    setDocentes((lista) => [...lista, nuevo])
    setSelectedId(nuevo.id)
    setTab('carga')
    setModalAgregar(false)
    setQ('')
  }

  const onChangeDocente = (id: string) => {
    setSelectedId(id)
    setQ('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Perfil y carga académica del docente</h2>
          <p className="text-sm text-slate-600">
            Elige un docente para ver sus pestañas, métricas y carga del periodo. Vista administrativa.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <label className="min-w-0 flex-1 text-sm font-semibold text-slate-800">
          Docente
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            value={selectedId}
            onChange={(e) => onChangeDocente(e.target.value)}
          >
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.tituloProfesional} {d.nombreCompleto} — {d.email}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={abrirAgregar}
          className="shrink-0 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-800 sm:mb-0.5"
        >
          + Agregar docente
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
        {(
          [
            ['general', 'Información general'],
            ['carga', 'Carga académica actual'],
            ['disponibilidad', 'Disponibilidad'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-3 py-1.5 transition ${
              tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            {docente.tituloProfesional} {docente.nombreCompleto}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{docente.departamento}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Correo institucional</dt>
              <dd className="mt-1 font-semibold text-blue-700">{docente.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Teléfono</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.telefono}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Vinculación</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                  {docente.vinculacion}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Tope horario semanal</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.maxHorasSemana} h</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-slate-600">
            Los cambios de datos maestros se persistirán contra el API de personal académico (pendiente de integración).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              Editar perfil
            </button>
            <button
              type="button"
              className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={docente.carga.length === 0}
            >
              Descargar horario
            </button>
          </div>
        </section>
      ) : null}
      {tab === 'disponibilidad' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Disponibilidad docente</h3>
          <DocenteDisponibilidadGrid docenteId={docente.id} nombreCompleto={docente.nombreCompleto} />
        </section>
      ) : null}

      {tab === 'carga' ? (
        <>
          <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[280px_1fr]">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="grid h-28 w-28 place-items-center rounded-full bg-slate-200 text-2xl font-bold text-slate-700">
                  {docente.iniciales}
                </div>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  {docente.vinculacion}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">
                {docente.tituloProfesional} {docente.nombreCompleto}
              </h3>
              <p className="text-sm text-slate-600">{docente.departamento}</p>
              <p className="mt-1 text-xs text-slate-500">{docente.email}</p>
              <p className="text-xs text-slate-500">{docente.telefono}</p>
              <div className="mt-4 flex w-full flex-col gap-2">
                <button type="button" className="rounded-xl border border-slate-200 py-2 text-sm font-semibold hover:bg-slate-50">
                  Editar perfil
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-red-700 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={docente.carga.length === 0}
                >
                  Descargar horario
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Horas asignadas</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {horas} / {maxHoras}{' '}
                  <span className="text-sm font-semibold text-slate-500">hrs</span>
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-red-600" style={{ width: `${pctHoras}%` }} />
                </div>
                <p className={`mt-2 text-xs font-bold ${limiteOk ? 'text-emerald-700' : 'text-red-700'}`}>
                  {limiteOk ? 'Dentro del límite' : 'Sobre el tope configurado'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Grupos asignados</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{docente.gruposActivos}</p>
                <p className="text-xs text-slate-600">
                  Activos · {docente.asignaturasDistintas} asignatura{docente.asignaturasDistintas === 1 ? '' : 's'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Espacios frecuentes</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {docente.espaciosFrecuentes.length ? (
                    docente.espaciosFrecuentes.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-slate-500">Sin asignaciones aún</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Carga académica actual</h4>
                <p className="text-xs text-slate-500">Periodo académico 2026-1</p>
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none sm:max-w-xs focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Buscar en la tabla…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              {filasCarga.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-slate-500">
                  {docente.carga.length === 0
                    ? 'Este docente aún no tiene grupos asignados en el periodo actual.'
                    : 'No hay filas que coincidan con la búsqueda.'}
                </p>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Asignatura</th>
                      <th className="px-4 py-3">Grupo</th>
                      <th className="px-4 py-3">Programa</th>
                      <th className="px-4 py-3">Horas/semana</th>
                      <th className="px-4 py-3">Horario principal</th>
                      <th className="px-4 py-3">Salón</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filasCarga.map((r) => (
                      <tr key={`${r.codigo}-${r.grupo}-${r.horario}`} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{r.asignatura}</p>
                          <p className="text-xs text-slate-500">Cod: {r.codigo}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{r.grupo}</td>
                        <td className="px-4 py-3 text-slate-600">{r.programa}</td>
                        <td className="px-4 py-3 font-bold text-red-700">{r.horasSemana}</td>
                        <td className="px-4 py-3 text-slate-700">{r.horario}</td>
                        <td className="px-4 py-3 text-slate-700">{r.salon}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="font-bold text-red-700">Total horas asignadas: {horas}</p>
              <div className="flex flex-col gap-1 text-xs text-slate-500 sm:items-end">
                <span>Última actualización de carga: {docente.ultimaActualizacionCarga}</span>
                <button
                  type="button"
                  className="font-bold text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={docente.carga.length === 0}
                >
                  Imprimir carga académica
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {modalAgregar ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-agregar-docente-titulo"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="modal-agregar-docente-titulo" className="text-lg font-bold text-slate-900">
              Agregar docente
            </h3>
            <p className="mt-1 text-sm text-slate-600">Registra un docente en el directorio (vista previa local).</p>
            <form className="mt-4 flex flex-col gap-3" onSubmit={guardarNuevoDocente}>
              <label className="text-sm font-semibold text-slate-800">
                Nombre completo *
                <input
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={formNuevo.nombreCompleto}
                  onChange={(e) => setFormNuevo((f) => ({ ...f, nombreCompleto: e.target.value }))}
                  placeholder="Ej. Juan Pérez"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Título *
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={formNuevo.tituloProfesional}
                  onChange={(e) => setFormNuevo((f) => ({ ...f, tituloProfesional: e.target.value }))}
                >
                  <option>Ing.</option>
                  <option>Msc.</option>
                  <option>Ph.D.</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Correo institucional *
                <input
                  required
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={formNuevo.email}
                  onChange={(e) => setFormNuevo((f) => ({ ...f, email: e.target.value }))}
                  placeholder="docente@unilibre.edu.co"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Departamento *
                <input
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={formNuevo.departamento}
                  onChange={(e) => setFormNuevo((f) => ({ ...f, departamento: e.target.value }))}
                  placeholder="Ej. Ingeniería de Sistemas"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Teléfono
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={formNuevo.telefono}
                  onChange={(e) => setFormNuevo((f) => ({ ...f, telefono: e.target.value }))}
                  placeholder="+57 …"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Vinculación *
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={formNuevo.vinculacion}
                  onChange={(e) => setFormNuevo((f) => ({ ...f, vinculacion: e.target.value as VinculacionDocente }))}
                >
                  <option value="Titular">Titular</option>
                  <option value="Cátedra">Cátedra</option>
                  <option value="Ocasional">Ocasional</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Tope horas / semana
                <input
                  type="number"
                  min={1}
                  max={60}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={formNuevo.maxHorasSemana}
                  onChange={(e) => setFormNuevo((f) => ({ ...f, maxHorasSemana: e.target.value }))}
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  onClick={() => setModalAgregar(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
