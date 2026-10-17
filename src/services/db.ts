// IndexedDB 로컬 영구 스토리지 매니저

import { Book, Volume, Chapter } from '../types/book';

const DB_NAME = 'happytext_db';
const DB_VERSION = 1;

export interface CachedContent {
  volumeId: string;
  paragraphs: string[];
  chapters: Chapter[];
  rawText?: string;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('volumes')) {
        const volumeStore = db.createObjectStore('volumes', { keyPath: 'id' });
        volumeStore.createIndex('by_book', 'bookId', { unique: false });
      }

      if (!db.objectStoreNames.contains('content')) {
        db.createObjectStore('content', { keyPath: 'volumeId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// 1. 도서 (Book) CRUD
export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBook(book: Book): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readwrite');
    const store = tx.objectStore('books');
    store.put(book);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteBook(bookId: string): Promise<void> {
  const db = await getDB();
  return new Promise(async (resolve, reject) => {
    try {
      const tx = db.transaction(['books', 'volumes', 'content'], 'readwrite');
      const bookStore = tx.objectStore('books');
      const volumeStore = tx.objectStore('volumes');
      const contentStore = tx.objectStore('content');

      bookStore.delete(bookId);

      const index = volumeStore.index('by_book');
      const req = index.getAll(bookId);
      req.onsuccess = () => {
        const volumes = req.result as Volume[];
        for (const vol of volumes) {
          volumeStore.delete(vol.id);
          contentStore.delete(vol.id);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (e) {
      reject(e);
    }
  });
}

// 2. 권 (Volume) CRUD
export async function getVolumesByBook(bookId: string): Promise<Volume[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('volumes', 'readonly');
    const store = tx.objectStore('volumes');
    const index = store.index('by_book');
    const req = index.getAll(bookId);
    req.onsuccess = () => {
      const list = (req.result || []) as Volume[];
      list.sort((a, b) => a.order - b.order);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveVolumes(volumes: Volume[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('volumes', 'readwrite');
    const store = tx.objectStore('volumes');
    for (const vol of volumes) {
      store.put(vol);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateVolumeProgress(
  volumeId: string,
  progress: number,
  paragraphIndex: number,
  scrollOffset: number
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('volumes', 'readwrite');
    const store = tx.objectStore('volumes');
    const req = store.get(volumeId);
    req.onsuccess = () => {
      const vol = req.result as Volume | undefined;
      if (vol) {
        vol.lastReadProgress = progress;
        vol.lastReadParagraphIndex = paragraphIndex;
        vol.lastReadScrollOffset = scrollOffset;
        vol.updatedAt = Date.now();
        store.put(vol);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 3. 본문 캐시 (Content)
export async function getContent(volumeId: string): Promise<CachedContent | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('content', 'readonly');
    const store = tx.objectStore('content');
    const req = store.get(volumeId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveContent(content: CachedContent): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('content', 'readwrite');
    const store = tx.objectStore('content');
    store.put(content);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
