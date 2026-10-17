import React from 'react';
import { ReaderSettings, ReadingTheme, ReadingMode, FontFamily } from '../../types/book';
import { X, Moon, Sun, BookText, AlignJustify, ScrollText, BookOpen, RefreshCw } from 'lucide-react';
import { APP_VERSION, APP_BUILD_DESC, forceUpdateApp } from '../../utils/cacheManager';

interface SettingsModalProps {
  isOpen: boolean;
  settings: ReaderSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const themes: { id: ReadingTheme; label: string; bg: string; color: string; border: string }[] = [
    { id: 'charcoal', label: '달빛 차콜', bg: '#151618', color: '#d4d4d8', border: '#2a2c31' },
    { id: 'oled', label: '심야 올레드', bg: '#000000', color: '#b5b5b5', border: '#1a1a1a' },
    { id: 'sepia', label: '편안한 세피아', bg: '#211d19', color: '#ded4c6', border: '#383129' },
    { id: 'linen', label: '소프트 린넨', bg: '#f2efe9', color: '#2d2a26', border: '#cfc9bd' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface)',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          borderBottom: 'none',
          padding: '20px 20px calc(var(--safe-bottom) + 24px)',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
            뷰어 환경설정
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* 1. 저자극 야간 테마 선택 */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            배경 색상 (눈부심 방지)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {themes.map((th) => {
              const isSelected = settings.theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => onUpdateSettings({ theme: th.id })}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: th.bg,
                    color: th.color,
                    border: isSelected ? '2px solid var(--accent)' : `1px solid ${th.border}`,
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: isSelected ? '0 0 10px var(--accent-soft)' : 'none'
                  }}
                >
                  {th.id === 'charcoal' || th.id === 'oled' ? (
                    <Moon size={14} />
                  ) : th.id === 'linen' ? (
                    <Sun size={14} />
                  ) : (
                    <BookText size={14} />
                  )}
                  {th.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 글자 크기 조절 (A- / A+) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>글자 크기</span>
            <span>{settings.fontSize}px</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => onUpdateSettings({ fontSize: Math.max(13, settings.fontSize - 1) })}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              A-
            </button>
            <input
              type="range"
              min="13"
              max="28"
              step="1"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <button
              onClick={() => onUpdateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              A+
            </button>
          </div>
        </div>

        {/* 3. 줄 간격 및 글꼴 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              줄 간격 ({settings.lineHeight})
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1.65, 1.85, 2.1].map((lh) => (
                <button
                  key={lh}
                  onClick={() => onUpdateSettings({ lineHeight: lh })}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: settings.lineHeight === lh ? 'var(--accent)' : 'var(--bg-surface-elevated)',
                    color: settings.lineHeight === lh ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {lh === 1.65 ? '좁게' : lh === 1.85 ? '보통' : '넓게'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              글꼴 스타일
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['pretendard', 'serif'] as FontFamily[]).map((f) => (
                <button
                  key={f}
                  onClick={() => onUpdateSettings({ fontFamily: f })}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: settings.fontFamily === f ? 'var(--accent)' : 'var(--bg-surface-elevated)',
                    color: settings.fontFamily === f ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontFamily: f === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)',
                    fontWeight: 500
                  }}
                >
                  {f === 'serif' ? '바탕체(명조)' : '고딕체'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. 보기 모드 (스크롤 vs 페이징) */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            독서 방식
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onUpdateSettings({ mode: 'scroll' })}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: settings.mode === 'scroll' ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                border: settings.mode === 'scroll' ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                color: settings.mode === 'scroll' ? 'var(--accent-text)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <ScrollText size={16} /> 세로 연속 스크롤
            </button>
            <button
              onClick={() => onUpdateSettings({ mode: 'paging' })}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: settings.mode === 'paging' ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                border: settings.mode === 'paging' ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                color: settings.mode === 'paging' ? 'var(--accent-text)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <BookOpen size={16} /> 좌우 페이징 넘김
            </button>
          </div>
        </div>

        {/* 5. 앱 버전 및 캐시 강제 갱신 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}
        >
          <span>버전: {APP_VERSION} ({APP_BUILD_DESC})</span>
          <button
            onClick={() => forceUpdateApp()}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={13} /> 최신 갱신
          </button>
        </div>
      </div>
    </div>
  );
};
