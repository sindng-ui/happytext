# 안드로이드 APK 내장 TTS 지원 (Capacitor Text-To-Speech) 구현 계획서

## 1. 개요 및 원인 분석
- **발생 오류**: `"이 기기 또는 브라우저에서는 내장 TTS 음성 합성을 지원하지 않습니다."`
- **근본 원인**:
  - 일반 웹 브라우저(크롬, 삼성인터넷)에는 `window.speechSynthesis` (Web Speech API)가 내장되어 있습니다.
  - 하지만 안드로이드 APK 앱(Capacitor WebView) 환경에서는 보안 및 시스템 WebView 스펙상 `window.speechSynthesis`가 탑재되어 있지 않거나 작동하지 않습니다.
- **해결책**:
  - Capacitor 8과 완벽 호환되는 네이티브 플러그인 `@capacitor-community/text-to-speech`를 도입합니다.
  - `useTTS.ts`를 개편하여:
    - **Capacitor 네이티브 앱**: 기기의 네이티브 TTS 엔진(삼성 TTS / Google 음성 서비스)을 직접 호출하여 무중단 고음질 낭독 구현.
    - **웹/PWA 환경**: 기존 웹 표준 Web Speech API(`window.speechSynthesis`)로 안전하게 fallback 동작.

---

## 2. 작업 상세 내용

### Phase 1: 플러그인 설치 및 안드로이드 동기화
- `npm install @capacitor-community/text-to-speech`
- `npx cap sync android`

### Phase 2: `src/hooks/useTTS.ts` 네이티브 하이브리드 지원
- `Capacitor.isNativePlatform()` 감지
- 네이티브 모드일 때:
  - `@capacitor-community/text-to-speech`의 `TextToSpeech.speak()`, `TextToSpeech.stop()` 활용
  - 문단 단위/문장 단위 순차 재생 및 자동 페이지 넘김 로직 그대로 연동
  - 배속(`rate`), 언어(`ko-KR`) 연동
- 웹 모드일 때:
  - 기존 `window.speechSynthesis` 기반 로직 유지
- 미디어 세션 및 WakeLock 연동 유지

### Phase 3: 빌드 및 APK 생성
- `npm run build`
- `npx cap sync android`
- `.\gradlew.bat assembleDebug`
- 최신 APK를 루트 [`HappyText-v2.3.0.apk`](file:///K:/Antigravity_Projects/gitbase/happytext/HappyText-v2.3.0.apk)로 복사

### Phase 4: `APP_MAP.md` 문서 최신화

---

## 3. 검증 계획
1. TypeScript 컴파일 검증 (`npm run build`)
2. Capacitor Android 동기화 검증 (`npx cap sync android`)
3. 안드로이드 APK 릴리즈 빌드 검증 (`gradlew assembleDebug`)
4. APK 생성 확인
