import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Book, Volume, ReaderSettings } from '../../types/book';
import { useReader } from '../../hooks/useReader';
import { useTTS } from '../../hooks/useTTS';
import { ReaderContent } from './ReaderContent';
import { ReaderToolbar } from './ReaderToolbar';
import { ChapterDrawer } from './ChapterDrawer';
import { SettingsModal } from './SettingsModal';
import { paginateText, getPaginationCacheKey, TextPage } from '../../utils/paginator';
import { saveActiveSession } from '../../services/sessionStore';
import * as db from '../../services/db';

interface ReaderViewProps {
  book: Book;
  volume: Volume;
  allVolumes: Volume[];
  settings: ReaderSettings;
  onBackToLibrary: () => void;
  onVolumeChange: (nextVolume: Volume) => void;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  book,
  volume,
  allVolumes,
  settings,
  onBackToLibrary,
  onVolumeChange,
  onUpdateSettings
}) => {
  const isPaging = settings.mode === 'paging';
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [chapterDrawerOpen, setChapterDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // [핵심] 현재 페이지 인덱스 (0-indexed)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    return isPaging && volume.lastReadParagraphIndex ? volume.lastReadParagraphIndex : 0;
  });

  const {
    paragraphs,
    chapters,
    loading,
    progress: scrollProgress,
    currentParagraphIndex,
    containerRef,
    handleScroll,
    scrollToParagraph,
    prevVolume,
    nextVolume,
    goToPrevVolume,
    goToNextVolume
  } = useReader({
    book,
    volume,
    allVolumes,
    mode: settings.mode,
    onVolumeChange
  });

  // [핵심] 순수 DOM 텍스트 분할: 현재 화면 크기에 맞게 페이지 단위로 분할
  const [pages, setPages] = useState<TextPage[]>([{ pageIndex: 0, paragraphs: [] }]);

  const updatePagination = useCallback(() => {
    if (!isPaging || paragraphs.length === 0) return;

    const width = window.innerWidth;
    // 상단/하단 여백 및 툴바 영역 고려한 가용 높이
    const height = window.innerHeight - 70;
    const fontFamilyCss =
      settings.fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)';

    const cacheKey = getPaginationCacheKey(
      volume.id,
      width,
      height,
      settings.fontSize,
      settings.lineHeight
    );

    const calculatedPages = paginateText(
      paragraphs,
      width,
      height,
      settings.fontSize,
      settings.lineHeight,
      settings.sidePadding,
      fontFamilyCss,
      cacheKey
    );

    setPages(calculatedPages);
  }, [paragraphs, isPaging, volume.id, settings.fontSize, settings.lineHeight, settings.sidePadding, settings.fontFamily]);

  useEffect(() => {
    updatePagination();
    const handleResize = () => updatePagination();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePagination]);

  const totalPages = pages.length;

  // 페이징 모드 진행률 (%)
  const pagingProgress = useMemo(() => {
    if (totalPages <= 1) return 0;
    return Math.min(100, Math.round((currentPage / (totalPages - 1)) * 100));
  }, [currentPage, totalPages]);

  const activeProgress = isPaging ? pagingProgress : scrollProgress;

  // 페이징 모드 페이지 변경 시 세션 실시간 저장
  useEffect(() => {
    if (isPaging && !loading) {
      saveActiveSession({
        bookId: book.id,
        volumeId: volume.id,
        bookTitle: book.title,
        volumeTitle: volume.title,
        paragraphIndex: currentPage,
        scrollOffset: 0,
        progressPercent: pagingProgress,
        timestamp: Date.now()
      });
      db.updateVolumeProgress(volume.id, pagingProgress, currentPage, 0);
    }
  }, [currentPage, isPaging, loading, pagingProgress, book, volume]);

  // 페이지 넘김 핸들러 (오차 0px, 순식간에 다음 페이지 텍스트로 교체)
  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  // [핵심] 안드로이드 내장 무료 TTS 음성 낭독 훅 연동
  const activePageParagraphs = useMemo(() => {
    return isPaging ? pages[currentPage]?.paragraphs || [] : paragraphs;
  }, [isPaging, pages, currentPage, paragraphs]);

  const { isTtsPlaying, activeTtsParagraphIndex, toggleTts } = useTTS({
    paragraphs: activePageParagraphs,
    currentPage: isPaging ? currentPage : 0,
    totalPages: isPaging ? totalPages : 1,
    rate: settings.ttsRate || 1.0,
    bookTitle: book.title,
    volumeTitle: volume.title,
    onNextPage: handleNextPage,
    onPrevPage: handlePrevPage
  });

  // 하단 진행 슬라이더 조작 시 점프
  const handleSeekProgress = useCallback(
    (targetPercent: number) => {
      if (isPaging) {
        const target = Math.round((targetPercent / 100) * (totalPages - 1));
        setCurrentPage(Math.max(0, Math.min(totalPages - 1, target)));
      } else {
        if (!containerRef.current) return;
        const maxScroll = Math.max(1, containerRef.current.scrollHeight - containerRef.current.clientHeight);
        containerRef.current.scrollTop = (targetPercent / 100) * maxScroll;
      }
    },
    [isPaging, totalPages, containerRef]
  );

  // 목차에서 특정 문단 선택 시 페이징 모드 점프
  const handleSelectChapter = useCallback(
    (paraIndex: number) => {
      if (isPaging) {
        // 해당 문단이 포함된 페이지 탐색
        const targetPara = paragraphs[paraIndex];
        const pageIdx = pages.findIndex((pg) => pg.paragraphs.includes(targetPara));
        if (pageIdx !== -1) {
          setCurrentPage(pageIdx);
        } else {
          // 비율로 추정
          const ratio = paraIndex / Math.max(1, paragraphs.length);
          setCurrentPage(Math.round(ratio * (totalPages - 1)));
        }
      } else {
        scrollToParagraph(paraIndex);
      }
    },
    [isPaging, pages, paragraphs, totalPages, scrollToParagraph]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden'
      }}
    >
      {/* 화면 최상단 미니멀 진행도 라인 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2.5px',
          backgroundColor: 'transparent',
          zIndex: 600,
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            width: `${activeProgress}%`,
            height: '100%',
            backgroundColor: 'var(--accent)',
            transition: 'width 0.15s ease'
          }}
        />
      </div>

      {/* 본문 독서 영역 - 현재 페이지만 정확히 렌더링! */}
      <ReaderContent
        paragraphs={paragraphs}
        pageParagraphs={pages[currentPage]?.paragraphs}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        settings={settings}
        containerRef={containerRef}
        activeTtsParagraphIndex={activeTtsParagraphIndex}
        isTtsPlaying={isTtsPlaying}
        onScroll={handleScroll}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        onToggleToolbar={() => setToolbarVisible((prev) => !prev)}
      />

      {/* 상/하단 툴바 (상단 30% 터치 시 토글 + TTS 재생/일시정지 버튼 포함) */}
      <ReaderToolbar
        isVisible={toolbarVisible}
        book={book}
        volume={volume}
        progress={activeProgress}
        hasPrevVolume={!!prevVolume}
        hasNextVolume={!!nextVolume}
        isTtsPlaying={isTtsPlaying}
        onToggleTts={toggleTts}
        onBackToLibrary={onBackToLibrary}
        onOpenChapters={() => setChapterDrawerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onPrevVolume={goToPrevVolume}
        onNextVolume={goToNextVolume}
        onSeekProgress={handleSeekProgress}
      />

      {/* 목차(TOC) 서랍 */}
      <ChapterDrawer
        isOpen={chapterDrawerOpen}
        chapters={chapters}
        currentParagraphIndex={currentParagraphIndex}
        onClose={() => setChapterDrawerOpen(false)}
        onSelectChapter={handleSelectChapter}
      />

      {/* 뷰어 환경설정 모달 */}
      <SettingsModal
        isOpen={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
};
