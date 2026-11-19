import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Trash2,
} from 'lucide-react';
import type {
  LofiPreferences,
  PomodoroMode,
  PomodoroSettings,
  TodayTask,
} from '../types';
import { LofiPlayerPanel } from './LofiPlayerPanel';

interface PomodoroViewProps {
  mode: PomodoroMode;
  secondsLeft: number;
  isRunning: boolean;
  completedCycles: number;
  settings: PomodoroSettings;
  todayTasks: TodayTask[];
  activeTaskId: string | null;
  lofiPrefs: LofiPreferences;
  onSwitchMode: (mode: PomodoroMode) => void;
  onToggleRun: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSelectTask: (id: string) => void;
  onToggleTaskDone: (id: string) => void;
  onAddTodayTask: (text: string) => { ok: boolean; error?: string };
  onDeleteTodayTask: (id: string) => void;
  onClearDoneTasks: () => void;
  onUpdateLofiPrefs: (next: LofiPreferences) => void;
  onOpenDaleTab: () => void;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  mode,
  secondsLeft,
  isRunning,
  completedCycles,
  settings,
  todayTasks,
  activeTaskId,
  lofiPrefs,
  onSwitchMode,
  onToggleRun,
  onReset,
  onSkip,
  onSelectTask,
  onToggleTaskDone,
  onAddTodayTask,
  onDeleteTodayTask,
  onClearDoneTasks,
  onUpdateLofiPrefs,
  onOpenDaleTab,
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [taskWarning, setTaskWarning] = useState<string | null>(null);

  const totalSecondsForMode =
    (mode === 'focus'
      ? settings.focusMinutes
      : mode === 'shortBreak'
      ? settings.shortBreakMinutes
      : settings.longBreakMinutes) * 60;

  const progressPct =
    totalSecondsForMode > 0
      ? Math.min(100, Math.max(0, ((totalSecondsForMode - secondsLeft) / totalSecondsForMode) * 100))
      : 0;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const activeTask = todayTasks.find((t) => t.id === activeTaskId) ?? null;

  // Estimate finish time for current timer + remaining pomodoros of pending tasks
  const pendingEstPomodoros = todayTasks
    .filter((t) => !t.done)
    .reduce((acc, t) => acc + Math.max(1, (t.estPomodoros || 1) - (t.pomodoros || 0)), 0);

