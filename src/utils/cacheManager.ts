// 앱 버전 및 캐시 강제 갱신 유틸리티

export const APP_VERSION = 'v2.2.0';
export const APP_BUILD_DESC = '하단 70% 전체 다음장 터치 & 우측 스와이프 이전장';

export async function forceUpdateApp(): Promise<void> {
  try {
    // 1. 모든 서비스 워커 캐시 완전 삭제
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    // 2. 서비스 워커 등록 해제 및 재등록
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // 3. 페이지 강제 새로고침
    window.location.href = window.location.pathname + '?v=' + Date.now();
  } catch (err) {
    console.error('강제 업데이트 실패:', err);
    window.location.reload();
  }
}
