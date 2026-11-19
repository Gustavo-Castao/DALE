import type {
  BacklogItem,
  DailyStat,
  KeyEvent,
  LofiPreferences,
  LofiTrack,
  PomodoroSettings,
  SessionRecord,
  TodayTask,
} from '../types';

export const STORAGE_KEYS = {
  TODAY: 'dale_today',
  EVENTS: 'dale_events',
  BACKLOG: 'dale_backlog',
  ACTIVE_TASK_ID: 'dale_active_task_id',
  SETTINGS: 'dale_pomo_settings',
  STATS: 'dale_pomo_stats',
  SESSIONS: 'dale_pomo_sessions',
  LOFI_PREFS: 'dale_lofi_prefs',
} as const;

export const DEFAULT_LOFI_TRACKS: LofiTrack[] = [
  {
    id: 'alpha-waves-wpni',
    videoId: 'WPni755-Krg',
    title: 'Study Music Alpha Waves',
    artist: 'Yellow Brick Cinema',
    tag: 'Ondas Alfa · Concentración',
  },
  {
    id: 'lofi-girl-beats',
    videoId: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio',
    artist: 'Lofi Girl',
    tag: 'Beats para estudiar',
  },
  {
    id: 'chillhop-radio',
    videoId: '5yx6BWlEVcY',
    title: 'Chillhop Radio — Jazzy & Lofi',
    artist: 'Chillhop Music',
    tag: 'Jazzhop · Enfoque',
  },
];

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  alarmVolume: 70,
  alarmSound: 'bell',
  themeStyle: 'pomofocus',
};

export const DEFAULT_LOFI_PREFS: LofiPreferences = {
  selectedTrackId: 'alpha-waves-wpni',
  ytVolume: 65,
  autoPlayOnFocus: false,
};

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadTodayTasks(): TodayTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TODAY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      id: typeof item.id === 'string' ? item.id : createId(),
      text: String(item.text ?? ''),
      done: Boolean(item.done),
      pomodoros: typeof item.pomodoros === 'number' ? item.pomodoros : 0,
      estPomodoros: typeof item.estPomodoros === 'number' ? item.estPomodoros : 1,
    }));
  } catch {
    return [];
  }
}

export function saveTodayTasks(tasks: TodayTask[]): void {
  localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify(tasks));
}

export function loadKeyEvents(): KeyEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      id: typeof item.id === 'string' ? item.id : createId(),
      text: String(item.text ?? ''),
      date: String(item.date ?? getLocalDateStr()),
    }));
  } catch {
    return [];
  }
}

export function saveKeyEvents(events: KeyEvent[]): void {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

export function loadBacklog(): BacklogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BACKLOG);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      id: typeof item.id === 'string' ? item.id : createId(),
      text: String(item.text ?? ''),
    }));
  } catch {
    return [];
  }
}

export function saveBacklog(items: BacklogItem[]): void {
  localStorage.setItem(STORAGE_KEYS.BACKLOG, JSON.stringify(items));
}

export function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PomodoroSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadDailyStats(): DailyStat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDailyStats(stats: DailyStat[]): void {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function loadLofiPrefs(): LofiPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOFI_PREFS);
    if (!raw) return DEFAULT_LOFI_PREFS;
    const parsed = JSON.parse(raw);
    const validIds = new Set(DEFAULT_LOFI_TRACKS.map((t) => t.id));
    return {
      selectedTrackId:
        typeof parsed.selectedTrackId === 'string' &&
        validIds.has(parsed.selectedTrackId)
          ? parsed.selectedTrackId
          : DEFAULT_LOFI_PREFS.selectedTrackId,
      ytVolume:
        typeof parsed.ytVolume === 'number'
          ? parsed.ytVolume
          : DEFAULT_LOFI_PREFS.ytVolume,
      autoPlayOnFocus: Boolean(parsed.autoPlayOnFocus),
    };
  } catch {
    return DEFAULT_LOFI_PREFS;
  }
}

export function saveLofiPrefs(prefs: LofiPreferences): void {
  localStorage.setItem(STORAGE_KEYS.LOFI_PREFS, JSON.stringify(prefs));
}
