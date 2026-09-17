export type DeviceSignals = {
  ua: string;
  platform: string;
  screen: string;
  screenWidth: number;
  screenHeight: number;
  viewport: string;
  viewportWidth: number;
  viewportHeight: number;
  dpr: number;
  orientation: string | null;
  maxTouchPoints: number;
  colorDepth: number;
  language: string;
  timezone: string;
  gpu: string | null;
  safeArea: { top: number; bottom: number; left: number; right: number };
  device_id?: string;
};


function getSafeArea() {
  try {
    const el = document.createElement("div");
    el.style.cssText =
      "position:fixed;left:0;top:0;width:0;height:0;" +
      "padding-top:env(safe-area-inset-top);" +
      "padding-bottom:env(safe-area-inset-bottom);" +
      "padding-left:env(safe-area-inset-left);" +
      "padding-right:env(safe-area-inset-right);";
    document.body.appendChild(el);
    const style = getComputedStyle(el);
    const area = {
      top: parseFloat(style.paddingTop) || 0,
      bottom: parseFloat(style.paddingBottom) || 0,
      left: parseFloat(style.paddingLeft) || 0,
      right: parseFloat(style.paddingRight) || 0,
    };
    el.remove();
    return area;
  } catch {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

function getWebGLRenderer(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    const gl = ctx as WebGLRenderingContext | null;
    if (!gl) return null;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return null;
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
  } catch {
    return null;
  }
}

export function getDeviceFingerprint(): DeviceSignals {
  const orientation =
    (screen.orientation && screen.orientation.type) || null;

  return {
    ua: navigator.userAgent,
    platform: navigator.platform || "",
    screen: `${window.screen.width}x${window.screen.height}`,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    dpr: window.devicePixelRatio,
    orientation,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    colorDepth: window.screen.colorDepth || 24,
    language: navigator.language || "",
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      } catch {
        return "";
      }
    })(),
    gpu: getWebGLRenderer(),
    safeArea: getSafeArea(),
    device_id: (() => {
      try {
        return localStorage.getItem("device_id") || undefined;
      } catch {
        return undefined;
      }
    })(),
  };
}
