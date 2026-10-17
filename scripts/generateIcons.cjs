const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 순수 Node.js(zlib)로 유효한 PNG 생성기
function createPng(size, bgR, bgG, bgB, fgR, fgG, fgB) {
  const width = size;
  const height = size;

  // RGBA raw buffer (각 행 시작에 0x00 필터 바이트 포함)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // 중앙 둥근 사각형/책 아이콘 기하학적 형태 계산
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 책 펼친 형태 또는 북마크 심볼
      const isBookSpine = Math.abs(dx) < width * 0.03 && Math.abs(dy) < height * 0.28;
      const isLeftPage = dx < -width * 0.03 && dx > -width * 0.32 && Math.abs(dy) < height * 0.26;
      const isRightPage = dx > width * 0.03 && dx < width * 0.32 && Math.abs(dy) < height * 0.26;
      const isPageBorder = (isLeftPage || isRightPage) && (Math.abs(dy) > height * 0.22 || Math.abs(dx) > width * 0.28);

      if (dist < radius) {
        if (isBookSpine || isPageBorder || ((isLeftPage || isRightPage) && (y % Math.floor(height * 0.06) < 3))) {
          // 전경색 (밝은 악센트)
          rawData[pxOffset] = fgR;
          rawData[pxOffset + 1] = fgG;
          rawData[pxOffset + 2] = fgB;
          rawData[pxOffset + 3] = 255;
        } else {
          // 배경색 (차콜)
          rawData[pxOffset] = bgR;
          rawData[pxOffset + 1] = bgG;
          rawData[pxOffset + 2] = bgB;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // 투명 또는 둥근 외곽
        rawData[pxOffset] = bgR;
        rawData[pxOffset + 1] = bgG;
        rawData[pxOffset + 2] = bgB;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  // IDAT 압축
  const compressed = zlib.deflateSync(rawData);

  // PNG 청크 생성 헬퍼
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crc = Buffer.alloc(4);
    crc.writeInt32BE(calculateCrc(body), 0);

    return Buffer.concat([len, body, crc]);
  }

  // CRC32 테이블
  function calculateCrc(buf) {
    let c = -1;
    for (let n = 0; n < buf.length; n++) {
      c = crcTable[(c ^ buf[n]) & 0xff] ^ (c >>> 8);
    }
    return c ^ -1;
  }

  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(width, 0);
  IHDR.writeUInt32BE(height, 4);
  IHDR[8] = 8; // Bit depth: 8
  IHDR[9] = 6; // Color type: RGBA (6)
  IHDR[10] = 0; // Compression
  IHDR[11] = 0; // Filter
  IHDR[12] = 0; // Interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', IHDR);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 테이블 초기화
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// 192x192, 512x512 아이콘 생성 (차콜 #151618: 21, 22, 24 / 악센트 #7fa4c7: 127, 164, 199)
const icon192 = createPng(192, 21, 22, 24, 127, 164, 199);
const icon512 = createPng(512, 21, 22, 24, 127, 164, 199);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'icon-maskable.png'), icon512);

console.log('PWA 아이콘 생성 완료! (192, 512, maskable)');
