import React, { useEffect } from 'react';
import { Volume2, X } from 'lucide-react';
import type { AlarmSoundType, PomodoroSettings } from '../types';
import { focusAudio } from '../utils/soundEngine';

interface SettingsModalProps {
  isOpen: boolean;
  settings: PomodoroSettings;
  onClose: () => void;
  onSave: (next: PomodoroSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = React.useState<PomodoroSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...draft,
      focusMinutes: Math.max(1, Math.min(120, draft.focusMinutes || 25)),
      shortBreakMinutes: Math.max(1, Math.min(60, draft.shortBreakMinutes || 5)),
      longBreakMinutes: Math.max(1, Math.min(90, draft.longBreakMinutes || 15)),
      longBreakInterval: Math.max(2, Math.min(10, draft.longBreakInterval || 4)),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-white/15 bg-[#141417] p-6 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 id="settings-modal-title" className="text-lg font-bold text-white">
            Configuración del Temporizador
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configuración"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
          {/* Durations */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Duración (minutos)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5 text-xs text-zinc-300">
                <span>Pomodoro</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={draft.focusMinutes}
                  onChange={(e) =>
                    setDraft({ ...draft, focusMinutes: Number(e.target.value) })
                  }
                  className="font-mono-tabular rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-zinc-300">
                <span>Descanso corto</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draft.shortBreakMinutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      shortBreakMinutes: Number(e.target.value),
                    })
                  }
                  className="font-mono-tabular rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-zinc-300">
                <span>Descanso largo</span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={draft.longBreakMinutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      longBreakMinutes: Number(e.target.value),
                    })
                  }
                  className="font-mono-tabular rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </label>
            </div>
          </div>

          {/* Automation */}
          <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
            <label className="flex items-center justify-between gap-4 text-sm text-zinc-200 cursor-pointer">
              <span>Iniciar descansos automáticamente</span>
              <input
                type="checkbox"
                checked={draft.autoStartBreaks}
                onChange={(e) =>
                  setDraft({ ...draft, autoStartBreaks: e.target.checked })
                }
                className="h-4 w-4 accent-white cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-zinc-200 cursor-pointer">
              <span>Iniciar Pomodoros automáticamente</span>
              <input
                type="checkbox"
                checked={draft.autoStartPomodoros}
                onChange={(e) =>
                  setDraft({ ...draft, autoStartPomodoros: e.target.checked })
                }
                className="h-4 w-4 accent-white cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-zinc-200">
              <span>Intervalo de descanso largo (ciclos)</span>
              <input
                type="number"
                min={2}
                max={10}
                value={draft.longBreakInterval}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    longBreakInterval: Number(e.target.value),
                  })
                }
                className="font-mono-tabular w-20 rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-sm text-white text-right focus:border-white/40 focus:outline-none"
              />
            </label>
          </div>

          {/* Alarm Sound & Theme */}
          <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-zinc-200">Sonido de alarma</span>
              <div className="flex items-center gap-2">
                <select
                  value={draft.alarmSound}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      alarmSound: e.target.value as AlarmSoundType,
                    })
                  }
                  className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-white/40 focus:outline-none"
                >
                  <option value="bell">Campana cálida</option>
                  <option value="chime">Acorde suave</option>
                  <option value="digital">Pulso digital</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    focusAudio.playAlarm(draft.alarmSound, draft.alarmVolume)
                  }
                  title="Probar sonido"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white cursor-pointer"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Probar</span>
                </button>
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 text-sm text-zinc-200">
              <span>Volumen de alarma ({draft.alarmVolume}%)</span>
              <input
                type="range"
                min={0}
                max={100}
                value={draft.alarmVolume}
                onChange={(e) =>
                  setDraft({ ...draft, alarmVolume: Number(e.target.value) })
                }
                className="w-40 h-1.5 bg-zinc-700 rounded-lg cursor-pointer text-white"
              />
            </label>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-zinc-200">Estilo visual del temporizador</span>
              <select
                value={draft.themeStyle}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    themeStyle: e.target.value as 'pomofocus' | 'monochrome',
                  })
                }
                className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-white/40 focus:outline-none"
              >
                <option value="pomofocus">Pomofocus (Color por sesión)</option>
                <option value="monochrome">Monocromo DALE!!</option>
              </select>
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-white px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 cursor-pointer"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
