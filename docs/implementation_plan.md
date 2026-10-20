# 독서 뷰어 페이지 넘김 터치/스와이프 제스처 개편 계획서 (v2.2.0)

## 1. 개요 및 목표
형님의 요청에 따라 한 손으로 편하게 독서할 수 있도록 페이징 모드의 터치 영역과 이전 페이지 이동 제스처를 개편합니다.
- **기존 (AS-IS)**:
  - 상단 30% 짧은 터치: 설정/목차 툴바 UI 토글
  - 하단 70% 영역: 좌측(35%) 터치 시 이전 장, 우측(35%) 터치 시 다음 장, 중앙(30%) 터치 시 툴바 토글
- **개편 (TO-BE)**:
  - **상단 30% 영역 짧은 터치**: 기존과 동일하게 설정/목차 등 툴바 UI 표시/숨김 토글 (유지)
  - **하단 70% 영역 짧은 터치**: 좌/중/우 구분 없이 **어느 곳을 짧게 터치하더라도 무조건 다음 장(`onNextPage`)**으로 이동
  - **이전 장 이동 제스처**: 오직 **왼쪽에서 오른쪽으로 스와이프(Left-to-Right Swipe)** 할 때에만 이전 장(`onPrevPage`)으로 이동

---

## 2. 상세 구현 내역

### 2.1 `src/components/reader/ReaderContent.tsx`
- **터치 제스처 판별 로직 (`handleTouchStart`, `handleTouchEnd`)**:
  - `signedDeltaX = touch.clientX - touchStartXRef.current` (양수면 왼쪽→오른쪽 이동)
  - `absDeltaX = Math.abs(signedDeltaX)`, `absDeltaY = Math.abs(touch.clientY - touchStartYRef.current)`
  - `deltaTime = Date.now() - touchStartTimeRef.current`
  - **케이스 1: 왼쪽에서 오른쪽 스와이프 (`signedDeltaX >= 45 && absDeltaX > absDeltaY * 1.3 && deltaTime <= 600`)**
    - `onPrevPage()` 호출하여 이전 장으로 즉각 전환
  - **케이스 2: 짧은 터치 (`absDeltaX <= 15 && absDeltaY <= 15 && deltaTime <= 350`)**
    - `clickRatioY < 0.30` (상단 30%): `onToggleToolbar()` 호출
    - `clickRatioY >= 0.30` (하단 70% 전체): `onNextPage()` 호출
  - **케이스 3: 그 외 드래그/스와이프**
    - 오작동 방지를 위해 무시
- **데스크톱 마우스 호환 (`handleMouseDown`, `handleContentClick`)**:
  - PC 환경 및 테스트에서도 동일하게 마우스 좌→우 드래그 시 `onPrevPage()`, 상단 30% 클릭 시 `onToggleToolbar()`, 하단 70% 클릭 시 `onNextPage()` 동작하도록 지원

### 2.2 버전 및 캐시 업데이트 (`src/utils/cacheManager.ts`, `public/sw.js`)
- `APP_VERSION`을 `v2.2.0`으로 업데이트 (`하단 70% 전체 다음장 터치 & 우측 스와이프 이전장`)
- `public/sw.js`의 `CACHE_NAME`을 `happytext-cache-v10`으로 갱신하여 모바일 PWA에서 즉시 새 제스처 로직이 반영되도록 처리

### 2.3 `APP_MAP.md` 문서 업데이트
- `ReaderContent`의 역할 설명 및 변경 이력(v2.2.0) 반영
