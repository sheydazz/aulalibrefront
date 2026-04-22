import { useMemo, useState } from 'react'
import { AddProgramModal, AddSubjectModal } from '../../components/admin/ProgramSubjectModals'
import {
  MOCK_PLAN_SISTEMAS_SEM1,
  MOCK_PROGRAMAS,
  type AsignaturaRow,
} from '../../data/adminMockData'

const AREA_BADGE: Record<AsignaturaRow['areaTone'], string> = {
  slate: 'bg-slate-100 text-slate-800 ring-slate-200',
  blue: 'bg-blue-100 text-blue-800 ring-blue-200',
  emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  pink: 'bg-pink-100 text-pink-800 ring-pink-200',
}

export default function AdminProgramsPage() {
  const [selectedId, setSelectedId] = useState(MOCK_PROGRAMAS[0].id)
  const [semestre, setSemestre] = useState(1)
  const [openProgramaModal, setOpenProgramaModal] = useState(false)
  const [openAsignaturaModal, setOpenAsignaturaModal] = useState(false)

  const programa = MOCK_PROGRAMAS.find((p) => p.id === selectedId) ?? MOCK_PROGRAMAS[0]

  const resumen = useMemo(() => {
    const list = MOCK_PLAN_SISTEMAS_SEM1
    const creditos = list.reduce((a, s) => a + s.creditos, 0)
    return { total: list.length, creditos }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de programas y semestres</h2>
          <p className="text-sm text-slate-600">
            Define programas, plan de estudios y asignaturas por semestre con créditos y características.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenProgramaModal(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-800"
        >
          + Nuevo programa
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {MOCK_PROGRAMAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
              selectedId === p.id ? 'border-red-600 ring-2 ring-red-100' : 'border-slate-200'
            }`}
          >
            <p className="text-sm font-bold text-slate-900">{p.nombre}</p>
            <p className="mt-1 text-xs text-slate-500">SNIES {p.snies}</p>
            <p className="mt-3 text-xs font-semibold text-slate-600">
              {p.semestres} semestres · {p.creditos} créditos
            </p>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpenProgramaModal(true)}
          className="flex min-h-[120px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white text-sm font-bold text-slate-500 hover:border-red-400 hover:text-red-700"
        >
          + Añadir programa
        </button>
      </div>

      <section className="rounded-2xl border-2 border-dashed border-blue-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Programa seleccionado</p>
            <h3 className="text-xl font-bold text-slate-900">Plan de estudios: {programa.nombre}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpenAsignaturaModal(true)}
              className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
            >
              + Añadir asignatura
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {Array.from({ length: programa.semestres }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSemestre(n)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                semestre === n ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semestre {n}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Total asignaturas</p>
            <p className="text-2xl font-bold text-slate-900">{resumen.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Créditos del semestre</p>
            <p className="text-2xl font-bold text-red-700">{resumen.creditos}</p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Asignatura</th>
                <th className="px-3 py-2">Créditos</th>
                <th className="px-3 py-2">H. teóricas</th>
                <th className="px-3 py-2">H. prácticas</th>
                <th className="px-3 py-2">Área</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_PLAN_SISTEMAS_SEM1.map((a) => (
                <tr key={a.codigo} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2 font-mono text-xs font-bold text-slate-700">{a.codigo}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{a.nombre}</td>
                  <td className="px-3 py-2 font-bold text-red-700">{a.creditos}</td>
                  <td className="px-3 py-2 text-slate-600">{a.hTeoria}</td>
                  <td className="px-3 py-2 text-slate-600">{a.hPractica}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${AREA_BADGE[a.areaTone]}`}>
                      {a.area}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">
                    <button type="button" className="p-1 hover:text-red-700" aria-label="Editar">
                      ✏️
                    </button>
                    <button type="button" className="p-1 hover:text-red-700" aria-label="Eliminar">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <AddProgramModal open={openProgramaModal} onClose={() => setOpenProgramaModal(false)} />
      <AddSubjectModal
        open={openAsignaturaModal}
        onClose={() => setOpenAsignaturaModal(false)}
        programOptions={MOCK_PROGRAMAS.map((p) => p.nombre)}
        defaultProgram={programa.nombre}
      />
    </div>
  )
}
