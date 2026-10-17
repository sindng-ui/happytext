import React from 'react';
import { Volume, Book } from '../../types/book';
import { ArrowLeft, List, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReaderToolbarProps {
  isVisible: boolean;
  book: Book;
  volume: Volume;
  progress: number;
  hasPrevVolume: boolean;
  hasNextVolume: boolean;
  onBackToLibrary: () => void;
  onOpenChapters: () => void;
  onOpenSettings: () => void;
  onPrevVolume: () => void;
  onNextVolume: () => void;
  onSeekProgress?: (percent: number) => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  isVisible,
  book,
  volume,
  progress,
  hasPrevVolume,
  hasNextVolume,
  onBackToLibrary,
  onOpenChapters,
  onOpenSettings,
  onPrevVolume,
  onNextVolume,
  onSeekProgress
}) => {
  if (!isVisible) return null;

  return (
    <>
      {/* 1. 상단 네비게이션 툴바 */}
      <header
        className="animate-slide-down"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 400,
          padding: '12px 16px',
          paddingTop: 'calc(var(--safe-top) + 12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <button
            onClick={onBackToLibrary}
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
          >
            <ArrowLeft size={22} />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {book.title}
            </h2>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {volume.title}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onOpenChapters}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)'
            }}
            title="목차"
          >
            <List size={20} />
          </button>
          <button
            onClick={onOpenSettings}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)'
            }}
            title="설정"
          >
            <Sliders size={20} />
          </button>
        </div>
      </header>

      {/* 2. 하단 컨트롤 툴바 */}
      <footer
        className="animate-slide-up"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-color)',
          zIndex: 400,
          padding: '12px 20px calc(var(--safe-bottom) + 12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <button
            onClick={onPrevVolume}
            disabled={!hasPrevVolume}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: hasPrevVolume ? 'var(--bg-surface-elevated)' : 'transparent',
              color: hasPrevVolume ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 500,
              gap: '4px'
            }}
          >
            <ChevronLeft size={16} /> 이전 권
          </button>

          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {Math.round(progress)}%
          </span>

          <button
            onClick={onNextVolume}
            disabled={!hasNextVolume}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: hasNextVolume ? 'var(--bg-surface-elevated)' : 'transparent',
              color: hasNextVolume ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 500,
              gap: '4px'
            }}
          >
            다음 권 <ChevronRight size={16} />
          </button>
        </div>

        {onSeekProgress && (
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={progress}
            onChange={(e) => onSeekProgress(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
        )}
      </footer>
    </>
  );
};
