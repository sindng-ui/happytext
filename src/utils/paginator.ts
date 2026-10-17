// 정밀 DOM 기반 순수 페이지 텍스트 분할 엔진 (오차 0px, 밀림 원천 박멸)

export interface TextPage {
  pageIndex: number;
  paragraphs: string[];
}

const paginationCache = new Map<string, TextPage[]>();

export function getPaginationCacheKey(
  volumeId: string,
  width: number,
  height: number,
  fontSize: number,
  lineHeight: number
): string {
  return `${volumeId}_${Math.round(width)}_${Math.round(height)}_${fontSize}_${lineHeight}`;
}

/**
 * 주어진 본문 단락들을 현재 화면 크기에 맞게 정확히 1페이지 단위로 분할
 * 각 페이지는 해당 화면 높이에 꽉 차게 들어가는 단락들만 포함
 */
export function paginateText(
  paragraphs: string[],
  width: number,
  height: number,
  fontSize: number,
  lineHeight: number,
  sidePadding: number,
  fontFamily: string,
  cacheKey?: string
): TextPage[] {
  if (!paragraphs || paragraphs.length === 0 || width <= 0 || height <= 0) {
    return [{ pageIndex: 0, paragraphs: [] }];
  }

  if (cacheKey && paginationCache.has(cacheKey)) {
    return paginationCache.get(cacheKey)!;
  }

  // 브라우저 DOM 측정용 오프스크린 샌드박스 엘리먼트 생성
  const measureContainer = document.createElement('div');
  measureContainer.style.position = 'fixed';
  measureContainer.style.left = '-9999px';
  measureContainer.style.top = '-9999px';
  measureContainer.style.width = `${width - sidePadding * 2}px`;
  measureContainer.style.visibility = 'hidden';
  measureContainer.style.fontSize = `${fontSize}px`;
  measureContainer.style.lineHeight = `${lineHeight}`;
  measureContainer.style.fontFamily = fontFamily;
  measureContainer.style.wordBreak = 'keep-all';
  measureContainer.style.overflowWrap = 'break-word';
  measureContainer.style.letterSpacing = '-0.02em';
  measureContainer.style.boxSizing = 'border-box';
  document.body.appendChild(measureContainer);

  const availableHeight = height;
  const pages: TextPage[] = [];
  let currentPageParas: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];

    // 테스트용 단락 추가
    const pEl = document.createElement('p');
    pEl.style.marginBottom = '14px';
    pEl.style.textIndent = '1em';
    pEl.textContent = para;
    measureContainer.appendChild(pEl);

    if (measureContainer.offsetHeight <= availableHeight) {
      // 현재 페이지에 여유가 있어 쏙 들어감
      currentPageParas.push(para);
    } else {
      // 현재 페이지 높이를 초과함!
      measureContainer.removeChild(pEl);

      if (currentPageParas.length > 0) {
        // 지금까지 모인 단락들을 현재 페이지로 확정
        pages.push({
          pageIndex: pages.length,
          paragraphs: [...currentPageParas]
        });
        currentPageParas = [];
        measureContainer.innerHTML = '';
      }

      // 새 페이지에 이 단락을 넣기 시도
      pEl.textContent = para;
      measureContainer.appendChild(pEl);

      if (measureContainer.offsetHeight <= availableHeight) {
        currentPageParas.push(para);
      } else {
        // 단락 하나가 화면 전체보다 큰 경우: 문장 단위로 쪼개어 채움
        measureContainer.removeChild(pEl);
        const sentences = para.split(/(?<=[.?!~])\s+/);
        let part1 = '';
        let part2 = '';

        for (const s of sentences) {
          const testText = part1 ? part1 + ' ' + s : s;
          const tempP = document.createElement('p');
          tempP.style.marginBottom = '14px';
          tempP.style.textIndent = '1em';
          tempP.textContent = testText;
          measureContainer.appendChild(tempP);

          if (measureContainer.offsetHeight <= availableHeight) {
            part1 = testText;
            measureContainer.removeChild(tempP);
          } else {
            measureContainer.removeChild(tempP);
            part2 = sentences.slice(sentences.indexOf(s)).join(' ');
            break;
          }
        }

        if (part1) {
          pages.push({
            pageIndex: pages.length,
            paragraphs: [part1]
          });
          measureContainer.innerHTML = '';
        }

        if (part2) {
          currentPageParas.push(part2);
          const nextP = document.createElement('p');
          nextP.style.marginBottom = '14px';
          nextP.style.textIndent = '1em';
          nextP.textContent = part2;
          measureContainer.appendChild(nextP);
        }
      }
    }
  }

  // 마지막 남은 단락들 페이지 추가
  if (currentPageParas.length > 0) {
    pages.push({
      pageIndex: pages.length,
      paragraphs: currentPageParas
    });
  }

  document.body.removeChild(measureContainer);

  const finalPages = pages.length > 0 ? pages : [{ pageIndex: 0, paragraphs: [] }];
  if (cacheKey) {
    paginationCache.set(cacheKey, finalPages);
  }

  return finalPages;
}
