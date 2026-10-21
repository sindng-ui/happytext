// 갤럭시 안드로이드 내장 무료 TTS (Capacitor 네이티브 + Web Speech API 하이브리드) 제어 훅
// - Capacitor Android: @capacitor-community/text-to-speech 네이티브 TTS 엔진 직접 구동
// - Web / PWA: Web Speech API (window.speechSynthesis) + GC 증발 방지
// - 문단/문장 단위 분할 낭독으로 긴 문장 끊김 방지
// - 페이지 마지막 문단 완료 시 다음 페이지 자동 넘김 및 연속 낭독
// - Screen WakeLock 및 MediaSession 연동

import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// 안드로이드 크롬 GC 수거 방지용 전역 참조 (웹 브라우저용)
let globalUtteranceRef: SpeechSynthesisUtterance | null = null;

interface UseTTSProps {
  paragraphs: string[];
  currentPage: number;
  totalPages: number;
  rate?: number;
  bookTitle?: string;
  volumeTitle?: string;
  onNextPage: () => void;
  onPrevPage?: () => void;
}

/**
 * 특수 기호(구분선 등) 제거 및 읽기용 텍스트 정제
 */
function sanitizeTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[=\-*~_□■◆◇★☆]{2,}/g, ' ')
    .replace(/[\[\]<>〈〉《》「」『』]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 안드로이드 TTS 엔진의 글자수 제한(약 200자 끊김) 방지를 위해 긴 문단을 문장 단위로 안전 분할
 */
function splitIntoSafeChunks(text: string, maxLen = 150): string[] {
  const cleaned = sanitizeTextForSpeech(text);
  if (!cleaned) return [];
  if (cleaned.length <= maxLen) return [cleaned];

  const sentences = cleaned.split(/(?<=[.?!~。])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (!sentence) continue;
    if ((current + ' ' + sentence).trim().length <= maxLen) {
      current = current ? `${current} ${sentence}` : sentence;
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= maxLen) {
        current = sentence;
      } else {
        // 쉼표나 어절 단위로 추가 분할
        for (let i = 0; i < sentence.length; i += maxLen) {
          chunks.push(sentence.slice(i, i + maxLen));
        }
        current = '';
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function useTTS({
  paragraphs,
  currentPage,
  totalPages,
  rate = 1.0,
  bookTitle = 'HappyText',
  volumeTitle = '',
  onNextPage,
  onPrevPage
}: UseTTSProps) {
  const isNative = Capacitor.isNativePlatform();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeParaIndex, setActiveParaIndex] = useState<number | null>(null);
  const [isSupported] = useState<boolean>(
    () => isNative || (typeof window !== 'undefined' && 'speechSynthesis' in window)
  );

  const isPlayingRef = useRef(false);
  const paragraphsRef = useRef<string[]>(paragraphs);
  const currentPageRef = useRef(currentPage);
  const totalPagesRef = useRef(totalPages);
  const rateRef = useRef(rate);
  const activeParaIndexRef = useRef<number>(0);
  const sessionIdRef = useRef<number>(0);
  const koreanVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const wakeLockRef = useRef<any>(null);
  const lastSpokenPageRef = useRef<number>(currentPage);

  paragraphsRef.current = paragraphs;
  currentPageRef.current = currentPage;
  totalPagesRef.current = totalPages;
  rateRef.current = rate;

  // 1. 웹 브라우저 환경: 한국어(ko-KR) 내장 음성 로드
  useEffect(() => {
    if (isNative || !isSupported) return;

    const selectKoreanVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const koVoices = voices.filter(
        (v) =>
          v.lang.toLowerCase().startsWith('ko') ||
          v.name.includes('한국어') ||
          v.name.toLowerCase().includes('korean')
      );

      if (koVoices.length > 0) {
        const localVoice = koVoices.find((v) => v.localService) || koVoices[0];
        koreanVoiceRef.current = localVoice;
      }
    };

    selectKoreanVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', selectKoreanVoice);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', selectKoreanVoice);
    };
  }, [isNative, isSupported]);

  // 2. 화면 꺼짐 방지 (Screen Wake Lock) 관리
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (_) {
      // 구형 기기나 절전 모드 등 무시
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (_) {
      wakeLockRef.current = null;
    }
  }, []);

  // 3. 핵심: 특정 문단 인덱스부터 순차 낭독 실행
  const speakFromParagraph = useCallback(
    (paraIdx: number, chunkIdx = 0, retryCount = 0) => {
      if (!isSupported) return;

      const currentSession = ++sessionIdRef.current;
      const list = paragraphsRef.current;

      // 현재 페이지의 모든 문단을 다 읽은 경우 -> 다음 페이지 자동 이동
      if (!list || paraIdx >= list.length) {
        if (currentPageRef.current < totalPagesRef.current - 1) {
          onNextPage();
        } else {
          // 마지막 권/페이지 완료 시 정지
          isPlayingRef.current = false;
          setIsPlaying(false);
          setActiveParaIndex(null);
          activeParaIndexRef.current = 0;
          releaseWakeLock();
        }
        return;
      }

      const rawPara = list[paraIdx];
      const chunks = splitIntoSafeChunks(rawPara);

      // 읽을 글자가 없는 빈 줄/특수기호 문단은 즉시 다음 문단으로 스킵
      if (chunks.length === 0 || chunkIdx >= chunks.length) {
        speakFromParagraph(paraIdx + 1, 0, 0);
        return;
      }

      activeParaIndexRef.current = paraIdx;
      setActiveParaIndex(paraIdx);

      const targetText = chunks[chunkIdx];
      const speechRate = Math.max(0.5, Math.min(2.0, rateRef.current || 1.0));

      // [네이티브 Capacitor 안드로이드]
      if (isNative) {
        if (sessionIdRef.current !== currentSession || !isPlayingRef.current) return;

        const speakOptions = {
          text: targetText,
          lang: 'ko-KR',
          rate: speechRate,
          pitch: 1.0,
          volume: 1.0,
          category: 'playback'
        };

        TextToSpeech.speak(speakOptions)
          .then(() => {
            if (sessionIdRef.current !== currentSession || !isPlayingRef.current) return;
            if (chunkIdx + 1 < chunks.length) {
              speakFromParagraph(paraIdx, chunkIdx + 1, 0);
            } else {
              speakFromParagraph(paraIdx + 1, 0, 0);
            }
          })
          .catch(() => {
            if (sessionIdRef.current !== currentSession || !isPlayingRef.current) return;
            // 엔진 초기화 직후 첫 호출 실패 시 400ms 대기 후 재시도
            if (retryCount < 2) {
              setTimeout(() => {
                if (sessionIdRef.current === currentSession && isPlayingRef.current) {
                  speakFromParagraph(paraIdx, chunkIdx, retryCount + 1);
                }
              }, 400);
            } else {
              // 연속 실패 시 무한 스킵 루프 방지를 위해 정지
              isPlayingRef.current = false;
              setIsPlaying(false);
              setActiveParaIndex(null);
              releaseWakeLock();
            }
          });
        return;
      }

      // [웹 브라우저 Web Speech API]
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}

      const utterance = new SpeechSynthesisUtterance(targetText);
      globalUtteranceRef = utterance;
      (window as any).__happytextUtterance = utterance;

      utterance.lang = 'ko-KR';
      if (koreanVoiceRef.current) {
        utterance.voice = koreanVoiceRef.current;
      }
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (sessionIdRef.current !== currentSession || !isPlayingRef.current) return;
        if (chunkIdx + 1 < chunks.length) {
          speakFromParagraph(paraIdx, chunkIdx + 1);
        } else {
          speakFromParagraph(paraIdx + 1, 0);
        }
      };

      utterance.onerror = (ev) => {
        if (
          ev.error === 'canceled' ||
          ev.error === 'interrupted' ||
          sessionIdRef.current !== currentSession ||
          !isPlayingRef.current
        ) {
          return;
        }
        speakFromParagraph(paraIdx + 1, 0);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isNative, isSupported, onNextPage, releaseWakeLock]
  );

  // 4. 일시 정지 (정확한 문단 위치 보존)
  const pauseTts = useCallback(() => {
    sessionIdRef.current += 1;
    isPlayingRef.current = false;
    setIsPlaying(false);

    if (isNative) {
      TextToSpeech.stop().catch(() => {});
    } else {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    releaseWakeLock();
  }, [isNative, releaseWakeLock]);

  // 5. 재생 시작 (사용자 터치 제스처 컨텍스트에서 즉시 실행)
  const startTts = useCallback(() => {
    if (!isSupported) {
      alert('이 기기 또는 브라우저에서는 내장 TTS 음성 합성을 지원하지 않습니다.');
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    requestWakeLock();

    const resumeIndex =
      activeParaIndexRef.current >= 0 && activeParaIndexRef.current < paragraphsRef.current.length
        ? activeParaIndexRef.current
        : 0;

    lastSpokenPageRef.current = currentPageRef.current;
    speakFromParagraph(resumeIndex, 0);
  }, [isSupported, requestWakeLock, speakFromParagraph]);

  // 6. 재생 <-> 일시정지 토글 핸들러
  const toggleTts = useCallback(() => {
    if (isPlayingRef.current) {
      pauseTts();
    } else {
      startTts();
    }
  }, [pauseTts, startTts]);

  // 7. 페이지가 바뀌었을 때 (자동 넘김 또는 수동 넘김) 처리
  useEffect(() => {
    if (lastSpokenPageRef.current !== currentPage) {
      lastSpokenPageRef.current = currentPage;
      activeParaIndexRef.current = 0;

      if (isPlayingRef.current) {
        if (paragraphs.length > 0) {
          speakFromParagraph(0, 0);
        }
      } else {
        setActiveParaIndex(null);
      }
    }
  }, [currentPage, paragraphs, speakFromParagraph]);

  // 8. 재생 중 배속(rate) 변경 시 현재 문단에 즉시 반영
  useEffect(() => {
    if (isPlayingRef.current) {
      speakFromParagraph(activeParaIndexRef.current, 0);
    }
  }, [rate, speakFromParagraph]);

  // 9. 갤럭시 미디어 세션(알림창 / 블루투스 이어폰 버튼) 연동
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: volumeTitle || bookTitle,
        artist: bookTitle,
        album: 'HappyText TTS 오디오북'
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      navigator.mediaSession.setActionHandler('play', () => startTts());
      navigator.mediaSession.setActionHandler('pause', () => pauseTts());
      if (onPrevPage) {
        navigator.mediaSession.setActionHandler('previoustrack', () => onPrevPage());
      }
      navigator.mediaSession.setActionHandler('nexttrack', () => onNextPage());
    } catch (_) {}
  }, [isPlaying, bookTitle, volumeTitle, startTts, pauseTts, onNextPage, onPrevPage]);

  // 10. 컴포넌트 언마운트 시 음성 즉시 정리
  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      isPlayingRef.current = false;
      if (isNative) {
        TextToSpeech.stop().catch(() => {});
      } else {
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
        } catch (_) {}
      }
      releaseWakeLock();
    };
  }, [isNative, releaseWakeLock]);

  return {
    isTtsPlaying: isPlaying,
    activeTtsParagraphIndex: activeParaIndex,
    isTtsSupported: isSupported,
    toggleTts,
    pauseTts
  };
}
