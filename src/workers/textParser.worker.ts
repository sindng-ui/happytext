// Web Worker: 대용량 텍스트 디코딩, 스마트 단락 정돈 및 목차 파싱

import { decodeText } from '../services/encoding';
import { reflowText } from '../utils/textReflow';
import { extractChapters } from '../utils/chapterExtractor';

self.onmessage = (e: MessageEvent) => {
  const { id, buffer, rawText } = e.data;

  try {
    const startTime = performance.now();
    let text = rawText;

    if (!text && buffer) {
      // 바이너리 데이터 디코딩 (CP949 / UTF-8 자동 감지)
      text = decodeText(buffer);
    }

    // 스마트 문단 정돈 (Hard wrap 복원 및 가독성 최적화)
    const paragraphs = reflowText(text || '');

    // 목차 추출
    const chapters = extractChapters(paragraphs);
    const durationMs = Math.round(performance.now() - startTime);

    self.postMessage({
      id,
      success: true,
      paragraphs,
      chapters,
      durationMs,
      totalLength: text?.length || 0
    });
  } catch (error: any) {
    self.postMessage({
      id,
      success: false,
      error: error.message || 'Worker 파싱 실패'
    });
  }
};
