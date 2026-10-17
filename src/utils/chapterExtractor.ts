import { Chapter } from '../types/book';
import { isChapterHeader } from './textReflow';

export function extractChapters(paragraphs: string[]): Chapter[] {
  const chapters: Chapter[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const text = paragraphs[i].trim();
    if (isChapterHeader(text)) {
      // 불필요한 특수문자 정리
      const cleanTitle = text.replace(/^[-=~*#[\]<>]+\s*/, '').replace(/\s*[-=~*#[\]<>]+$/, '').trim();
      chapters.push({
        id: `ch_${i}`,
        title: cleanTitle || text,
        paragraphIndex: i,
        snippet: paragraphs[i + 1]?.slice(0, 50) || ''
      });
    }
  }

  // 챕터가 하나도 발견되지 않은 경우 기본 '시작' 챕터 추가
  if (chapters.length === 0 && paragraphs.length > 0) {
    chapters.push({
      id: 'ch_0',
      title: '시작',
      paragraphIndex: 0,
      snippet: paragraphs[0].slice(0, 50)
    });
  }

  return chapters;
}
