export function getDeviceFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const gl = ctx as WebGLRenderingContext | null;
  let gpu = 'Unknown';
  if (gl && typeof gl.getExtension === 'function') {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
  }

  return {
    ua: navigator.userAgent,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    dpr: window.devicePixelRatio,
    gpu: gpu,
    maxTouchPoints: navigator.maxTouchPoints,
    device_id: localStorage.getItem('device_id') || undefined
  };
}
