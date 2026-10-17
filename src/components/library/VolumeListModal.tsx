import React from 'react';
import { Book, Volume } from '../../types/book';
import { ArrowLeft, FileText, CheckCircle2, DownloadCloud, Check } from 'lucide-react';

interface VolumeListModalProps {
  book: Book;
  volumes: Volume[];
  loading: boolean;
  cachingProgress?: { total: number; done: number } | null;
  onClose: () => void;
  onSelectVolume: (volume: Volume) => void;
  onCacheAllOffline?: (bookId: string) => void;
}

export const VolumeListModal: React.FC<VolumeListModalProps> = ({
  book,
  volumes,
  loading,
  cachingProgress,
  onClose,
  onSelectVolume,
  onCacheAllOffline
}) => {
  const isCaching = Boolean(cachingProgress && cachingProgress.done < cachingProgress.total);
  const isCacheDone = Boolean(cachingProgress && cachingProgress.done === cachingProgress.total);

  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-primary)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 헤더 바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
          paddingTop: 'calc(var(--safe-top) + 16px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)'
            }}
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {book.title}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              총 {volumes.length}권의 텍스트
            </span>
          </div>
        </div>

        {onCacheAllOffline && (
          <button
            onClick={() => !isCaching && onCacheAllOffline(book.id)}
            disabled={isCaching}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isCacheDone ? 'rgba(74, 222, 128, 0.2)' : 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: isCacheDone ? '#4ade80' : 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            {isCaching && cachingProgress ? (
              <>
                <DownloadCloud size={15} className="animate-spin" />
                {cachingProgress.done}/{cachingProgress.total}권 저장 중
              </>
            ) : isCacheDone ? (
              <>
                <Check size={15} /> 전권 오프라인 저장됨
              </>
            ) : (
              <>
                <DownloadCloud size={15} /> 전권 오프라인 다운
              </>
            )}
          </button>
        )}
      </div>

      {/* 권별 목록 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            목록을 불러오는 중...
          </div>
        ) : volumes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            등록된 권이 없습니다.
          </div>
        ) : (
          volumes.map((vol) => {
            const hasRead = vol.lastReadProgress > 0;
            const isCompleted = vol.lastReadProgress >= 98;

            return (
              <div
                key={vol.id}
                onClick={() => onSelectVolume(vol)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isCompleted
                        ? 'rgba(74, 222, 128, 0.15)'
                        : hasRead
                        ? 'var(--accent-soft)'
                        : 'var(--bg-surface-elevated)',
                      color: isCompleted ? '#4ade80' : hasRead ? 'var(--accent)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {vol.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {(vol.sizeBytes / 1024).toFixed(0)} KB
                      {hasRead && ` · 읽음 ${Math.round(vol.lastReadProgress)}%`}
                    </div>
                  </div>
                </div>

                {hasRead && (
                  <div style={{ width: '60px', textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        height: '4px',
                        backgroundColor: 'var(--border-color)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${vol.lastReadProgress}%`,
                          height: '100%',
                          backgroundColor: isCompleted ? '#4ade80' : 'var(--accent)',
                          borderRadius: '2px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
