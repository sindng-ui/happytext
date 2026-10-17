import React, { useState, useEffect } from 'react';
import { Book, Volume, ActiveSession } from '../../types/book';
import { BookCard } from './BookCard';
import { BookEditModal } from './BookEditModal';
import { VolumeListModal } from './VolumeListModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Plus, BookOpen, Sparkles, Play, Download, Smartphone, RefreshCw } from 'lucide-react';
import { APP_VERSION, forceUpdateApp } from '../../utils/cacheManager';

interface LibraryViewProps {
  books: Book[];
  loading: boolean;
  activeSession: ActiveSession | null;
  selectedBook: Book | null;
  volumes: Volume[];
  loadingVolumes: boolean;
  cachingProgress?: { total: number; done: number } | null;
  onSelectBook: (book: Book | null) => void;
  onSelectVolume: (book: Book, volume: Volume) => void;
  onAddNewBook: (title: string, files: File[]) => Promise<any>;
  onUpdateBookTitle: (bookId: string, newTitle: string) => Promise<void>;
  onRemoveBook: (bookId: string) => Promise<void>;
  onResumeActiveSession: () => void;
  onCacheAllOffline?: (bookId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  loading,
  activeSession,
  selectedBook,
  volumes,
  loadingVolumes,
  cachingProgress,
  onSelectBook,
  onSelectVolume,
  onAddNewBook,
  onUpdateBookTitle,
  onRemoveBook,
  onResumeActiveSession,
  onCacheAllOffline
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  // PWA 원클릭 앱 설치 프롬프트
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      {/* 서재 상단 헤더 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
          paddingTop: 'calc(var(--safe-top) + 16px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={22} color="var(--accent)" />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              HappyText 서재
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-text)',
                  fontWeight: 600
                }}
              >
                {APP_VERSION}
              </span>
              <button
                onClick={() => forceUpdateApp()}
                title="최신 버전으로 새로고침"
                style={{
                  padding: '2px 4px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <RefreshCw size={11} /> 갱신
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingBook(null);
            setIsAddModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <Plus size={16} /> 작품 추가
        </button>
      </header>

      {/* 본문 서재 컨텐츠 영역 */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* PWA 원터치 앱 설치 배너 */}
        {isInstallable && (
          <div
            className="animate-fade-in"
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--accent-soft)',
              border: '1px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Smartphone size={22} color="var(--accent)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  휴대폰에 앱으로 설치하기
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  오프라인(비행기 모드)에서도 단독 실행됩니다
                </div>
              </div>
            </div>

            <button
              onClick={handleInstallClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                flexShrink: 0
              }}
            >
              <Download size={15} /> 설치
            </button>
          </div>
        )}

        {/* 최근 읽던 작품 바로 이어보기 배너 */}
        {activeSession && (
          <div
            className="animate-fade-in"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer'
            }}
            onClick={onResumeActiveSession}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                <Sparkles size={14} /> 마지막으로 읽던 페이지
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {activeSession.bookTitle} · {activeSession.volumeTitle}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                진행도 {Math.round(activeSession.progressPercent)}% 이어서 읽기
              </div>
            </div>

            <button
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Play size={18} fill="#ffffff" style={{ marginLeft: '2px' }} />
            </button>
          </div>
        )}

        {/* 작품 목록 그리드 */}
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '12px'
            }}
          >
            내 작품 서재 ({books.length})
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              서재를 불러오는 중입니다...
            </div>
          ) : books.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <BookOpen size={36} color="var(--text-muted)" />
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                등록된 작품이 없습니다.
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                텍스트 파일 추가하기
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '14px'
              }}
            >
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onSelect={(b) => onSelectBook(b)}
                  onEdit={(b) => {
                    setEditingBook(b);
                    setIsAddModalOpen(true);
                  }}
                  onDelete={(b) => setDeletingBook(b)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 권별 목록 모달 */}
      {selectedBook && (
        <VolumeListModal
          book={selectedBook}
          volumes={volumes}
          loading={loadingVolumes}
          cachingProgress={cachingProgress}
          onClose={() => onSelectBook(null)}
          onSelectVolume={(vol) => onSelectVolume(selectedBook, vol)}
          onCacheAllOffline={onCacheAllOffline}
        />
      )}

      {/* 작품 추가 / 이름 수정 모달 */}
      <BookEditModal
        isOpen={isAddModalOpen}
        bookToEdit={editingBook}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBook(null);
        }}
        onSaveNew={async (title, files) => {
          await onAddNewBook(title, files);
        }}
        onSaveEdit={async (bookId, newTitle) => {
          await onUpdateBookTitle(bookId, newTitle);
        }}
      />

      {/* 작품 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={!!deletingBook}
        title="작품 삭제"
        message={`'${deletingBook?.title}' 작품과 포함된 모든 권 데이터를 서재에서 삭제하시겠습니까?`}
        confirmText="삭제하기"
        isDanger={true}
        onConfirm={async () => {
          if (deletingBook) {
            await onRemoveBook(deletingBook.id);
            setDeletingBook(null);
          }
        }}
        onCancel={() => setDeletingBook(null)}
      />
    </div>
  );
};
