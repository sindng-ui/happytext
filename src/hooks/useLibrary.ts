// 도서관(서재) 관리 커스텀 훅

import { useState, useEffect, useCallback } from 'react';
import { Book, Volume } from '../types/book';
import * as db from '../services/db';

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loadingVolumes, setLoadingVolumes] = useState(false);
  const [cachingProgress, setCachingProgress] = useState<{ total: number; done: number } | null>(null);

  // 1. 서재 목록 로드 및 묵향 기본 시드 동기화
  const refreshBooks = useCallback(async () => {
    try {
      let list = await db.getAllBooks();

      // 아직 등록된 책이 없는 경우 기본 묵향 시드 자동 로드 시도
      if (list.length === 0) {
        try {
          const res = await fetch('/api/seed-books');
          if (res.ok) {
            const data = await res.json();
            if (data.volumes && data.volumes.length > 0) {
              const seedBook: Book = {
                id: data.id || 'mukhyang-series',
                title: data.title || '묵향',
                totalVolumes: data.volumes.length,
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              await db.saveBook(seedBook);

              const seedVolumes: Volume[] = data.volumes.map((v: any, index: number) => ({
                id: v.id,
                bookId: seedBook.id,
                title: v.title,
                filename: v.filename,
                sizeBytes: v.sizeBytes,
                order: index + 1,
                lastReadProgress: 0,
                lastReadParagraphIndex: 0,
                lastReadScrollOffset: 0,
                updatedAt: Date.now()
              }));
              await db.saveVolumes(seedVolumes);
              list = [seedBook];
            }
          }
        } catch (e) {
          console.warn('묵향 기본 시드 로드 건너뜀:', e);
        }
      }

      setBooks(list.sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0)));
    } catch (e) {
      console.error('책 목록 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  // 2. 특정 작품의 권 목록 로드
  const selectBook = useCallback(async (book: Book | null) => {
    setSelectedBook(book);
    if (!book) {
      setVolumes([]);
      return;
    }

    setLoadingVolumes(true);
    try {
      const vols = await db.getVolumesByBook(book.id);
      setVolumes(vols);
    } catch (e) {
      console.error('권 목록 로드 실패:', e);
    } finally {
      setLoadingVolumes(false);
    }
  }, []);

  // 3. 전권 오프라인 완전 캐싱 (PC 없이 폰 단독 실행 지원)
  const cacheAllVolumesOffline = useCallback(async (bookId: string) => {
    const vols = await db.getVolumesByBook(bookId);
    setCachingProgress({ total: vols.length, done: 0 });

    for (let i = 0; i < vols.length; i++) {
      const vol = vols[i];
      const existing = await db.getContent(vol.id);
      if (!existing) {
        try {
          const rawUrl = `/api/raw-book/묵향/${encodeURIComponent(vol.filename)}`;
          const res = await fetch(rawUrl);
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            await new Promise<void>((resolve) => {
              const worker = new Worker(new URL('../workers/textParser.worker.ts', import.meta.url), {
                type: 'module'
              });
              worker.postMessage({ id: vol.id, buffer }, [buffer]);
              worker.onmessage = async (e) => {
                if (e.data.success) {
                  await db.saveContent({
                    volumeId: vol.id,
                    paragraphs: e.data.paragraphs,
                    chapters: e.data.chapters,
                    updatedAt: Date.now()
                  });
                }
                worker.terminate();
                resolve();
              };
            });
          }
        } catch (e) {
          console.warn(`${vol.title} 캐싱 건너뜀:`, e);
        }
      }
      setCachingProgress({ total: vols.length, done: i + 1 });
    }

    setTimeout(() => setCachingProgress(null), 1500);
  }, []);

  // 4. 작품 추가 (새 책 및 txt 파일들)
  const addNewBook = useCallback(
    async (title: string, files: File[]) => {
      const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

      const sortedFiles = Array.from(files).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );

      const newBook: Book = {
        id: bookId,
        title: title.trim() || sortedFiles[0]?.name.replace(/\.txt$/i, '') || '새 작품',
        totalVolumes: sortedFiles.length,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await db.saveBook(newBook);

      const newVolumes: Volume[] = [];
      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];
        const volId = `${bookId}_vol_${i + 1}`;
        newVolumes.push({
          id: volId,
          bookId,
          title: file.name.replace(/\.txt$/i, ''),
          filename: file.name,
          sizeBytes: file.size,
          order: i + 1,
          lastReadProgress: 0,
          lastReadParagraphIndex: 0,
          lastReadScrollOffset: 0,
          updatedAt: Date.now()
        });

        const buffer = await file.arrayBuffer();
        const worker = new Worker(new URL('../workers/textParser.worker.ts', import.meta.url), {
          type: 'module'
        });

        worker.postMessage({ id: volId, buffer }, [buffer]);
        worker.onmessage = async (e) => {
          if (e.data.success) {
            await db.saveContent({
              volumeId: volId,
              paragraphs: e.data.paragraphs,
              chapters: e.data.chapters,
              updatedAt: Date.now()
            });
          }
          worker.terminate();
        };
      }

      await db.saveVolumes(newVolumes);
      await refreshBooks();
      return newBook;
    },
    [refreshBooks]
  );

  // 5. 작품 이름 수정
  const updateBookTitle = useCallback(
    async (bookId: string, newTitle: string) => {
      const target = books.find((b) => b.id === bookId);
      if (!target) return;
      const updated: Book = {
        ...target,
        title: newTitle.trim() || target.title,
        updatedAt: Date.now()
      };
      await db.saveBook(updated);
      await refreshBooks();
      if (selectedBook?.id === bookId) {
        setSelectedBook(updated);
      }
    },
    [books, refreshBooks, selectedBook]
  );

  // 6. 작품 삭제
  const removeBook = useCallback(
    async (bookId: string) => {
      await db.deleteBook(bookId);
      if (selectedBook?.id === bookId) {
        setSelectedBook(null);
        setVolumes([]);
      }
      await refreshBooks();
    },
    [refreshBooks, selectedBook]
  );

  return {
    books,
    loading,
    selectedBook,
    volumes,
    loadingVolumes,
    cachingProgress,
    refreshBooks,
    selectBook,
    cacheAllVolumesOffline,
    addNewBook,
    updateBookTitle,
    removeBook
  };
}
