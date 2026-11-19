import React, { useMemo, useState } from 'react';
import {
  ArrowUp,
  Bell,
  Calendar,
  Check,
  Download,
  Play,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import type { BacklogItem, KeyEvent, TodayTask } from '../types';
import { getLocalDateStr } from '../utils/storage';

interface DaleOrganizerViewProps {
  todayTasks: TodayTask[];
  keyEvents: KeyEvent[];
  backlog: BacklogItem[];
  activeTaskId: string | null;
  onAddTodayTask: (text: string) => { ok: boolean; error?: string };
  onToggleTodayTask: (id: string) => void;
  onDeleteTodayTask: (id: string) => void;
  onClearDoneTasks: () => void;
  onFocusTaskInPomodoro: (id: string) => void;
  onAddEvent: (text: string, date: string) => void;
  onDeleteEvent: (id: string) => void;
  onAddBacklog: (text: string) => void;
  onMoveBacklogToToday: (id: string) => { ok: boolean; error?: string };
  onDeleteBacklog: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

export const DaleOrganizerView: React.FC<DaleOrganizerViewProps> = ({
  todayTasks,
  keyEvents,
  backlog,
  activeTaskId,
  onAddTodayTask,
  onToggleTodayTask,
  onDeleteTodayTask,
  onClearDoneTasks,
  onFocusTaskInPomodoro,
  onAddEvent,
  onDeleteEvent,
  onAddBacklog,
  onMoveBacklogToToday,
  onDeleteBacklog,
  onExportBackup,
  onImportBackup,
}) => {
  const [todayInput, setTodayInput] = useState('');
  const [eventText, setEventText] = useState('');
  const [eventDate, setEventDate] = useState(getLocalDateStr());
  const [backlogInput, setBacklogInput] = useState('');
  const [limitFeedback, setLimitFeedback] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  const todayStr = getLocalDateStr();
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    []
  );

  const sortedEvents = useMemo(
    () => [...keyEvents].sort((a, b) => a.date.localeCompare(b.date)),
    [keyEvents]
  );

  const todayEvents = useMemo(
    () => sortedEvents.filter((ev) => ev.date === todayStr),
    [sortedEvents, todayStr]
  );

  const handleTodaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = todayInput.trim();
    if (!trimmed) return;
    const res = onAddTodayTask(trimmed);
    if (!res.ok) {
      setLimitFeedback(
        res.error ?? '¡Llegaste a las 5 prioridades! Cerrá o eliminá una para sumar otra.'
      );
      return;
    }
    setLimitFeedback(null);
    setTodayInput('');
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventText.trim() || !eventDate) return;
    onAddEvent(eventText.trim(), eventDate);
    setEventText('');
  };

  const handleBacklogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backlogInput.trim()) return;
    onAddBacklog(backlogInput.trim());
    setBacklogInput('');
  };

  const handleMoveToToday = (id: string) => {
    const res = onMoveBacklogToToday(id);
    if (!res.ok) {
      setLimitFeedback(res.error ?? 'La lista de Hoy ya está llena (5/5).');
      return;
    }
    setLimitFeedback(null);
  };

  const handleRequestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted' && todayEvents.length > 0) {
      new Notification('DALE!! - Tenés fechas clave hoy:', {
        body: todayEvents.map((ev) => `• ${ev.text}`).join('\n'),
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* DALE!! Signature Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-white pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded bg-black border border-zinc-700 font-display text-lg font-black italic text-white select-none">
            D!!
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white">
              DALE!!
            </h1>
            <p className="text-xs text-zinc-400">
              Organizador diario · {dateLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {notifPermission !== 'unsupported' && notifPermission !== 'granted' && (
            <button
              type="button"
              onClick={handleRequestNotifications}
              className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-[#121212] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-white hover:text-white cursor-pointer whitespace-nowrap"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Activar avisos</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-[#121212] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-white hover:text-white cursor-pointer whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar JSON</span>
          </button>
          <label className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-[#121212] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-white hover:text-white cursor-pointer whitespace-nowrap">
            <Upload className="h-3.5 w-3.5" />
            <span>Importar</span>
            <input
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Inline Alert for Today's Key Events or 5-Task Limit */}
      {todayEvents.length > 0 && (
        <div className="rounded border border-white/25 bg-white/10 px-4 py-3 text-xs text-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="font-semibold">Fechas clave para hoy:</span>
            <span className="text-zinc-200">
              {todayEvents.map((e) => e.text).join(' · ')}
            </span>
          </div>
        </div>
      )}

      {limitFeedback && (
        <div className="rounded border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between gap-4">
          <span>{limitFeedback}</span>
          <button
            type="button"
            onClick={() => setLimitFeedback(null)}
            className="text-amber-300 hover:text-white underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Three Core DALE!! Sections in Balanced Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 1. PRIORIDADES DE HOY (MAX 5) */}
        <section className="rounded border border-[#262626] bg-[#121212] p-5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold tracking-widest uppercase text-zinc-400">
              Hoy (Máximo 5)
            </h2>
            <span className="font-mono-tabular text-xs border border-[#262626] bg-black px-2 py-0.5 rounded text-zinc-300">
              {todayTasks.length} / 5
            </span>
          </div>

          <form onSubmit={handleTodaySubmit} className="flex gap-2">
            <input
              type="text"
              value={todayInput}
              onChange={(e) => setTodayInput(e.target.value)}
              placeholder="Tarea clave para hoy..."
              autoComplete="off"
              className="flex-1 min-w-0 rounded border border-[#262626] bg-black px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-white focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Agregar tarea para hoy"
              className="rounded bg-white px-3.5 py-2 text-sm font-black text-black hover:opacity-85 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>

          {todayTasks.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500 border border-dashed border-[#262626] rounded">
              Agrega tus 5 prioridades clave para hoy.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {todayTasks.map((t) => {
                const isActive = t.id === activeTaskId;
                return (
                  <li
                    key={t.id}
                    className={`flex items-center justify-between gap-2 rounded border px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'border-white/50 bg-[#1c1c1c]'
                        : 'border-[#262626] bg-black/50 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTodayTask(t.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          t.done
                            ? 'border-zinc-600 bg-zinc-700 text-black'
                            : 'border-zinc-500'
                        }`}
                      >
                        {t.done && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span
                        className={`truncate transition-colors ${
                          t.done ? 'line-through text-[#555555]' : 'text-zinc-100'
                        }`}
                      >
                        {t.text}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!t.done && (
                        <button
                          type="button"
                          onClick={() => onFocusTaskInPomodoro(t.id)}
                          title="Enfocar esta tarea en Pomodoro"
                          className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:border-white hover:text-white cursor-pointer"
                        >
                          <Play className="h-2.5 w-2.5" />
                          <span>Pomodoro</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteTodayTask(t.id)}
                        aria-label={`Eliminar ${t.text}`}
                        className="p-1 text-zinc-500 hover:text-white cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {todayTasks.some((t) => t.done) && (
            <button
              type="button"
              onClick={onClearDoneTasks}
              className="self-start text-xs text-zinc-400 underline hover:text-white cursor-pointer"
            >
              Limpiar tareas tachadas
            </button>
          )}
        </section>

        {/* 2. FECHAS CLAVE / AGENDA */}
        <section className="rounded border border-[#262626] bg-[#121212] p-5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold tracking-widest uppercase text-zinc-400">
              Fechas Clave / Agenda
            </h2>
            <span className="font-mono-tabular text-xs text-zinc-500">
              {sortedEvents.length}
            </span>
          </div>

          <form onSubmit={handleEventSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
              placeholder="Vencimiento, reunión, fecha..."
              required
              autoComplete="off"
              className="w-full rounded border border-[#262626] bg-black px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-white focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="flex-1 rounded border border-[#262626] bg-black px-3 py-2 text-sm text-zinc-100 [color-scheme:dark] focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Agregar fecha clave"
                className="rounded bg-white px-4 py-2 text-sm font-black text-black hover:opacity-85 cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </form>

          {sortedEvents.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500 border border-dashed border-[#262626] rounded">
              Sin fechas clave registradas.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {sortedEvents.map((ev) => {
                const isToday = ev.date === todayStr;
                const isPast = ev.date < todayStr;
                return (
                  <li
                    key={ev.id}
                    className={`flex items-center justify-between gap-2 rounded border px-3 py-2.5 text-sm ${
                      isToday
                        ? 'border-white/50 bg-[#1a1a1a]'
                        : 'border-[#262626] bg-black/50 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span
                        className={`font-mono-tabular text-[11px] px-2 py-0.5 rounded shrink-0 ${
                          isToday
                            ? 'bg-white text-black font-bold'
                            : isPast
                            ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                            : 'bg-[#222222] text-zinc-300 border border-[#333333]'
                        }`}
                      >
                        {isToday ? 'HOY' : ev.date}
                      </span>
                      <span
                        className={`truncate ${
                          isPast ? 'text-zinc-500' : 'text-zinc-100'
                        }`}
                      >
                        {ev.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteEvent(ev.id)}
                      aria-label={`Eliminar evento ${ev.text}`}
                      className="p-1 text-zinc-500 hover:text-white cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 3. CAJÓN DE PENDIENTES */}
        <section className="rounded border border-[#262626] bg-[#121212] p-5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold tracking-widest uppercase text-zinc-400">
              Cajón de Pendientes
            </h2>
            <span className="font-mono-tabular text-xs text-zinc-500">
              {backlog.length}
            </span>
          </div>

          <form onSubmit={handleBacklogSubmit} className="flex gap-2">
            <input
              type="text"
              value={backlogInput}
              onChange={(e) => setBacklogInput(e.target.value)}
              placeholder="Anotar para no olvidar..."
              autoComplete="off"
              className="flex-1 min-w-0 rounded border border-[#262626] bg-black px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-white focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Agregar al cajón de pendientes"
              className="rounded bg-white px-3.5 py-2 text-sm font-black text-black hover:opacity-85 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>

          {backlog.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500 border border-dashed border-[#262626] rounded">
              Captura ideas o pendientes secundarios aquí.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {backlog.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded border border-[#262626] bg-black/50 px-3 py-2.5 text-sm hover:bg-[#1a1a1a]"
                >
                  <span className="truncate text-zinc-200 flex-1 min-w-0">
                    {item.text}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveToToday(item.id)}
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white cursor-pointer whitespace-nowrap"
                    >
                      <ArrowUp className="h-3 w-3" />
                      <span>Pasar a Hoy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteBacklog(item.id)}
                      aria-label={`Eliminar ${item.text}`}
                      className="p-1 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
