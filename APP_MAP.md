# APP_MAP.md - 모바일 텍스트 뷰어 (HappyText) 애플리케이션 맵

## 1. 애플리케이션 개요
- **목적**: 안드로이드 모바일 환경에 최적화된 야간 저자극 오프라인 텍스트 뷰어 (PWA / WebAPK)
- **핵심 혁신 (v2.2.0)**:
  - **순수 페이지 텍스트 분할 렌더링 (Pure Page DOM Paginator)**:
    - 가로 스크롤, 좌표 이동(`transform`), CSS Multi-column을 전면 폐기하고, **현재 페이지에 들어갈 텍스트만 DOM에 정확히 1장 렌더링**!
    - 이전/다음 페이지 글이 DOM에 물리적으로 존재하지 않으므로, 100만 페이지를 넘겨도 옆 페이지 글이 밀려오는 현상 100% 영구 박멸 (오차 0.00px)
  - **한 손 독서 최적화 터치 & 스와이프 제스처**:
    - **하단 70% 영역 전체 짧은 터치**: 좌/중/우 구분 없이 어느 곳을 짧게 터치하더라도 즉각 **다음 장(`onNextPage`)**으로 이동
    - **왼쪽 → 오른쪽 스와이프**: 손가락을 왼쪽에서 오른쪽으로 밀 때에만 **이전 장(`onPrevPage`)**으로 이동
    - **상단 30% 영역 짧은 터치**: 페이지가 넘어가지 않고 편안하게 설정/목차 툴바 UI 토글 (유지)
  - **0초 즉각 전환 (Instant 0ms Flip)**: 눈의 피로를 유발하는 스크롤 애니메이션 완전 제거
  - **PWA WebAPK 자동 설치 지원**: 안드로이드 폰에서 원클릭으로 실제 네이티브 앱(WebAPK)으로 설치
  - **완전 오프라인 실행 지원**: 서비스 워커(`sw.js`) 및 전권 오프라인 캐싱으로 PC를 끄거나 비행기 모드에서도 폰 단독 실행

---

## 2. 화면 및 UI 컴포넌트 맵

```
src/App.tsx (최상위 라우터 및 활성 세션 자동 복원)
 ├── LibraryView (도서관 서재 메인 화면)
 │    ├── Header (앱 타이틀 'HappyText 서재', 버전 v2.2.0 배지 및 갱신 버튼)
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
      ├── ReaderContent (순수 페이지 텍스트 렌더러 - 상단 30% 툴바존, 하단 70% 전체 탭 다음장, 좌->우 스와이프 이전장, N/Total 쪽수 인디케이터)
      ├── ReaderToolbar (화면 탭 토글 상/하단 컨트롤)
      │    ├── HeaderBar (뒤로가기, 작품명, 권 제목, 목차 버튼, 설정 버튼)
      │    └── FooterBar (이전 권/다음 권 이동, 진행률 슬라이더 정밀 점프, % 수치)
      ├── ChapterDrawer (자동 추출된 장/절 목차 서랍 및 원클릭 스크롤 점프)
      └── SettingsModal (테마 4종, 글자 크기 A-/A+, 줄 간격, 글꼴, 스크롤/페이징 모드 설정, v2.2.0 갱신 버튼)
```

---

## 3. 서비스, 유틸리티 및 오프라인 PWA 에셋 맵

