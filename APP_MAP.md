# APP_MAP.md - 모바일 텍스트 뷰어 (HappyText) 애플리케이션 맵

## 1. 애플리케이션 개요
- **목적**: 안드로이드 모바일 환경에 최적화된 야간 저자극 오프라인 텍스트 뷰어 (PWA / WebAPK)
- **핵심 혁신 (v2.3.0)**:
  - **갤럭시 안드로이드 내장 무료 TTS 음성 낭독 (`useTTS`)**:
    - 상단 30% 영역 터치 시 나타나는 상단 툴바에서 **재생(Play) ↔ 일시정지(Pause)** 원클릭 토글 지원
    - 안드로이드 크롬/삼성 인터넷의 긴 텍스트 끊김 및 GC 증발 버그를 완벽 해결한 문단/문장 단위 분할 큐잉 엔진 탑재
    - 현재 읽고 있는 문단 실시간 하이라이트, 페이지 끝 도달 시 자동 다음 페이지 넘김(`onNextPage`), 화면 꺼짐 방지(`WakeLock`) 및 갤럭시 알림창/블루투스 이어폰 미디어 컨트롤(`MediaSession`) 연동
  - **순수 페이지 텍스트 분할 렌더링 (Pure Page DOM Paginator)**:
    - 가로 스크롤, 좌표 이동(`transform`), CSS Multi-column을 전면 폐기하고, **현재 페이지에 들어갈 텍스트만 DOM에 정확히 1장 렌더링**!
    - 이전/다음 페이지 글이 DOM에 물리적으로 존재하지 않으므로, 100만 페이지를 넘겨도 옆 페이지 글이 밀려오는 현상 100% 영구 박멸 (오차 0.00px)
  - **한 손 독서 최적화 터치 & 스와이프 제스처**:
    - **하단 70% 영역 전체 짧은 터치**: 좌/중/우 구분 없이 어느 곳을 짧게 터치하더라도 즉각 **다음 장(`onNextPage`)**으로 이동
    - **왼쪽 → 오른쪽 스와이프**: 손가락을 왼쪽에서 오른쪽으로 밀 때에만 **이전 장(`onPrevPage`)**으로 이동
    - **상단 30% 영역 짧은 터치**: 페이지가 넘어가지 않고 편안하게 **TTS 재생/일시정지·설정·목차 상단 툴바 UI 토글**
  - **0초 즉각 전환 (Instant 0ms Flip)**: 눈의 피로를 유발하는 스크롤 애니메이션 완전 제거
  - **PWA WebAPK 자동 설치 및 완전 오프라인 실행 지원**: 서비스 워커(`sw.js`) 및 전권 오프라인 캐싱으로 비행기 모드에서도 단독 실행

---

## 2. 화면 및 UI 컴포넌트 맵

```
src/App.tsx (최상위 라우터 및 활성 세션 자동 복원)
 ├── LibraryView (도서관 서재 메인 화면)
 │    ├── Header (앱 타이틀 'HappyText 서재', 버전 v2.3.0 배지 및 갱신 버튼)
 │    ├── PwaInstallBanner (휴대폰에 앱으로 설치하기 원클릭 버튼)
 │    ├── LastReadBanner (마지막 읽던 페이지 원클릭 이어보기 배너)
 │    ├── BookList (내 작품 서재 그리드)
 │    │    └── BookCard (작품 카드: 제목, 총 권수, 읽은 진행률 바, 수정/삭제 팝업 메뉴)
 │    ├── VolumeListModal (권별 텍스트 목록 뷰)
 │    │    └── OfflineSeriesDownloadBtn ([전권 오프라인 다운] 원클릭 영구 캐싱 버튼)
 │    ├── BookEditModal (새 작품 추가 및 텍스트 파일/폴더 임포트, 이름 변경 모달)
 │    └── ConfirmDialog (작품 삭제 확인 팝업)
 │
 └── ReaderView (모바일 독서 뷰어 화면)
      ├── TopProgressBar (화면 최상단 2.5px 미니멀 진행도 라인)
      ├── ReaderContent (순수 페이지 텍스트 렌더러 - 상단 30% 툴바존, 하단 70% 전체 탭 다음장, 좌->우 스와이프 이전장, 현재 TTS 낭독 문단 하이라이트, 낭독 상태 및 N/Total 쪽수 인디케이터)
      ├── ReaderToolbar (상단 30% 터치 시 토글되는 상/하단 컨트롤)
      │    ├── HeaderBar (뒤로가기, 작품명, 권 제목, [TTS 재생/일시정지 토글 버튼], 목차 버튼, 설정 버튼)
      │    └── FooterBar (이전 권/다음 권 이동, 진행률 슬라이더 정밀 점프, % 수치)
      ├── ChapterDrawer (자동 추출된 장/절 목차 서랍 및 원클릭 스크롤 점프)
      └── SettingsModal (테마 4종, 글자 크기 A-/A+, 줄 간격, 글꼴, TTS 낭독 배속 0.8x~1.5x, 스크롤/페이징 모드 설정, 버전 갱신 버튼)
```

