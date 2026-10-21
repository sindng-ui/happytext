import React, { useRef, useEffect } from 'react';
import { ReaderSettings } from '../../types/book';
import { isChapterHeader, isDialogue } from '../../utils/textReflow';

interface ReaderContentProps {
  paragraphs: string[];
  pageParagraphs?: string[];
  currentPage: number;
  totalPages?: number;
  loading: boolean;
  settings: ReaderSettings;
  containerRef: React.RefObject<HTMLDivElement>;
  activeTtsParagraphIndex?: number | null;
  isTtsPlaying?: boolean;
  onScroll: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onToggleToolbar: () => void;
}

export const ReaderContent: React.FC<ReaderContentProps> = ({
  paragraphs,
  pageParagraphs,
  currentPage,
  totalPages,
  loading,
  settings,
  containerRef,
  activeTtsParagraphIndex = null,
  isTtsPlaying = false,
  onScroll,
  onNextPage,
  onPrevPage,
  onToggleToolbar
}) => {
  const isPaging = settings.mode === 'paging';

  // 스크롤 모드에서 TTS 낭독 문단 변경 시 해당 문단으로 부드럽게 포커스 이동
  useEffect(() => {
    if (!isPaging && isTtsPlaying && activeTtsParagraphIndex !== null && containerRef.current) {
      const targetEl = containerRef.current.querySelector(
        `[data-p-index="${activeTtsParagraphIndex}"]`
      );
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isPaging, isTtsPlaying, activeTtsParagraphIndex, containerRef]);

  // 터치 및 마우스 제스처 추적 (하단 70% 짧은 터치: 다음 장, 좌->우 스와이프: 이전 장, 상단 30% 짧은 터치: UI 토글)
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);
  const mouseStartXRef = useRef<number>(0);
  const mouseStartYRef = useRef<number>(0);
  const mouseStartTimeRef = useRef<number>(0);

  // 1. 터치 시작
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPaging) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = Date.now();
  };

  // 2. 터치 이동 (기본 브라우저 스크롤 원천 차단)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPaging) return;
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  // 3. 터치 종료 (하단 70% 전체 탭 -> 다음 장 / 좌->우 스와이프 -> 이전 장 / 상단 30% 탭 -> UI 토글)
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPaging) return;
    lastTouchTimeRef.current = Date.now();

    const touch = e.changedTouches[0];
    const signedDeltaX = touch.clientX - touchStartXRef.current;
    const absDeltaX = Math.abs(signedDeltaX);
    const absDeltaY = Math.abs(touch.clientY - touchStartYRef.current);
    const deltaTime = Date.now() - touchStartTimeRef.current;

    // 1) 왼쪽에서 오른쪽으로 스와이프 할 때에만 이전 장으로 이동
    if (signedDeltaX >= 45 && absDeltaX > absDeltaY * 1.3 && deltaTime <= 600) {
      onPrevPage();
      return;
    }

    // 2) 손가락이 15px 이상 움직인 그 외 드래그/스와이프 또는 롱프레스는 무시
    if (absDeltaX > 15 || absDeltaY > 15 || deltaTime > 350) {
      return;
    }

    const pageHeight = window.innerHeight;
    const clickRatioY = touch.clientY / pageHeight;

    // 3) 상단 30% 영역 짧은 터치: 설정/목차/TTS 툴바 UI 토글
    if (clickRatioY < 0.30) {
      onToggleToolbar();
      return;
    }

    // 4) 하단 70% 영역 어느 곳을 짧게 터치하더라도 다음 장으로 이동
    onNextPage();
  };

  // 데스크톱 마우스 누름 (PC 테스트 및 마우스 스와이프 호환용)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseStartXRef.current = e.clientX;
    mouseStartYRef.current = e.clientY;
    mouseStartTimeRef.current = Date.now();
  };

  // 데스크톱 마우스 클릭/드래그 종료 (PC 테스트용)
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 450) {
      return;
    }

    const { clientX, clientY, currentTarget } = e;
    const height = currentTarget.clientHeight;
    const clickRatioY = clientY / height;

    if (isPaging) {
      const signedDeltaX = clientX - mouseStartXRef.current;
      const absDeltaX = Math.abs(signedDeltaX);
      const absDeltaY = Math.abs(clientY - mouseStartYRef.current);
      const deltaTime = Date.now() - mouseStartTimeRef.current;

      // 왼쪽에서 오른쪽으로 드래그(스와이프) 시 이전 장 이동
      if (signedDeltaX >= 45 && absDeltaX > absDeltaY * 1.3 && deltaTime <= 600) {
        onPrevPage();
        return;
      }

      // 그 외 드래그는 무시
      if (absDeltaX > 15 || absDeltaY > 15) {
        return;
      }

      // 상단 30% 영역 클릭: 설정/목차/TTS UI 토글
      if (clickRatioY < 0.30) {
        onToggleToolbar();
        return;
      }

      // 하단 70% 어느 곳이든 짧게 클릭: 다음 장 이동
      onNextPage();
      return;
    }

    onToggleToolbar();
  };

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ fontSize: '15px' }}>본문을 불러와 페이지를 구성하는 중입니다...</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>잠시만 기다려주세요</div>
      </div>
    );
  }

  const fontFamilyCss =
    settings.fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)';

  // [핵심] 페이징 모드일 때는 오직 현재 페이지의 텍스트만 렌더링! (이전/다음 페이지 DOM 부재 -> 밀림 0%)
  const displayParagraphs = isPaging ? pageParagraphs || [] : paragraphs;

  return (
    <div
      ref={containerRef}
      onScroll={isPaging ? undefined : onScroll}
      onMouseDown={handleMouseDown}
      onClick={handleContentClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        // 페이징 모드에서는 스크롤 완전 락!
        overflow: isPaging ? 'hidden' : 'auto',
        touchAction: isPaging ? 'none' : 'pan-y',
        userSelect: 'none',
        position: 'relative',
        padding: `calc(var(--safe-top) + 24px) ${settings.sidePadding}px calc(var(--safe-bottom) + 36px)`,
        cursor: 'pointer',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="selectable-text"
        style={{
          width: '100%',
          maxWidth: '680px',
          margin: '0 auto',
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          letterSpacing: `${settings.letterSpacing}em`,
          fontFamily: fontFamilyCss,
          color: 'var(--text-primary)',
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
          textWrap: 'pretty',
          boxSizing: 'border-box'
        }}
      >
        {displayParagraphs.map((para, idx) => {
          const isChap = isChapterHeader(para);
          const isDial = isDialogue(para);
          const isTtsActive = isTtsPlaying && activeTtsParagraphIndex === idx;

          if (isChap) {
            return (
              <div
                key={idx}
                data-p-index={idx}
                style={{
                  fontSize: `${Math.round(settings.fontSize * 1.25)}px`,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  margin: '32px 0 18px',
                  textAlign: 'center',
                  padding: '10px 0',
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: isTtsActive ? 'var(--accent-soft)' : 'transparent',
                  letterSpacing: '0.04em'
                }}
              >
                {para}
              </div>
            );
          }

          return (
            <p
              key={idx}
              data-p-index={idx}
              style={{
                marginBottom: `${settings.paragraphSpacing}px`,
                textIndent: isDial ? '0' : '1em',
                opacity: isTtsActive ? 1 : 0.96,
                backgroundColor: isTtsActive ? 'var(--accent-soft)' : 'transparent',
                borderLeft: isTtsActive ? '3px solid var(--accent)' : 'none',
                paddingLeft: isTtsActive ? '8px' : '0',
                borderRadius: isTtsActive ? '4px' : '0'
              }}
            >
              {para}
            </p>
          );
        })}
      </div>

      {/* 페이징 모드 하단 우측 쪽수 미니멀 인디케이터 (예: 12 / 85쪽) */}
      {isPaging && totalPages && totalPages > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(var(--safe-bottom) + 8px)',
            right: '16px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isTtsPlaying && (
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>낭독 중 ·</span>
          )}
          <span>
            {currentPage + 1} / {totalPages}쪽
          </span>
        </div>
      )}
    </div>
  );
};