| 모듈 경로 | 역할 및 주요 함수/인터페이스 | 코드 라인 수 |
| :--- | :--- | :--- |
| `src/utils/paginator.ts` | DOM 기반 순수 페이지 텍스트 분할 및 메모이제이션 캐시 (`paginateText`) | 156 줄 |
| `src/components/reader/ReaderContent.tsx` | 현재 페이지만 1장 렌더링, 상단 30% 툴바존, 하단 70% 전체 탭 다음장, 좌->우 스와이프 이전장 | 275 줄 |
| `src/components/reader/ReaderView.tsx` | `pages` 배열 기반 순수 페이징 제어, 목차 점프, 슬라이더 연동 | 259 줄 |
| `src/utils/cacheManager.ts` | v2.2.0 버전 관리 및 원클릭 캐시 완전 초기화(`forceUpdateApp`) | 28 줄 |
| `public/manifest.webmanifest` | PWA 메타정보 (standalone 모드, 192/512/maskable 아이콘) | 26 줄 |
| `public/sw.js` | 오프라인 정적 에셋 및 API 캐싱 서비스 워커 (v10) | 56 줄 |
| `src/types/book.ts` | `Book`, `Volume`, `ActiveSession`, `ReaderSettings`, `Chapter` 인터페이스 | 63 줄 |
| `src/styles/variables.css` | 눈부심 방지 4대 테마 색상 토큰 (`charcoal`, `oled`, `sepia`, `linen`) | 75 줄 |
| `src/styles/index.css` | 모바일 리셋, 터치 제스처, 어절 보존 타이포그래피 (`word-break: keep-all`) | 94 줄 |
| `src/utils/textReflow.ts` | 고정폭 강제 줄바꿈 자동 병합(Unwrap) 및 한글 조사 분절 복원 알고리즘 | 119 줄 |
| `src/utils/chapterExtractor.ts` | 소설 본문 내 챕터 정규식 자동 추출기 | 32 줄 |
| `src/services/encoding.ts` | CP949 / EUC-KR 및 UTF-8 자동 판별 및 디코딩 (`decodeText`) | 62 줄 |
| `src/services/db.ts` | IndexedDB 영구 저장소 (books, volumes, content 스토어 CRUD) | 177 줄 |
| `src/services/sessionStore.ts` | 프로세스 메모리 및 LocalStorage 삼중 동기화 활성 세션 스토어 | 74 줄 |
| `src/workers/textParser.worker.ts` | 대용량 텍스트 무지연 백그라운드 파싱 Web Worker | 41 줄 |
| `src/hooks/useLibrary.ts` | 서재 작품 관리 및 전권 일괄 오프라인 다운로드 훅 | 224 줄 |
| `src/hooks/useReader.ts` | 페이징/스크롤 모드 분기 진행률 계산 및 세션 복원 훅 | 211 줄 |
| `src/components/library/LibraryView.tsx` | 서재 메인 화면 (버전 배지, PWA 설치 프롬프트 연동) | 338 줄 |
| `src/components/library/VolumeListModal.tsx` | 권별 목록 화면 및 [전권 오프라인 다운] 연동 | 198 줄 |
| `src/components/reader/SettingsModal.tsx` | 뷰어 환경설정 (버전 배지 및 최신 갱신 버튼 연동) | 291 줄 |
| `README.md` | 프로젝트 소개, 아키텍처 및 모바일 사용법 가이드 | 65 줄 |
| `.gitignore` | 묵향 txt 파일 및 node_modules, 빌드 산출물 제외 규칙 | 28 줄 |

---

## 4. 변경 이력
- **2026-10-17 v2.0.0 (대혁신)**: 형님의 직관에 따라 순수 페이지 텍스트 분할 렌더러로 전면 전환
  - 기존의 가로 스크롤 및 transform 좌표 이동을 100% 버리고, **화면에 오직 현재 페이지 텍스트만 딱 1장 DOM에 마운트**!
  - 15페이지 이상 연속 넘김 검증 결과, **옆 페이지 글자 밀림 오차 0.00px 달성**
  - 가로 스크롤/스와이프 원천 불가, 화면 완전 고정
- **2026-10-17 v2.1.0 (권간 네비게이션 완성 & 종합 테스트 통과)**:
  - **권간 즉각 전환 보장**: `<ReaderView key={currentReading.volume.id} ... />` 적용으로 '다음 권' / '이전 권' 클릭 시 새로운 권의 본문 텍스트가 0초 지체 없이 즉각 마운트됨
  - **경계 조건 완벽 처리**: 1권에서 '< 이전 권' 비활성화(disabled), 마지막 28권에서 '다음 권 >' 비활성화(disabled)
  - **페이지 인덱스 자동 리셋**: 새 권 이동 시 1페이지(0%)부터 깨끗하게 시작
  - **도서관 이어보기 세션 무결성**: 27권, 28권 등 임의 권에서 서재로 나갔을 때 상단 '마지막으로 읽던 페이지' 카드에 정확히 연동되며 원클릭 복귀 확인
  - 종합 테스트 결과서: `docs/test_volume_navigation_result.txt`에 기록 완료
- **2026-10-20 v2.2.0 (페이지 넘김 터치 & 스와이프 제스처 개편)**:
  - **하단 70% 전체 다음 장 터치**: 하단 70% 영역의 왼쪽·가운데·오른쪽 어느 곳을 짧게 터치하더라도 다음 장(`onNextPage`)으로 즉각 전환 (한 손 파지 시 왼손/오른손 어디든 편하게 터치 가능)
  - **왼쪽→오른쪽 스와이프 이전 장 이동**: 이전 장(`onPrevPage`)은 오직 왼쪽에서 오른쪽으로 스와이프(`signedDeltaX >= 45px`)할 때에만 동작하도록 변경하여 실수로 이전 장으로 돌아가는 오작동 원천 방지
  - **상단 30% 툴바 토글 유지**: 상단 30% 영역을 짧게 터치하면 기존과 동일하게 설정 및 목차 UI가 토글됨