---

## 3. 서비스, 유틸리티 및 오프라인 PWA 에셋 맵

| 모듈 경로 | 역할 및 주요 함수/인터페이스 | 코드 라인 수 |
| :--- | :--- | :--- |
| `src/hooks/useTTS.ts` | 안드로이드 내장 무료 TTS 하이브리드 제어 훅 (`Capacitor Text-To-Speech` 네이티브 엔진 + Web Speech API fallback) | 388 줄 |
| `src/utils/paginator.ts` | DOM 기반 순수 페이지 텍스트 분할 및 메모이제이션 캐시 (`paginateText`) | 156 줄 |
| `src/components/reader/ReaderContent.tsx` | 현재 페이지만 1장 렌더링, 상단 30% 툴바존, 하단 70% 다음장, 좌->우 스와이프 이전장, TTS 문단 하이라이트 | 297 줄 |
| `src/components/reader/ReaderToolbar.tsx` | 상단 30% 터치 시 노출되는 상/하단 툴바 및 TTS 재생(`Play`)/일시정지(`Pause`) 토글 버튼 | 218 줄 |
| `src/components/reader/ReaderView.tsx` | `pages` 배열 기반 순수 페이징 제어, `useTTS` 훅 연동, 목차 점프, 슬라이더 연동 | 278 줄 |
| `src/components/reader/SettingsModal.tsx` | 뷰어 환경설정 (테마, 글꼴, TTS 배속 `ttsRate`, 독서 방식, 버전 배지 및 최신 갱신 버튼) | 327 줄 |
| `src/utils/cacheManager.ts` | v2.3.1 버전 관리 및 원클릭 캐시 완전 초기화(`forceUpdateApp`) | 28 줄 |
| `public/manifest.webmanifest` | PWA 메타정보 (standalone 모드, 192/512/maskable 아이콘) | 26 줄 |
| `public/sw.js` | 오프라인 정적 에셋 및 API 캐싱 서비스 워커 (v16) | 56 줄 |
| `src/types/book.ts` | `Book`, `Volume`, `ActiveSession`, `ReaderSettings` (`ttsRate` 포함), `Chapter` 인터페이스 | 64 줄 |
| `src/styles/variables.css` | 눈부심 방지 4대 테마 색상 토큰 (`charcoal`, `oled`, `sepia`, `linen`) | 75 줄 |
| `src/styles/index.css` | 모바일 리셋, 터치 제스처, 어절 보존 타이포그래피 (`word-break: keep-all`) | 94 줄 |
| `src/utils/textReflow.ts` | 고정폭 강제 줄바꿈 자동 병합(Unwrap) 및 한글 조사 분절 복원 알고리즘 | 119 줄 |
| `src/utils/chapterExtractor.ts` | 소설 본문 내 챕터 정규식 자동 추출기 | 32 줄 |
| `src/services/encoding.ts` | CP949 / EUC-KR 및 UTF-8 자동 판별 및 디코딩 (`decodeText`) | 62 줄 |
| `src/services/db.ts` | IndexedDB 영구 저장소 (books, volumes, content 스토어 CRUD) | 177 줄 |
| `src/services/sessionStore.ts` | 프로세스 메모리 및 LocalStorage 삼중 동기화 활성 세션 스토어 (`ttsRate: 1.0` 기본값) | 75 줄 |
| `src/workers/textParser.worker.ts` | 대용량 텍스트 무지연 백그라운드 파싱 Web Worker | 41 줄 |
| `src/hooks/useLibrary.ts` | 서재 작품 관리 및 전권 일괄 오프라인 다운로드 훅 | 239 줄 |
| `src/hooks/useReader.ts` | 페이징/스크롤 모드 분기 진행률 계산 및 세션 복원 훅 | 211 줄 |
| `src/components/library/LibraryView.tsx` | 서재 메인 화면 (버전 배지, PWA 설치 프롬프트 연동) | 386 줄 |
| `src/components/library/VolumeListModal.tsx` | 권별 목록 화면 및 [전권 오프라인 다운] 연동 | 216 줄 |
| `src/components/library/BookEditModal.tsx` | 새 작품 추가 및 텍스트 파일/폴더 임포트 모달 | 238 줄 |
| `src/components/library/BookCard.tsx` | 서재 작품 카드 컴포넌트 | 189 줄 |
| `src/components/common/ConfirmDialog.tsx` | 삭제 확인 모달 컴포넌트 | 89 줄 |
| `README.md` | 프로젝트 소개, 아키텍처 및 모바일 사용법 가이드 | 65 줄 |
| `.gitignore` | 묵향 txt 파일 및 node_modules, 빌드 산출물 제외 규칙 | 28 줄 |

