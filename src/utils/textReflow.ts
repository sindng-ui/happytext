// 스마트 문단 정돈 및 개행 최적화 유틸리티

const CHAPTER_PATTERNS = [
  /^\s*---.*---\s*$/,
  /^\s*===.*===\s*$/,
  /^\s*제\s*[0-9一-十]+\s*[장권편절회].*$/,
  /^\s*\[\s*제?\s*[0-9一-十]+.*\]\s*$/,
  /^\s*프롤로그|에필로그|서문|후기|작가의\s*말\s*$/i,
  /^\s*[0-9]+(\s*장|\s*회|\s*권|\s*\.|\s*화)\s*.*$/
];

// 대화문 시작 문자 (전음 대화 <...>, 《...》 포함)
const DIALOGUE_STARTERS = ['"', "'", '“', '‘', '「', '『', '《', '<', '(', '[', '-'];
const SENTENCE_ENDERS = ['.', '!', '?', '…', '”', '’', '」', '』', '》', '>', ')', ']', '~'];
const KOREAN_PARTICLES = /^[을를이가은는에의로와과도만고자며면서따라]+/;

export function isChapterHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // 15자 이상의 긴 문장은 챕터가 아님
  if (trimmed.length > 35) return false;
  return CHAPTER_PATTERNS.some(pattern => pattern.test(trimmed));
}

export function isDialogue(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return DIALOGUE_STARTERS.some(ch => trimmed.startsWith(ch));
}

/**
 * 텍스트 원본을 읽기 좋은 자연스러운 단락(Paragraph) 배열로 재조합
 * - PC통신 80열 강제 줄바꿈(Hard wrap) 자동 복원
 * - 대화문, 시적 짧은 문장, 작가 의도 행간 100% 보존
 * - 한글 조사/어미 분절 시 자연스러운 결합
 */
export function reflowText(rawText: string): string[] {
  if (!rawText) return [];

  // 줄바꿈 통일 (\r\n -> \n)
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const paragraphs: string[] = [];

  let currentBuffer = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. 빈 줄: 문단 구분
    if (!trimmed) {
      if (currentBuffer) {
        paragraphs.push(currentBuffer);
        currentBuffer = '';
      }
      continue;
    }

    // 2. 챕터/제목 표시
    if (isChapterHeader(trimmed)) {
      if (currentBuffer) {
        paragraphs.push(currentBuffer);
        currentBuffer = '';
      }
      paragraphs.push(trimmed);
      continue;
    }

    // 3. 대화문으로 시작하는 경우: 항상 새 단락으로 시작
    if (isDialogue(trimmed)) {
      if (currentBuffer) {
        paragraphs.push(currentBuffer);
        currentBuffer = '';
      }
      currentBuffer = trimmed;
      continue;
    }

    // 버퍼가 비어있으면 현재 줄로 시작
    if (!currentBuffer) {
      currentBuffer = trimmed;
      continue;
    }

    // 4. 버퍼와 현재 줄의 결합 여부 판정 (Hard Wrap인지 vs 의도적 개행인지)
    const prevTrimmed = currentBuffer.trim();
    const lastChar = prevTrimmed[prevTrimmed.length - 1];

    // 작가의 의도적 개행인 경우:
    // a. 이전 줄이 문장 종결 부호(., !, ?, ”, ’, ~)로 끝나고 줄 길이가 비교적 짧은 경우
    const isEndingWithSentencePunctuation = SENTENCE_ENDERS.includes(lastChar);
    const isShortIntentionalLine = isEndingWithSentencePunctuation && prevTrimmed.length < 32;

    if (isShortIntentionalLine) {
      paragraphs.push(currentBuffer);
      currentBuffer = trimmed;
      continue;
    }

    // b. 하드랩인 경우 (문장 중간에 잘린 것): 결합 처리
    const prevHadTrailingSpace = rawLine.endsWith(' ') || currentBuffer.endsWith(' ');
    const startsWithParticle = KOREAN_PARTICLES.test(trimmed);

    if (!prevHadTrailingSpace && startsWithParticle) {
      // 조사/어미가 잘린 경우: "반목" + "을 통해" -> "반목을 통해"
      currentBuffer += trimmed;
    } else {
      // 일반 단어 결합: 공백 하나로 자연스럽게 연결
      currentBuffer += ' ' + trimmed;
    }
  }

  if (currentBuffer) {
    paragraphs.push(currentBuffer);
  }

  return paragraphs;
}
