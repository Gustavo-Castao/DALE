import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import type {
  AppTab,
  BacklogItem,
  DailyStat,
  KeyEvent,
  LofiPreferences,
  PomodoroMode,
  PomodoroSettings,
  SessionRecord,
  TodayTask,
} from './types';
import {
  STORAGE_KEYS,
  createId,
  getLocalDateStr,
  loadBacklog,
  loadDailyStats,
  loadKeyEvents,
  loadLofiPrefs,
  loadSessions,
  loadSettings,
  loadTodayTasks,
  saveBacklog,
  saveDailyStats,
  saveKeyEvents,
  saveLofiPrefs,
  saveSessions,
  saveSettings,
  saveTodayTasks,
} from './utils/storage';
import { focusAudio } from './utils/soundEngine';
import { PomodoroView } from './components/PomodoroView';
import { DaleOrganizerView } from './components/DaleOrganizerView';
import { StatsView } from './components/StatsView';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_PAGE_TITLE = 'DALE!! Focus — Pomodoro, Lo-Fi & Organizador';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('pomodoro');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persisted State
  const [settings, setSettings] = useState<PomodoroSettings>(() => loadSettings());
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>(() => loadTodayTasks());
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>(() => loadKeyEvents());
  const [backlog, setBacklog] = useState<BacklogItem[]>(() => loadBacklog());
  const [dailyStats, setDailyStats] = useState<DailyStat[]>(() => loadDailyStats());
  const [sessions, setSessions] = useState<SessionRecord[]>(() => loadSessions());
  const [lofiPrefs, setLofiPrefs] = useState<LofiPreferences>(() => loadLofiPrefs());
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_TASK_ID);
    } catch {
      return null;
    }
  });

  // Timer State
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(
    () => loadSettings().focusMinutes * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  const endTimestampRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Persist changes
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveTodayTasks(todayTasks), [todayTasks]);
  useEffect(() => saveKeyEvents(keyEvents), [keyEvents]);
  useEffect(() => saveBacklog(backlog), [backlog]);
  useEffect(() => saveDailyStats(dailyStats), [dailyStats]);
  useEffect(() => saveSessions(sessions), [sessions]);
  useEffect(() => saveLofiPrefs(lofiPrefs), [lofiPrefs]);
  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TASK_ID, activeTaskId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TASK_ID);
    }
  }, [activeTaskId]);

  const getDurationForMode = useCallback(
    (targetMode: PomodoroMode, cfg: PomodoroSettings = settings): number => {
      if (targetMode === 'focus') return cfg.focusMinutes * 60;
      if (targetMode === 'shortBreak') return cfg.shortBreakMinutes * 60;
      return cfg.longBreakMinutes * 60;
    },
    [settings]
  );

  const handleSessionComplete = useCallback(
    (finishedMode: PomodoroMode, skipped = false) => {
      setIsRunning(false);
      endTimestampRef.current = null;

      if (!skipped) {
        focusAudio.playAlarm(settings.alarmSound, settings.alarmVolume);

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification(
            finishedMode === 'focus'
              ? '¡Pomodoro completado!'
              : '¡Descanso terminado!',
            {
              body:
                finishedMode === 'focus'
                  ? 'Es momento de tomar una pausa.'
                  : 'Volvamos a enfocarnos.',
            }
          );
        }
      }

      if (finishedMode === 'focus') {
        const nextCycles = completedCycles + 1;
        if (!skipped) {
          setCompletedCycles(nextCycles);
          const todayStr = getLocalDateStr();
          const mins = settings.focusMinutes;
          const activeTask = todayTasks.find((t) => t.id === activeTaskId) ?? null;

          // Update task pomodoro count
          if (activeTask) {
            setTodayTasks((prev) =>
              prev.map((t) =>
                t.id === activeTask.id
                  ? { ...t, pomodoros: (t.pomodoros || 0) + 1 }
                  : t
              )
            );
          }

          // Update daily stats
          setDailyStats((prev) => {
            const existing = prev.find((d) => d.date === todayStr);
            if (existing) {
              return prev.map((d) =>
                d.date === todayStr
                  ? {
                      ...d,
                      pomodoros: d.pomodoros + 1,
                      minutes: d.minutes + mins,
                    }
                  : d
              );
            }
            return [...prev, { date: todayStr, pomodoros: 1, minutes: mins }];
          });

          // Prepend session log
          setSessions((prev) => [
            {
              id: createId(),
              mode: 'focus',
              durationMinutes: mins,
              taskText: activeTask ? activeTask.text : null,
              completedAt: new Date().toISOString(),
            },
            ...prev.slice(0, 99),
          ]);

          showToast(`Bloque de ${mins} min completado.`);
        }

        const isLongBreak =
          (skipped ? completedCycles + 1 : nextCycles) %
            settings.longBreakInterval ===
          0;
        const nextMode: PomodoroMode = isLongBreak ? 'longBreak' : 'shortBreak';
        const nextDuration = getDurationForMode(nextMode);
        setMode(nextMode);
        setSecondsLeft(nextDuration);
        if (!skipped && settings.autoStartBreaks) {
          endTimestampRef.current = Date.now() + nextDuration * 1000;
          setIsRunning(true);
        }
      } else {
        const nextDuration = getDurationForMode('focus');
        setMode('focus');
        setSecondsLeft(nextDuration);
        if (!skipped && settings.autoStartPomodoros) {
          endTimestampRef.current = Date.now() + nextDuration * 1000;
          setIsRunning(true);
        }
      }
    },
    [
      activeTaskId,
      completedCycles,
      getDurationForMode,
      settings,
      showToast,
      todayTasks,
    ]
  );

  // Accurate timestamp-based tick
  useEffect(() => {
    if (!isRunning) {
      document.title = DEFAULT_PAGE_TITLE;
      return;
    }

    if (endTimestampRef.current === null) {
      endTimestampRef.current = Date.now() + secondsLeft * 1000;
    }

    const tick = () => {
      if (endTimestampRef.current === null) return;
      const remaining = Math.max(
        0,
        Math.ceil((endTimestampRef.current - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);

      const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
      const secs = String(remaining % 60).padStart(2, '0');
      const modeLabel =
        mode === 'focus'
          ? 'Enfoque'
          : mode === 'shortBreak'
          ? 'Descanso corto'
          : 'Descanso largo';
      document.title = `${mins}:${secs} — ${modeLabel} · DALE!!`;

      if (remaining <= 0) {
        handleSessionComplete(mode, false);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode, handleSessionComplete]);

  const handleToggleRun = () => {
    if (isRunning) {
      endTimestampRef.current = null;
      setIsRunning(false);
    } else {
      endTimestampRef.current = Date.now() + secondsLeft * 1000;
      setIsRunning(true);
    }
  };

  const handleSwitchMode = (nextMode: PomodoroMode) => {
    setIsRunning(false);
    endTimestampRef.current = null;
    setMode(nextMode);
    setSecondsLeft(getDurationForMode(nextMode));
  };

  const handleReset = () => {
    setIsRunning(false);
    endTimestampRef.current = null;
    setSecondsLeft(getDurationForMode(mode));
  };

  const handleSkip = () => {
    handleSessionComplete(mode, true);
  };

  const handleSaveSettings = (nextSettings: PomodoroSettings) => {
    setSettings(nextSettings);
    if (!isRunning) {
      setSecondsLeft(getDurationForMode(mode, nextSettings));
    }
    showToast('Configuración actualizada.');
  };

  // DALE!! Task Handlers
  const handleAddTodayTask = (text: string): { ok: boolean; error?: string } => {
    if (todayTasks.length >= 5) {
      return {
        ok: false,
        error:
          '¡Llegaste a las 5 prioridades! Cerrá o eliminá una para sumar otra.',
      };
    }
    const newTask: TodayTask = {
      id: createId(),
      text,
      done: false,
      pomodoros: 0,
      estPomodoros: 1,
    };
    setTodayTasks((prev) => [...prev, newTask]);
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
    return { ok: true };
  };

  const handleToggleTodayTask = (id: string) => {
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleDeleteTodayTask = (id: string) => {
    setTodayTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  };

  const handleClearDoneTasks = () => {
    setTodayTasks((prev) => {
      const next = prev.filter((t) => !t.done);
      if (activeTaskId && !next.some((t) => t.id === activeTaskId)) {
        setActiveTaskId(null);
      }
      return next;
    });
  };

  const handleAddEvent = (text: string, date: string) => {
    setKeyEvents((prev) => [...prev, { id: createId(), text, date }]);
  };

  const handleDeleteEvent = (id: string) => {
    setKeyEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleAddBacklog = (text: string) => {
    setBacklog((prev) => [...prev, { id: createId(), text }]);
  };

  const handleMoveBacklogToToday = (
    id: string
  ): { ok: boolean; error?: string } => {
    if (todayTasks.length >= 5) {
      return {
        ok: false,
        error: 'La lista de Hoy ya está llena (5/5).',
      };
    }
    const item = backlog.find((b) => b.id === id);
    if (!item) return { ok: false };
    setBacklog((prev) => prev.filter((b) => b.id !== id));
    const newTask: TodayTask = {
      id: createId(),
      text: item.text,
      done: false,
      pomodoros: 0,
      estPomodoros: 1,
    };
    setTodayTasks((prev) => [...prev, newTask]);
    return { ok: true };
  };

  const handleDeleteBacklog = (id: string) => {
    setBacklog((prev) => prev.filter((b) => b.id !== id));
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      dale_today: todayTasks,
      dale_events: keyEvents,
      dale_backlog: backlog,
      dale_pomo_settings: settings,
      dale_pomo_stats: dailyStats,
      dale_pomo_sessions: sessions,
      dale_lofi_prefs: lofiPrefs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dale-focus-backup-${getLocalDateStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Respaldo JSON descargado.');
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.dale_today)) setTodayTasks(data.dale_today);
        if (Array.isArray(data.dale_events)) setKeyEvents(data.dale_events);
        if (Array.isArray(data.dale_backlog)) setBacklog(data.dale_backlog);
        if (data.dale_pomo_settings) setSettings({ ...settings, ...data.dale_pomo_settings });
        if (Array.isArray(data.dale_pomo_stats)) setDailyStats(data.dale_pomo_stats);
        if (Array.isArray(data.dale_pomo_sessions)) setSessions(data.dale_pomo_sessions);
        if (data.dale_lofi_prefs) setLofiPrefs({ ...lofiPrefs, ...data.dale_lofi_prefs });
        showToast('Respaldo importado correctamente.');
      } catch {
        showToast('El archivo seleccionado no es un respaldo válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearStats = () => {
    setDailyStats([]);
    setSessions([]);
    showToast('Historial reiniciado.');
  };

  const bgAccent =
    settings.themeStyle === 'monochrome'
      ? 'bg-[#0b0b0d]'
      : mode === 'focus'
      ? 'bg-[#120d0d]'
      : mode === 'shortBreak'
      ? 'bg-[#0c1213]'
      : 'bg-[#0c1015]';

  return (
    <div
      className={`min-h-screen ${bgAccent} text-zinc-100 transition-colors duration-500 flex flex-col`}
    >
      {/* Top Bar Contract: Zone 1 Brand | Zone 2 Nav Links | Zone 3 1 Primary Action */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('pomodoro')}
            className="font-display text-lg font-black italic tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            DALE!! Focus
          </button>

          {/* Zone 2: Clean single-line navigation links */}
          <nav
            aria-label="Secciones principales"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {(
              [
                { id: 'pomodoro', label: 'Pomodoro' },
                { id: 'dale', label: 'Organizador DALE!!' },
                { id: 'stats', label: 'Estadísticas' },
              ] as const
            ).map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-white text-white'
                      : 'border-transparent text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Configuración</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <nav
          aria-label="Navegación móvil"
          className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-white/10 px-4 py-2 text-xs font-medium"
        >
          {(
            [
              { id: 'pomodoro', label: 'Pomodoro' },
              { id: 'dale', label: 'Organizador DALE!!' },
              { id: 'stats', label: 'Estadísticas' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`py-1 border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === item.id
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 sm:px-6 py-6 sm:py-8">
        {/* Keep PomodoroView mounted so YouTube / Lo-Fi audio continues uninterrupted across tabs */}
        <div className={activeTab === 'pomodoro' ? 'block' : 'hidden'}>
          <PomodoroView
            mode={mode}
            secondsLeft={secondsLeft}
            isRunning={isRunning}
            completedCycles={completedCycles}
            settings={settings}
            todayTasks={todayTasks}
            activeTaskId={activeTaskId}
            lofiPrefs={lofiPrefs}
            onSwitchMode={handleSwitchMode}
            onToggleRun={handleToggleRun}
            onReset={handleReset}
            onSkip={handleSkip}
            onSelectTask={(id) => setActiveTaskId(id)}
            onToggleTaskDone={handleToggleTodayTask}
            onAddTodayTask={handleAddTodayTask}
            onDeleteTodayTask={handleDeleteTodayTask}
            onClearDoneTasks={handleClearDoneTasks}
            onUpdateLofiPrefs={setLofiPrefs}
            onOpenDaleTab={() => setActiveTab('dale')}
          />
        </div>

        {activeTab === 'dale' && (
          <DaleOrganizerView
            todayTasks={todayTasks}
            keyEvents={keyEvents}
            backlog={backlog}
            activeTaskId={activeTaskId}
            onAddTodayTask={handleAddTodayTask}
            onToggleTodayTask={handleToggleTodayTask}
            onDeleteTodayTask={handleDeleteTodayTask}
            onClearDoneTasks={handleClearDoneTasks}
            onFocusTaskInPomodoro={(id) => {
              setActiveTaskId(id);
              setActiveTab('pomodoro');
            }}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddBacklog={handleAddBacklog}
            onMoveBacklogToToday={handleMoveBacklogToToday}
            onDeleteBacklog={handleDeleteBacklog}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView
            dailyStats={dailyStats}
            sessions={sessions}
            todayTasks={todayTasks}
            onClearStats={handleClearStats}
            onGoToPomodoro={() => setActiveTab('pomodoro')}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-white/10 py-4 px-4 sm:px-6 text-center text-xs text-zinc-500">
        DALE!! Focus · Tus tareas y tiempos se guardan localmente en este navegador.
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Non-blocking Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-lg border border-white/20 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white shadow-xl"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
