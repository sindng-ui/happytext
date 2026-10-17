// HappyText 핵심 데이터 모델 및 상태 인터페이스

export type ReadingTheme = 'charcoal' | 'oled' | 'sepia' | 'linen';

export type ReadingMode = 'scroll' | 'paging';

export type FontFamily = 'pretendard' | 'serif' | 'sans-serif';

export interface ReaderSettings {
  fontSize: number;       // 기본 18px (14 ~ 28)
  lineHeight: number;     // 기본 1.85 (1.5 ~ 2.4)
  theme: ReadingTheme;    // 기본 'charcoal'
  mode: ReadingMode;      // 기본 'scroll'
  fontFamily: FontFamily; // 기본 'pretendard'
  letterSpacing: number;  // 기본 -0.02em
  paragraphSpacing: number; // 기본 14px
  sidePadding: number;    // 기본 18px (12 ~ 32)
}

export interface Chapter {
  id: string;
  title: string;
  paragraphIndex: number;
  snippet: string;
}

export interface Volume {
  id: string;
  bookId: string;
  title: string;
  filename: string;
  sizeBytes: number;
  order: number;
  lastReadProgress: number; // 0 ~ 100%
  lastReadParagraphIndex: number;
  lastReadScrollOffset: number;
  updatedAt: number;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  totalVolumes: number;
  lastReadVolumeId?: string;
  lastReadVolumeTitle?: string;
  lastReadProgress?: number;
  lastReadAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ActiveSession {
  bookId: string;
  volumeId: string;
  bookTitle: string;
  volumeTitle: string;
  paragraphIndex: number;
  scrollOffset: number;
  progressPercent: number;
  timestamp: number;
}
