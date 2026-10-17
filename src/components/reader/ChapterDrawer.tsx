import React from 'react';
import { Chapter } from '../../types/book';
import { X, BookmarkCheck } from 'lucide-react';

interface ChapterDrawerProps {
  isOpen: boolean;
  chapters: Chapter[];
  currentParagraphIndex: number;
  onClose: () => void;
  onSelectChapter: (paragraphIndex: number) => void;
}

export const ChapterDrawer: React.FC<ChapterDrawerProps> = ({
  isOpen,
  chapters,
  currentParagraphIndex,
  onClose,
  onSelectChapter
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        zIndex: 500,
        display: 'flex',
        justifyContent: 'flex-start'
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          width: '82%',
          maxWidth: '340px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
          paddingTop: 'var(--safe-top)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookmarkCheck size={20} color="var(--accent)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
              목차 ({chapters.length})
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* 챕터 리스트 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {chapters.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              감지된 챕터가 없습니다.
            </div>
          ) : (
            chapters.map((ch, idx) => {
              const isCurrent =
                idx === chapters.length - 1
                  ? currentParagraphIndex >= ch.paragraphIndex
                  : currentParagraphIndex >= ch.paragraphIndex &&
                    currentParagraphIndex < chapters[idx + 1].paragraphIndex;

              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    onSelectChapter(ch.paragraphIndex);
                    onClose();
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isCurrent ? 'var(--accent-soft)' : 'transparent',
                    color: isCurrent ? 'var(--accent-text)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isCurrent ? 600 : 400,
                    marginBottom: '4px',
                    borderLeft: isCurrent ? '3px solid var(--accent)' : '3px solid transparent'
                  }}
                >
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ch.title}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
