import React, { useMemo } from 'react';
import { BarChart3, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import type { DailyStat, SessionRecord, TodayTask } from '../types';
import { getLocalDateStr } from '../utils/storage';

interface StatsViewProps {
  dailyStats: DailyStat[];
  sessions: SessionRecord[];
  todayTasks: TodayTask[];
  onClearStats: () => void;
  onGoToPomodoro: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  dailyStats,
  sessions,
  todayTasks,
  onClearStats,
  onGoToPomodoro,
}) => {
  const todayStr = getLocalDateStr();
  const todayStat = dailyStats.find((s) => s.date === todayStr) ?? {
    date: todayStr,
    pomodoros: 0,
    minutes: 0,
  };

  const totalPomodoros = dailyStats.reduce((acc, s) => acc + s.pomodoros, 0);
  const totalMinutes = dailyStats.reduce((acc, s) => acc + s.minutes, 0);
  const doneTodayCount = todayTasks.filter((t) => t.done).length;

  const last7Days = useMemo(() => {
    const days: { date: string; label: string; minutes: number; pomodoros: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = getLocalDateStr(d);
      const found = dailyStats.find((s) => s.date === iso);
      days.push({
        date: iso,
        label: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        minutes: found?.minutes ?? 0,
        pomodoros: found?.pomodoros ?? 0,
      });
    }
    return days;
  }, [dailyStats]);

  const maxMinutes = Math.max(25, ...last7Days.map((d) => d.minutes));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Resumen de Concentración
          </h1>
          <p className="text-xs text-zinc-400">
            Registro local guardado en tu navegador
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            type="button"
            onClick={onClearStats}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:border-rose-400/50 hover:text-rose-300 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reiniciar historial</span>
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#141417] p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Enfoque hoy</span>
            <Clock className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="font-mono-tabular mt-2 text-3xl font-bold text-white">
            {todayStat.minutes} min
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {todayStat.pomodoros} sesiones completadas hoy
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#141417] p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total acumulado</span>
            <BarChart3 className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="font-mono-tabular mt-2 text-3xl font-bold text-white">
            {totalMinutes} min
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {totalPomodoros} Pomodoros registrados
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#141417] p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Prioridades DALE!! hoy</span>
            <CheckCircle2 className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="font-mono-tabular mt-2 text-3xl font-bold text-white">
            {doneTodayCount} / {todayTasks.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Tareas completadas de tu lista de hoy
          </p>
        </div>
      </div>

      {/* 7-Day Activity Chart + Recent Sessions */}
      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#141417] py-12 px-6 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-zinc-200">
            Aún no has completado sesiones de Pomodoro
          </p>
          <p className="text-xs text-zinc-400 max-w-md">
            Cuando termines tu primer bloque de enfoque, verás aquí tus minutos diarios de los últimos 7 días y el detalle por tarea.
          </p>
          <button
            type="button"
            onClick={onGoToPomodoro}
            className="mt-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 cursor-pointer"
          >
            Ir al Temporizador
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 rounded-xl border border-white/10 bg-[#141417] p-5">
            <h2 className="text-sm font-semibold text-white mb-5">
              Últimos 7 días (minutos de enfoque)
            </h2>
            <div className="grid grid-cols-7 gap-3 items-end h-44 pt-4">
              {last7Days.map((day) => {
                const heightPct = Math.round((day.minutes / maxMinutes) * 100);
                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center justify-end h-full gap-2"
                  >
                    <span className="font-mono-tabular text-[11px] text-zinc-400">
                      {day.minutes > 0 ? `${day.minutes}m` : '0'}
                    </span>
                    <div className="w-full max-w-[36px] flex-1 flex items-end rounded-md bg-zinc-900 overflow-hidden">
                      <div
                        className="w-full rounded-t-md bg-[#d95550] transition-all duration-300"
                        style={{ height: `${Math.max(day.minutes > 0 ? 8 : 0, heightPct)}%` }}
                      />
                    </div>
                    <span className="text-[11px] capitalize text-zinc-400">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-5 rounded-xl border border-white/10 bg-[#141417] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">
              Sesiones recientes
            </h2>
            <ul className="divide-y divide-white/5 max-h-64 overflow-y-auto pr-1">
              {sessions.slice(0, 12).map((s) => (
                <li
                  key={s.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-zinc-200 font-medium truncate">
                      {s.taskText || 'Enfoque libre'}
                    </p>
                    <p className="text-zinc-500">
                      {new Date(s.completedAt).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="font-mono-tabular text-zinc-300 shrink-0">
                    {s.durationMinutes} min
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};
