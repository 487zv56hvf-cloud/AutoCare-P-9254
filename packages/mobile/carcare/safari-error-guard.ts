/** Safari can report opaque browser/extension errors with no source or exception.
 * Keep diagnostics, but don't turn this non-actionable event into an app-wide crash.
 * Errors with a real exception, filename, or line number remain untouched.
 */
export function installSafariErrorGuard() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  const ua = navigator.userAgent;
  if (!/AppleWebKit/.test(ua) || !/iPhone|iPad|iPod/.test(ua)) return;
  const handle = (event: ErrorEvent) => {
    if (event.message !== 'Script error.' || event.error != null || event.filename || event.lineno || event.colno) return;
    console.warn('[AutoCare] Safari reported an opaque script error without source details.', {
      message: event.message, time: new Date().toISOString(), visibility: document.visibilityState,
    });
    event.stopImmediatePropagation();
    // Do not preventDefault: Safari's native diagnostics still receive the event.
  };
  window.addEventListener('error', handle, true);
}
