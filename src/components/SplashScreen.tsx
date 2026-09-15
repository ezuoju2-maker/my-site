import { useEffect, useRef, useState } from "react";
import { withBase } from "../lib/url";
import { useTranslation } from "../i18n/useTranslation";

const FADE_MS = 600;
const MAX_WAIT_MS = 5000;
const SPLASH_SRC = `${import.meta.env.BASE_URL}splash.mp4`;
const DEMON_SRC = `${import.meta.env.BASE_URL}demon.webm`;

type Phase = "splash" | "welcome" | "done";

export default function SplashScreen() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("splash");
  const [videoFading, setVideoFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const advancedRef = useRef(false);

  function advanceToWelcome() {
    if (advancedRef.current) return;
    advancedRef.current = true;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVideoFading(true);
    window.setTimeout(() => setPhase("welcome"), FADE_MS);
  }

  useEffect(() => {
    timeoutRef.current = window.setTimeout(advanceToWelcome, MAX_WAIT_MS);
    const v = videoRef.current;
    if (v) v.play().catch(() => advanceToWelcome());
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goLogin() {
    setPhase("done");
  }

  function goRegister() {
    window.location.href = withBase("register/");
  }

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      {phase === "splash" && (
        <div
          className={`absolute inset-0 bg-white transition-opacity duration-500 ${
            videoFading ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <video
            ref={videoRef}
            src={SPLASH_SRC}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={advanceToWelcome}
            onError={advanceToWelcome}
          />
        </div>
      )}

      {phase === "welcome" && (
        <div className="flex h-full w-full items-center justify-center bg-white px-8">
          <div className="relative w-full max-w-md">
            {/* 左上角小猫恶魔（镜像 + multiply 透明） */}
            <video
              src={DEMON_SRC}
              className="pointer-events-none absolute -left-8 -top-8 h-20 w-20 object-contain sm:-left-10 sm:-top-10 sm:h-24 sm:w-24"
              autoPlay
              muted
              loop
              playsInline
              preload="auto" style={{ transform: "scaleX(-1)" }}
            />

            {/* 右上角小猫恶魔（multiply 透明） */}
            <video
              src={DEMON_SRC}
              className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 object-contain sm:-right-10 sm:-top-10 sm:h-24 sm:w-24"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />

            {/* 卡片框架 */}
            <div className="rounded-3xl border border-neutral-200 bg-white px-8 py-10 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm font-semibold tracking-wide text-neutral-700">
                LOGO
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                {t("login.site_name")}
              </h1>

              <p className="mt-2 text-sm text-neutral-500">
                {t("login.welcome")}
              </p>

              <div className="mt-10 space-y-3">
                <button
                  type="button"
                  onClick={goLogin}
                  className="h-12 w-full rounded-lg bg-neutral-900 text-base font-medium text-white"
                >
                  {t("login.submit")}
                </button>

                <button
                  type="button"
                  onClick={goRegister}
                  className="h-12 w-full rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-900"
                >
                  {t("login.register")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
