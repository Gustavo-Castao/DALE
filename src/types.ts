export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export type AlarmSoundType = 'bell' | 'chime' | 'digital';

export type AppTab = 'pomodoro' | 'dale' | 'stats';

export interface TodayTask {
  id: string;
  text: string;
  done: boolean;
  pomodoros: number;
  estPomodoros: number;
}

export interface KeyEvent {
  id: string;
  text: string;
  date: string; // YYYY-MM-DD
}

export interface BacklogItem {
  id: string;
  text: string;
}

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  alarmVolume: number; // 0 to 100
  alarmSound: AlarmSoundType;
  themeStyle: 'pomofocus' | 'monochrome';
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  pomodoros: number;
  minutes: number;
}

export interface SessionRecord {
  id: string;
  mode: PomodoroMode;
  durationMinutes: number;
  taskText: string | null;
  completedAt: string; // ISO string
}

export interface LofiTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  tag: string;
}

export interface LofiPreferences {
  selectedTrackId: string;
  ytVolume: number;
  autoPlayOnFocus: boolean;
}
