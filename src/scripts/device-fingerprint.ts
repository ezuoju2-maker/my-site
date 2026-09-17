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
  device_id?: string;
};

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
    device_id: (() => {
      try {
        return localStorage.getItem("device_id") || undefined;
      } catch {
        return undefined;
      }
    })(),
  };
}
