// 독서 뷰어(Reader) 상태 동기화 및 네비게이션 훅

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume, Book, Chapter, ReadingMode } from '../types/book';
import * as db from '../services/db';
import { saveActiveSession } from '../services/sessionStore';

interface UseReaderProps {
  book: Book;
  volume: Volume;
  allVolumes: Volume[];
  mode?: ReadingMode;
  initialParagraphIndex?: number;
  initialScrollOffset?: number;
  onVolumeChange?: (nextVolume: Volume) => void;
}

export function useReader({
  book,
  volume,
  allVolumes,
  mode = 'scroll',
  initialParagraphIndex = 0,
  initialScrollOffset = 0,
  onVolumeChange
}: UseReaderProps) {
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(volume.lastReadProgress || 0);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(initialParagraphIndex);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredScrollRef = useRef(false);

  // 1. 본문 데이터 로드 (캐시 우선, 없으면 Worker 파싱)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setParagraphs([]);
    setChapters([]);
    hasRestoredScrollRef.current = false;

    async function loadVolumeContent() {
      try {
        const cached = await db.getContent(volume.id);
        if (cached && cached.paragraphs && cached.paragraphs.length > 0) {
          if (isMounted) {
            setParagraphs(cached.paragraphs);
            setChapters(cached.chapters || []);
            setLoading(false);
          }
          return;
        }

        const rawUrl = `/api/raw-book/묵향/${encodeURIComponent(volume.filename)}`;
        const res = await fetch(rawUrl);
        if (!res.ok) throw new Error(`파일 로드 실패: ${res.statusText}`);

        const buffer = await res.arrayBuffer();
        const worker = new Worker(new URL('../workers/textParser.worker.ts', import.meta.url), {
          type: 'module'
        });

        worker.postMessage({ id: volume.id, buffer }, [buffer]);
        worker.onmessage = async (e) => {
          if (!isMounted) {
            worker.terminate();
            return;
          }
          if (e.data.success) {
            const pars = e.data.paragraphs;
            const chs = e.data.chapters;
            setParagraphs(pars);
            setChapters(chs);
            setLoading(false);

            await db.saveContent({
              volumeId: volume.id,
              paragraphs: pars,
              chapters: chs,
              updatedAt: Date.now()
            });
          } else {
            console.error('워커 파싱 실패:', e.data.error);
            setLoading(false);
          }
          worker.terminate();
        };
      } catch (err) {
        console.error('본문 로드 에러:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadVolumeContent();

    return () => {
      isMounted = false;
    };
  }, [volume.id, volume.filename]);

  // 2. 초기 스크롤 위치 복원
  useEffect(() => {
    if (!loading && paragraphs.length > 0 && containerRef.current && !hasRestoredScrollRef.current) {
      hasRestoredScrollRef.current = true;
      const targetOffset = volume.lastReadScrollOffset || initialScrollOffset;
      if (targetOffset > 0) {
        if (mode === 'paging') {
          containerRef.current.scrollLeft = targetOffset;
        } else {
          containerRef.current.scrollTop = targetOffset;
        }
      }
    }
  }, [loading, paragraphs.length, volume.lastReadScrollOffset, initialScrollOffset, mode]);

  // 3. 스크롤 이벤트 핸들러 및 세션 실시간 저장
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || paragraphs.length === 0) return;

    let scrollPercent = 0;
    let scrollOffset = 0;
    let approxIndex = 0;

    if (mode === 'paging') {
      const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
      scrollOffset = el.scrollLeft;
      scrollPercent = Math.min(100, Math.max(0, (scrollOffset / maxScroll) * 100));
      approxIndex = Math.min(
        paragraphs.length - 1,
        Math.floor((scrollOffset / el.scrollWidth) * paragraphs.length)
      );
    } else {
      const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
      scrollOffset = el.scrollTop;
      scrollPercent = Math.min(100, Math.max(0, (scrollOffset / maxScroll) * 100));
      approxIndex = Math.min(
        paragraphs.length - 1,
        Math.floor((scrollOffset / el.scrollHeight) * paragraphs.length)
      );
    }

    setProgress(Math.round(scrollPercent * 10) / 10);
    setCurrentParagraphIndex(approxIndex);

    // 프로세스 및 로컬 세션 실시간 기록
    saveActiveSession({
      bookId: book.id,
      volumeId: volume.id,
      bookTitle: book.title,
      volumeTitle: volume.title,
      paragraphIndex: approxIndex,
      scrollOffset,
      progressPercent: scrollPercent,
      timestamp: Date.now()
    });

    // DB 볼륨 진행률 비동기 업데이트
    db.updateVolumeProgress(volume.id, scrollPercent, approxIndex, scrollOffset);
    db.saveBook({
      ...book,
      lastReadVolumeId: volume.id,
      lastReadVolumeTitle: volume.title,
      lastReadProgress: scrollPercent,
      lastReadAt: Date.now()
    });
  }, [book, volume, paragraphs.length, mode]);

  // 4. 특정 문단으로 즉시 점프
  const scrollToParagraph = useCallback((index: number) => {
    if (!containerRef.current) return;
    const targetEl = containerRef.current.querySelector(`[data-p-index="${index}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    }
  }, []);

  // 5. 이전 권 / 다음 권 이동
  const currentIndex = allVolumes.findIndex((v) => v.id === volume.id);
  const prevVolume = currentIndex > 0 ? allVolumes[currentIndex - 1] : null;
  const nextVolume = currentIndex >= 0 && currentIndex < allVolumes.length - 1 ? allVolumes[currentIndex + 1] : null;

  const goToPrevVolume = useCallback(() => {
    if (prevVolume && onVolumeChange) {
      onVolumeChange(prevVolume);
    }
  }, [prevVolume, onVolumeChange]);

  const goToNextVolume = useCallback(() => {
    if (nextVolume && onVolumeChange) {
      onVolumeChange(nextVolume);
    }
  }, [nextVolume, onVolumeChange]);

  return {
    paragraphs,
    chapters,
    loading,
    progress,
    currentParagraphIndex,
    containerRef,
    handleScroll,
    scrollToParagraph,
    prevVolume,
    nextVolume,
    goToPrevVolume,
    goToNextVolume
  };
}
