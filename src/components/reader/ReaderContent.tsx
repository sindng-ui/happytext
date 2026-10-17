import React, { useRef } from 'react';
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
  onScroll,
  onNextPage,
  onPrevPage,
  onToggleToolbar
}) => {
  const isPaging = settings.mode === 'paging';

  // 터치 추적 (오직 짧은 탭만 감지, 스와이프/드래그 완전 무시)
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);

  // 1. 터치 시작
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPaging) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = Date.now();
  };

  // 2. 터치 이동 (스와이프 및 스크롤 원천 차단)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPaging) return;
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  // 3. 터치 종료 (오직 순수 탭만 처리!)
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPaging) return;
    lastTouchTimeRef.current = Date.now();

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touchStartXRef.current - touch.clientX);
    const deltaY = Math.abs(touchStartYRef.current - touch.clientY);
    const deltaTime = Date.now() - touchStartTimeRef.current;

    // 손가락이 15px 이상 움직인 드래그/스와이프는 100% 무시
    if (deltaX > 15 || deltaY > 15 || deltaTime > 350) {
      return;
    }

    const pageWidth = window.innerWidth;
    const pageHeight = window.innerHeight;
    const clickRatioX = touch.clientX / pageWidth;
    const clickRatioY = touch.clientY / pageHeight;

    // 상단 30% 영역: 설정/목차 툴바 토글
    if (clickRatioY < 0.30) {
      onToggleToolbar();
      return;
    }

    // 하단 70% 영역: 짧은 터치로 즉각 페이지 전환
    if (clickRatioX < 0.35) {
      onPrevPage();
    } else if (clickRatioX > 0.65) {
      onNextPage();
    } else {
      onToggleToolbar();
    }
  };

  // 데스크톱 마우스 클릭 (PC 테스트용)
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 450) {
      return;
    }

    const { clientX, clientY, currentTarget } = e;
    const width = currentTarget.clientWidth;
    const height = currentTarget.clientHeight;
    const clickRatioX = clientX / width;
    const clickRatioY = clientY / height;

    if (isPaging) {
      if (clickRatioY < 0.30) {
        onToggleToolbar();
        return;
      }
      if (clickRatioX < 0.35) {
        onPrevPage();
        return;
      } else if (clickRatioX > 0.65) {
        onNextPage();
        return;
      }
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
                opacity: 0.96
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
            pointerEvents: 'none'
          }}
        >
          {currentPage + 1} / {totalPages}쪽
        </div>
      )}
    </div>
  );
};