  const finishDate = new Date(Date.now() + secondsLeft * 1000);
  const finishTimeLabel = finishDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const accentClasses =
    settings.themeStyle === 'monochrome'
      ? {
          cardBorder: 'border-white/15',
          progressBar: 'bg-white',
          primaryBtn: 'bg-white text-zinc-950 hover:bg-zinc-200',
          modeActive: 'bg-white text-zinc-950 font-semibold',
          subtleTint: 'bg-[#141417]',
        }
      : mode === 'focus'
      ? {
          cardBorder: 'border-[#ba4949]/35',
          progressBar: 'bg-[#d95550]',
          primaryBtn: 'bg-[#d95550] text-white hover:bg-[#c54742]',
          modeActive: 'bg-[#ba4949] text-white font-semibold',
          subtleTint: 'bg-[#1a1314]',
        }
      : mode === 'shortBreak'
      ? {
          cardBorder: 'border-[#38858a]/35',
          progressBar: 'bg-[#4c9196]',
          primaryBtn: 'bg-[#4c9196] text-white hover:bg-[#3f7f84]',
          modeActive: 'bg-[#38858a] text-white font-semibold',
          subtleTint: 'bg-[#12191a]',
        }
      : {
          cardBorder: 'border-[#397097]/35',
          progressBar: 'bg-[#457ca3]',
          primaryBtn: 'bg-[#457ca3] text-white hover:bg-[#3a6b8e]',
          modeActive: 'bg-[#397097] text-white font-semibold',
          subtleTint: 'bg-[#12171d]',
        };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    const res = onAddTodayTask(trimmed);
    if (!res.ok) {
      setTaskWarning(res.error ?? 'Alcanzaste el máximo de 5 prioridades.');
      return;
    }
    setTaskWarning(null);
    setNewTaskText('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Pomofocus Timer + Linked Hoy (Max 5) Tasks */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Timer Card */}
        <section
          className={`relative overflow-hidden rounded-xl border ${accentClasses.cardBorder} ${accentClasses.subtleTint} p-6 sm:p-8 transition-colors duration-300`}
        >
          {/* Top Progress Track */}
          <div className="absolute inset-x-0 top-0 h-1 bg-white/5">
            <div
              className={`h-full ${accentClasses.progressBar} transition-all duration-300`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Mode Selector */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-lg bg-black/30 p-1 border border-white/10 max-w-md mx-auto">
            {(
              [
                { id: 'focus', label: 'Pomodoro' },
                { id: 'shortBreak', label: 'Descanso corto' },
                { id: 'longBreak', label: 'Descanso largo' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSwitchMode(item.id)}
                className={`flex-1 rounded-md px-3 py-2 text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === item.id
                    ? accentClasses.modeActive
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Clock Display */}
          <div className="my-8 sm:my-10 text-center">
            <div
              className="font-mono-tabular text-[clamp(4.25rem,10vw,6.75rem)] font-bold leading-none tracking-tight text-white select-none"
              aria-live="polite"
            >
              {mins}:{secs}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
              <span>Ciclo #{completedCycles + 1}</span>
              <span aria-hidden="true">·</span>
              <span>
                {mode === 'focus'
                  ? 'Tiempo de concentración'
                  : mode === 'shortBreak'
                  ? 'Pausa breve para recargar'
                  : 'Descanso profundo'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono-tabular text-zinc-300">
                <Clock className="h-3.5 w-3.5" />
                Fin aprox. {finishTimeLabel}
              </span>
            </div>
          </div>

          {/* Primary Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onReset}
              title="Reiniciar temporizador"
              aria-label="Reiniciar temporizador"
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/15 bg-black/25 text-zinc-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onToggleRun}
              className={`flex h-12 min-w-[168px] items-center justify-center gap-2.5 rounded-lg px-8 text-sm font-bold tracking-wide uppercase transition active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 ${accentClasses.primaryBtn}`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Iniciar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSkip}
              title="Saltar a la siguiente fase"
              aria-label="Saltar a la siguiente fase"
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/15 bg-black/25 text-zinc-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Active Focus Task Banner */}
          <div className="mt-7 border-t border-white/10 pt-4 flex items-center justify-between gap-4 text-xs">
            <div className="min-w-0">
              <span className="text-zinc-500">Enfocando en: </span>
              <span className="font-medium text-white truncate">
                {activeTask
                  ? activeTask.text
                  : 'Sin tarea seleccionada (elige una prioridad abajo)'}
              </span>
            </div>
            {pendingEstPomodoros > 0 && (
              <span className="font-mono-tabular text-zinc-400 whitespace-nowrap shrink-0">
                {pendingEstPomodoros} pom. restantes
              </span>
            )}
          </div>
        </section>

        {/* Pomofocus-style Linked Tasks Panel (synced with DALE!! Hoy Max 5) */}
        <section className="rounded-xl border border-white/10 bg-[#141417] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">
                Prioridades de Hoy (DALE!!)
              </h3>
              <span className="font-mono-tabular text-xs text-zinc-400">
                {todayTasks.length} / 5
              </span>
            </div>
            <div className="flex items-center gap-4">
              {todayTasks.some((t) => t.done) && (
                <button
                  type="button"
                  onClick={onClearDoneTasks}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer whitespace-nowrap"
                >
                  Limpiar tachadas
                </button>
              )}
              <button
                type="button"
                onClick={onOpenDaleTab}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer whitespace-nowrap"
              >
                <span>Abrir Organizador</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleTaskSubmit} className="flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => {
                setNewTaskText(e.target.value);
                if (taskWarning) setTaskWarning(null);
              }}
              placeholder="Añadir prioridad clave para hoy..."
              className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-zinc-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          </form>

          {taskWarning && (
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2">
              {taskWarning}
            </p>
          )}

          {todayTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 py-6 px-4 text-center text-xs text-zinc-500">
              No tienes prioridades cargadas para hoy. Agrega hasta 5 tareas clave o tráelas desde el Cajón de Pendientes en la pestaña Organizador DALE!!.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {todayTasks.map((task) => {
                const isSelected = task.id === activeTaskId;
                return (
                  <li
                    key={task.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 transition-colors ${
                      isSelected
                        ? 'border-white/40 bg-white/10'
                        : 'border-white/10 bg-zinc-900/50 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleTaskDone(task.id)}
                        aria-label={
                          task.done ? 'Marcar como pendiente' : 'Marcar como completada'
                        }
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer ${
                          task.done
                            ? 'border-white bg-white text-zinc-950'
                            : 'border-zinc-500 hover:border-white'
                        }`}
                      >
                        {task.done && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTask(task.id)}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <span
                          className={`block truncate text-sm ${
                            task.done ? 'line-through text-zinc-500' : 'text-zinc-100'
                          }`}
                        >
                          {task.text}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono-tabular text-xs text-zinc-400">
                        {task.pomodoros || 0} pom.
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteTodayTask(task.id)}
                        aria-label={`Eliminar ${task.text}`}
                        className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Right Column: Lo-Fi & Alpha Waves Media Player */}
      <div className="lg:col-span-5">
        <LofiPlayerPanel
          prefs={lofiPrefs}
          onUpdatePrefs={onUpdateLofiPrefs}
          isFocusRunning={isRunning && mode === 'focus'}
        />
      </div>
    </div>
  );
};
