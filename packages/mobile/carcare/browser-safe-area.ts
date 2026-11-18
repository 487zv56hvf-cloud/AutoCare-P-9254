/** Actual phones already have a system status bar; desktop preview keeps its simulated one. */
export function useRealBrowserSafeArea() {
 if (typeof document==='undefined' || !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !(navigator.platform==='MacIntel' && navigator.maxTouchPoints>1)) return;
 if (document.getElementById('autocare-device-safe-area')) return;
 const style=document.createElement('style');
 style.id='autocare-device-safe-area';
 style.textContent='html body #__runable_status_bar{display:none!important}html body #root>div:first-child{padding-top:env(safe-area-inset-top,0px)!important}';
 document.head.appendChild(style);
}
