// CP949 / EUC-KR 및 UTF-8 자동 판별 디코더

export function isUtf8Bytes(bytes: Uint8Array): boolean {
  let i = 0;
  const len = Math.min(bytes.length, 10000); // 앞부분 10KB 검사
  let hasMultiByte = false;

  while (i < len) {
    const byte1 = bytes[i];
    if (byte1 <= 0x7F) {
      i++;
      continue;
    }
    hasMultiByte = true;
    if ((byte1 & 0xE0) === 0xC0) {
      if (i + 1 >= len) break;
      const byte2 = bytes[i + 1];
      if ((byte2 & 0xC0) !== 0x80) return false;
      i += 2;
    } else if ((byte1 & 0xF0) === 0xE0) {
      if (i + 2 >= len) break;
      const byte2 = bytes[i + 1];
      const byte3 = bytes[i + 2];
      if ((byte2 & 0xC0) !== 0x80 || (byte3 & 0xC0) !== 0x80) return false;
      i += 3;
    } else if ((byte1 & 0xF8) === 0xF0) {
      if (i + 3 >= len) break;
      const byte2 = bytes[i + 1];
      const byte3 = bytes[i + 2];
      const byte4 = bytes[i + 3];
      if ((byte2 & 0xC0) !== 0x80 || (byte3 & 0xC0) !== 0x80 || (byte4 & 0xC0) !== 0x80) return false;
      i += 4;
    } else {
      return false;
    }
  }
  return hasMultiByte;
}

export function decodeText(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // 1. UTF-8 검사
  if (isUtf8Bytes(bytes)) {
    try {
      const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
      return utf8Decoder.decode(bytes);
    } catch {
      // UTF-8 디코딩 실패 시 아래 euc-kr로 폴백
    }
  }

  // 2. 한국어 인코딩 디코딩 (euc-kr / cp949)
  try {
    const eucKrDecoder = new TextDecoder('euc-kr');
    return eucKrDecoder.decode(bytes);
  } catch (e) {
    // 최후의 수단: 일반 utf-8
    const fallbackDecoder = new TextDecoder('utf-8');
    return fallbackDecoder.decode(bytes);
  }
}
