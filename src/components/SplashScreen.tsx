import { useEffect, useRef, useState } from "react";

// 淡出动画时长（毫秒）
const FADE_MS = 600;
// 视频最长播放时长（毫秒），超过就强制跳过
// 避免视频卡住导致用户永远进不去
const MAX_WAIT_MS = 5000;

const SPLASH_SRC = `${import.meta.env.BASE_URL}splash.mp4`;

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  function dismiss() {
    if (doneRef.current) return;
    doneRef.current = true;

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setFading(true);
    window.setTimeout(() => setVisible(false), FADE_MS);
  }

  useEffect(() => {
    // 超时保护
    timeoutRef.current = window.setTimeout(dismiss, MAX_WAIT_MS);

    // 尝试自动播放（iOS 需要 muted + playsinline）
    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {
        // 自动播放被浏览器拦截 → 直接跳过
        dismiss();
      });
    }

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950 transition-opacity duration-500 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={fading}
    >
      <video
        ref={videoRef}
        src={SPLASH_SRC}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={dismiss}
        onError={dismiss}
      />
    </div>
  );
}
