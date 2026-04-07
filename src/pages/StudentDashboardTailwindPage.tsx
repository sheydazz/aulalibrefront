import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearSession } from '../auth'
import {
  DAY_LABELS,
  SCHEDULE_BY_DAY,
  type CardAccent,
  type DayKey,
  type ScheduleBlock,
} from '../data/studentSchedule'

type TabId = 'horario' | 'crear'

const ACCENT_STYLES: Record<CardAccent, string> = {
  emerald: 'border-l-emerald-600 bg-rose-50 text-rose-900',
  violet: 'border-l-violet-600 bg-violet-50 text-violet-900',
  amber: 'border-l-amber-600 bg-amber-50 text-amber-900',
  teal: 'border-l-teal-600 bg-teal-50 text-teal-900',
  slate: 'border-l-slate-600 bg-slate-50 text-slate-900',
  orange: 'border-l-orange-600 bg-orange-50 text-orange-900',
}

function blockKey(block: ScheduleBlock, index: number) {
  return `${block.type}-${block.start}-${block.end}-${index}`
}

export default function StudentDashboardTailwindPage() {
  const [day, setDay] = useState<DayKey>('lun')
  const [programa, setPrograma] = useState('Ingeniería de Sistemas')
  const [semestreGrupo, setSemestreGrupo] = useState('5to Semestre - Grupo A')
  const [tab, setTab] = useState<TabId>('horario')
  const daySchedule = useMemo(() => SCHEDULE_BY_DAY[day], [day])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-rose-50 text-rose-900 lg:my-6 lg:overflow-hidden lg:rounded-3xl lg:shadow-2xl lg:shadow-rose-900/10">
      <header className="rounded-b-3xl bg-gradient-to-br from-red-700 via-rose-700 to-red-800 px-4 pb-4 pt-5 text-rose-50 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Horario Académico</h1>
            <p className="mt-1 text-sm font-medium text-rose-100">Sede Barranquilla</p>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 print:hidden">
            🔔
          </button>
        </div>

        <nav className="mt-4 flex gap-2 print:hidden">
          <button
            type="button"
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
              tab === 'horario'
                ? 'border-transparent bg-rose-50 text-rose-900'
                : 'border-white/35 bg-black/10 text-rose-50'
            }`}
            onClick={() => setTab('horario')}
          >
            Mi horario
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
              tab === 'crear'
                ? 'border-transparent bg-rose-50 text-rose-900'
                : 'border-white/35 bg-black/10 text-rose-50'
            }`}
            onClick={() => setTab('crear')}
          >
            Crear mi horario
          </button>
        </nav>

        {tab === 'horario' ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-widest text-rose-100">
              <span>Programa</span>
              <select
                className="w-full rounded-xl border border-white/30 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900"
                value={programa}
                onChange={(e) => setPrograma(e.target.value)}
              >
                <option>Ingeniería de Sistemas</option>
                <option>Ingeniería Industrial</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-widest text-rose-100">
              <span>Semestre / Grupo</span>
              <select
                className="w-full rounded-xl border border-white/30 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900"
                value={semestreGrupo}
                onChange={(e) => setSemestreGrupo(e.target.value)}
              >
                <option>5to Semestre - Grupo A</option>
                <option>5to Semestre - Grupo B</option>
              </select>
            </label>
          </div>
        ) : null}
      </header>

      {tab === 'crear' ? (
        <main className="flex-1 px-4 py-6 sm:px-6">
          <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-rose-900">Crear mi horario</h2>
            <p className="mt-3 text-slate-600">
              Aquí podrás armar y guardar tu combinación de materias. Por ahora es vista previa.
            </p>
            <button
              type="button"
              className="mt-5 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500"
              disabled
            >
              Comenzar (próximamente)
            </button>
          </section>
        </main>
      ) : (
        <>
          <div className="bg-rose-50 px-4 pt-3 sm:px-6 print:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DAY_LABELS.map(({ key, short }) => (
                <button
                  key={key}
                  type="button"
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    day === key
                      ? 'bg-red-700 text-white'
                      : 'bg-rose-100 text-slate-700 hover:bg-rose-200'
                  }`}
                  onClick={() => setDay(key)}
                >
                  {short}
                </button>
              ))}
            </div>
          </div>

          <main className="flex-1 px-4 py-4 pb-24 sm:px-6">
            <section className="mb-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Jornada mañana
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {daySchedule.morning.map((block, i) => (
                  <ScheduleCard key={blockKey(block, i)} block={block} />
                ))}
              </div>
            </section>
            <section className="mb-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Jornada tarde / noche
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {daySchedule.afternoon.map((block, i) => (
                  <ScheduleCard key={blockKey(block, i)} block={block} />
                ))}
              </div>
            </section>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-red-700 to-rose-700 px-4 py-3 text-sm font-bold text-white print:hidden"
              onClick={() => window.print()}
            >
              Descargar horario (PDF)
            </button>
          </main>
        </>
      )}

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-rose-200 bg-rose-50/90 px-4 py-3 text-sm backdrop-blur print:hidden sm:px-6">
        <span className="font-semibold text-slate-600">AulaLibre · Estudiante</span>
        <Link className="font-bold text-rose-700 hover:text-rose-800" to="/login" onClick={() => clearSession()}>
          Salir
        </Link>
      </footer>
    </div>
  )
}

function ScheduleCard({ block }: { block: ScheduleBlock }) {
  if (block.type === 'empty') {
    return (
      <article className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="mb-1 text-xs font-bold text-slate-700">
          {block.start} - {block.end}
        </div>
        <p className="text-sm font-semibold text-slate-500">Sin clases programadas</p>
      </article>
    )
  }

  return (
    <article className={`rounded-xl border-l-4 p-4 shadow-sm ${ACCENT_STYLES[block.accent]}`}>
      <div className="mb-2 text-xs font-bold text-slate-700">
        {block.start} - {block.end}
      </div>
      <h3 className="mb-2 text-base font-extrabold tracking-wide">{block.title}</h3>
      <p className="flex flex-col gap-1 text-sm font-medium">
        <span>{block.professor}</span>
        <span>{block.location}</span>
      </p>
    </article>
  )
}
