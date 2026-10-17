// 활성 세션(프로세스 메모리 상태 유지 및 즉시 복원) 및 리더 환경설정 스토어

import { ActiveSession, ReaderSettings } from '../types/book';

const SESSION_KEY = 'happytext_active_session';
const SETTINGS_KEY = 'happytext_reader_settings';

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.85,
  theme: 'charcoal',
  mode: 'scroll',
  fontFamily: 'pretendard',
  letterSpacing: -0.02,
  paragraphSpacing: 16,
  sidePadding: 20
};

// 1. 활성 세션 (Active Session)
let inMemorySession: ActiveSession | null = null;

export function saveActiveSession(session: ActiveSession): void {
  inMemorySession = { ...session, timestamp: Date.now() };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(inMemorySession));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(inMemorySession));
  } catch (e) {
    console.warn('세션 저장 실패 (스토리지 용량 초과 가능성):', e);
  }
}

export function getActiveSession(): ActiveSession | null {
  if (inMemorySession) {
    return inMemorySession;
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (raw) {
      inMemorySession = JSON.parse(raw);
      return inMemorySession;
    }
  } catch (e) {
    console.warn('세션 복원 실패:', e);
  }
  return null;
}

export function clearActiveSession(): void {
  inMemorySession = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

// 2. 리더 환경설정 (Reader Settings)
export function getReaderSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_SETTINGS;
}

export function saveReaderSettings(settings: Partial<ReaderSettings>): ReaderSettings {
  const current = getReaderSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}
