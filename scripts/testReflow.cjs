const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../묵향/묵향 01권.txt');
const buffer = fs.readFileSync(targetPath);
const decoder = new TextDecoder('euc-kr');
const raw = decoder.decode(buffer);

const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

const CHAPTER_PATTERNS = [
  /^\s*---.*---\s*$/,
  /^\s*===.*===\s*$/,
  /^\s*제\s*[0-9一-十]+\s*[장권편절회].*$/,
  /^\s*\[\s*제?\s*[0-9一-十]+.*\]\s*$/,
  /^\s*프롤로그|에필로그|서문|후기|작가의\s*말\s*$/i,
  /^\s*[0-9]+(\s*장|\s*회|\s*권|\s*\.|\s*화)\s*.*$/
];

const DIALOGUE_STARTERS = ['"', "'", '“', '‘', '「', '『', '《', '<', '(', '[', '-'];
const SENTENCE_ENDERS = ['.', '!', '?', '…', '”', '’', '」', '』', '》', '>', ')', ']', '~'];
const KOREAN_PARTICLES = /^[을를이가은는에의로와과도만고자며면서따라]+/;

function isChapterHeader(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 35) return false;
  return CHAPTER_PATTERNS.some(pattern => pattern.test(trimmed));
}

function isDialogue(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return DIALOGUE_STARTERS.some(ch => trimmed.startsWith(ch));
}

const paragraphs = [];
let current = '';

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) {
    if (current) {
      paragraphs.push(current);
      current = '';
    }
    continue;
  }

  if (isChapterHeader(trimmed)) {
    if (current) {
      paragraphs.push(current);
      current = '';
    }
    paragraphs.push(trimmed);
    continue;
  }

  if (isDialogue(trimmed)) {
    if (current) {
      paragraphs.push(current);
      current = '';
    }
    current = trimmed;
    continue;
  }

  if (!current) {
    current = trimmed;
    continue;
  }

  const prevTrimmed = current.trim();
  const lastChar = prevTrimmed[prevTrimmed.length - 1];
  const isEndingWithSentencePunctuation = SENTENCE_ENDERS.includes(lastChar);
  const isShortIntentionalLine = isEndingWithSentencePunctuation && prevTrimmed.length < 32;

  if (isShortIntentionalLine) {
    paragraphs.push(current);
    current = trimmed;
    continue;
  }

  if (KOREAN_PARTICLES.test(trimmed)) {
    current += trimmed;
  } else {
    current += ' ' + trimmed;
  }
}

if (current) {
  paragraphs.push(current);
}

const chapters = paragraphs.filter(p => isChapterHeader(p));

const resultReport = `=== HappyText 스마트 개행 테스트 결과 (묵향 01권.txt) ===
1. 원본 라인 수: ${lines.length} 줄
2. 정돈된 단락 수: ${paragraphs.length} 문단
3. 자동 감지된 챕터 수: ${chapters.length} 개
4. 단락 결합 압축률: ${((1 - paragraphs.length / lines.length) * 100).toFixed(1)}%

[샘플 1: 서문 문단 정돈 결과]
${paragraphs.slice(0, 4).map((p, i) => `[단락 ${i + 1}]\n${p}\n`).join('\n')}

[샘플 2: 챕터 제목 감지 목록]
${chapters.map((ch, idx) => `[챕터 ${idx + 1}] ${ch}`).join('\n')}
`;

const outputPath = path.resolve(__dirname, '../docs/test_reflow_result.txt');
fs.writeFileSync(outputPath, resultReport, 'utf-8');
console.log('테스트 재검증 완료! 챕터 개수:', chapters.length);
