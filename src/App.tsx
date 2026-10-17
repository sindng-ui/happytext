import React, { useState, useEffect, useCallback } from 'react';
import { Book, Volume, ReaderSettings } from './types/book';
import { useLibrary } from './hooks/useLibrary';
import {
  getActiveSession,
  saveActiveSession,
  getReaderSettings,
  saveReaderSettings
} from './services/sessionStore';
import * as db from './services/db';
import { LibraryView } from './components/library/LibraryView';
import { ReaderView } from './components/reader/ReaderView';

export const App: React.FC = () => {
  const {
    books,
    loading: loadingBooks,
    selectedBook,
    volumes,
    loadingVolumes,
    cachingProgress,
    selectBook,
    cacheAllVolumesOffline,
    addNewBook,
    updateBookTitle,
    removeBook
  } = useLibrary();

  // 리더 환경설정 상태
  const [settings, setSettings] = useState<ReaderSettings>(getReaderSettings);

  // 현재 열려있는 리더 상태 (null이면 도서관 화면)
  const [currentReading, setCurrentReading] = useState<{
    book: Book;
    volume: Volume;
    allVolumes: Volume[];
  } | null>(null);

  // 활성 세션 정보
  const [activeSession, setActiveSession] = useState(getActiveSession);

  // 테마 변경 시 body data-theme 동기화
  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // 1. [요구사항 2] 앱 최초 실행/새로고침 시 프로세스 세션 자동 복원 (보던 거 그대로 표시)
  useEffect(() => {
    async function restoreSession() {
      const session = getActiveSession();
      if (!session) return;

      try {
        const allBooks = await db.getAllBooks();
        const targetBook = allBooks.find((b) => b.id === session.bookId);
        if (!targetBook) return;

        const vols = await db.getVolumesByBook(targetBook.id);
        const targetVol = vols.find((v) => v.id === session.volumeId);
        if (!targetVol) return;

        // 보던 화면으로 즉각 진입!
        setCurrentReading({
          book: targetBook,
          volume: targetVol,
          allVolumes: vols
        });
      } catch (e) {
        console.warn('활성 세션 자동 복원 실패:', e);
      }
    }

    if (!loadingBooks) {
      restoreSession();
    }
  }, [loadingBooks]);

  // 권 선택하여 독서 뷰어 진입
  const handleSelectVolume = useCallback(
    async (book: Book, volume: Volume) => {
      let vols = volumes;
      if (vols.length === 0 || vols[0].bookId !== book.id) {
        vols = await db.getVolumesByBook(book.id);
      }

      setCurrentReading({
        book,
        volume,
        allVolumes: vols
      });

      // 세션 갱신
      saveActiveSession({
        bookId: book.id,
        volumeId: volume.id,
        bookTitle: book.title,
        volumeTitle: volume.title,
        paragraphIndex: volume.lastReadParagraphIndex || 0,
        scrollOffset: volume.lastReadScrollOffset || 0,
        progressPercent: volume.lastReadProgress || 0,
        timestamp: Date.now()
      });
      setActiveSession(getActiveSession());
    },
    [volumes]
  );

  // 도서관으로 복귀
  const handleBackToLibrary = useCallback(() => {
    setCurrentReading(null);
    selectBook(null);
    setActiveSession(getActiveSession());
  }, [selectBook]);

  // 다음 권 / 이전 권 전환
  const handleVolumeChange = useCallback(
    (nextVol: Volume) => {
      if (!currentReading) return;
      setCurrentReading({
        ...currentReading,
        volume: nextVol
      });
      saveActiveSession({
        bookId: currentReading.book.id,
        volumeId: nextVol.id,
        bookTitle: currentReading.book.title,
        volumeTitle: nextVol.title,
        paragraphIndex: nextVol.lastReadParagraphIndex || 0,
        scrollOffset: nextVol.lastReadScrollOffset || 0,
        progressPercent: nextVol.lastReadProgress || 0,
        timestamp: Date.now()
      });
      setActiveSession(getActiveSession());
    },
    [currentReading]
  );

  // 환경설정 업데이트
  const handleUpdateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = saveReaderSettings({ ...prev, ...newSettings });
      return updated;
    });
  }, []);

  // 도서관 배너에서 이어보기 버튼 클릭 시
  const handleResumeActiveSession = useCallback(async () => {
    const session = getActiveSession();
    if (!session) return;

    const allBooks = await db.getAllBooks();
    const targetBook = allBooks.find((b) => b.id === session.bookId);
    if (!targetBook) return;

    const vols = await db.getVolumesByBook(targetBook.id);
    const targetVol = vols.find((v) => v.id === session.volumeId);
    if (!targetVol) return;

    setCurrentReading({
      book: targetBook,
      volume: targetVol,
      allVolumes: vols
    });
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {currentReading ? (
        <ReaderView
          key={currentReading.volume.id}
          book={currentReading.book}
          volume={currentReading.volume}
          allVolumes={currentReading.allVolumes}
          settings={settings}
          onBackToLibrary={handleBackToLibrary}
          onVolumeChange={handleVolumeChange}
          onUpdateSettings={handleUpdateSettings}
        />
      ) : (
        <LibraryView
          books={books}
          loading={loadingBooks}
          activeSession={activeSession}
          selectedBook={selectedBook}
          volumes={volumes}
          loadingVolumes={loadingVolumes}
          cachingProgress={cachingProgress}
          onSelectBook={selectBook}
          onSelectVolume={handleSelectVolume}
          onAddNewBook={addNewBook}
          onUpdateBookTitle={updateBookTitle}
          onRemoveBook={removeBook}
          onResumeActiveSession={handleResumeActiveSession}
          onCacheAllOffline={cacheAllVolumesOffline}
        />
      )}
    </div>
  );
};