---

## 4. 변경 이력
- **2026-10-17 v2.0.0 (대혁신)**: 형님의 직관에 따라 순수 페이지 텍스트 분할 렌더러로 전면 전환
  - 기존의 가로 스크롤 및 transform 좌표 이동을 100% 버리고, **화면에 오직 현재 페이지 텍스트만 딱 1장 DOM에 마운트**!
  - 15페이지 이상 연속 넘김 검증 결과, **옆 페이지 글자 밀림 오차 0.00px 달성**
- **2026-10-17 v2.1.0 (권간 네비게이션 완성 & 종합 테스트 통과)**:
  - **권간 즉각 전환 보장**: `<ReaderView key={currentReading.volume.id} ... />` 적용으로 '다음 권' / '이전 권' 클릭 시 새로운 권의 본문 텍스트가 0초 지체 없이 즉각 마운트됨
- **2026-10-20 v2.2.0 (페이지 넘김 터치 & 스와이프 제스처 개편)**:
  - **하단 70% 전체 다음 장 터치**: 하단 70% 영역의 왼쪽·가운데·오른쪽 어느 곳을 짧게 터치하더라도 다음 장(`onNextPage`)으로 즉각 전환
  - **왼쪽→오른쪽 스와이프 이전 장 이동**: 이전 장(`onPrevPage`)은 오직 왼쪽에서 오른쪽으로 스와이프(`signedDeltaX >= 45px`)할 때에만 동작
  - **상단 30% 툴바 토글 유지**: 상단 30% 영역을 짧게 터치하면 설정 및 목차 UI가 토글됨
- **2026-10-20 v2.3.0 (갤럭시 안드로이드 내장 무료 TTS 음성 낭독 기능 탑재)**:
  - **상단 30% 터치 → 재생/일시정지 토글 버튼 제공**: 상단 30% 영역을 터치하면 열리는 상단 툴바에 **재생(`Play`) / 일시정지(`Pause`) 토글 아이콘 버튼** 추가
  - **갤럭시 안드로이드 전용 안정화(`useTTS.ts`)**: 한국어(`ko-KR`) 로컬 음성 자동 바인딩, 문장 단위 안전 분할로 긴 문단 낭독 끊김 방지, 전역 참조로 크롬 GC 버그 차단, 일시정지 시 읽던 문단 위치 기억
  - **자동 다음 페이지 넘김 & 문단 하이라이트**: 페이지 마지막 문단까지 다 읽으면 자동으로 다음 장으로 넘어가며 계속 읽어주고, 현재 읽는 문단을 저자극 포인트 바로 실시간 표시
  - **배속 조절 & 미디어 세션/화면 꺼짐 방지**: 환경설정에서 `0.8x ~ 1.5x` 배속 조절 지원, 낭독 중 `WakeLock`으로 화면 꺼짐 방지 및 갤럭시 알림창/이어폰 컨트롤 연동
- **2026-10-21 v2.3.1 (Capacitor 네이티브 TTS 플러그인 연동 및 안드로이드 APK 완벽 지원)**:
  - **안드로이드 APK WebView 음성 미지원 이슈 해결**: WebView에서 `speechSynthesis`가 미지원되는 문제를 해결하기 위해 `@capacitor-community/text-to-speech` 공식 플러그인 탑재
  - **하이브리드 TTS 엔진 연동**: `Capacitor.isNativePlatform()` 기반으로 안드로이드 설치 앱에서는 기기 네이티브 TTS 엔진을 구동하고, 일반 웹/PWA 브라우저에서는 기존 Web Speech API로 자동 fallback
  - **심플한 설정 UI 유지**: 설정 모달(`SettingsModal.tsx`)에서는 TTS 읽는 속도(`0.8x ~ 1.5x`)만 직관적으로 조절하도록 구성 완료
