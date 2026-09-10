import { useEffect, useState } from "react";

const MIN_LOADING_TIME = 900;

function getNetworkSpeed() {
  const connection =
    (navigator as Navigator & {
      connection?: {
        effectiveType?: string;
      };
    }).connection;

  return connection?.effectiveType ?? "4g";
}

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    let current = 0;
    let completed = false;

    const networkType = getNetworkSpeed();

    const getTargetProgress = () => {
      const now = performance.now();
      const elapsed = now - startTime;

      if (document.readyState === "loading") {
        return Math.min(65, Math.max(12, Math.round(elapsed / 12)));
      }

      if (document.readyState === "interactive") {
        return 82;
      }

      if (document.readyState === "complete") {
        if (networkType === "slow-2g" || networkType === "2g") {
          return 94;
        }

        if (networkType === "3g") {
          return 97;
        }

        return 99;
      }

      return 20;
    };

    const finish = () => {
      if (completed) {
        return;
      }

      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

      window.setTimeout(() => {
        if (completed) {
          return;
        }

        completed = true;
        setProgress(100);

        window.setTimeout(() => {
          const loadingScreen =
            document.getElementById("loading-screen");

          const loginPage =
            document.getElementById("login-page");

          loadingScreen?.removeAttribute("aria-busy");
          loadingScreen?.remove();

          loginPage?.removeAttribute("hidden");
        }, 120);
      }, remaining);
    };

    const update = () => {
      if (completed) {
        return;
      }

      const target = getTargetProgress();

      if (current < target) {
        const difference = target - current;

        current += Math.max(1, Math.ceil(difference / 6));
        current = Math.min(current, target);

        setProgress(current);
      }

      if (
        document.readyState === "complete" &&
        current >= 99
      ) {
        finish();
      }
    };

    const interval = window.setInterval(update, 50);

    window.addEventListener("load", update);

    update();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("load", update);
    };
  }, []);

  return (
    <main
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-white px-5"
      aria-busy="true"
    >
      <section className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm font-semibold tracking-wide text-neutral-700">
            LOGO
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-neutral-900">
            网站名称
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            欢迎使用网站名称
          </p>
        </div>

        <div className="mt-16">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="页面加载进度"
          >
            <div
              className="h-full rounded-full bg-neutral-900"
              style={{
                width: `${progress}%`,
                transition: "width 80ms linear",
              }}
            />
          </div>

          <div className="mt-4 text-center text-sm font-medium tabular-nums text-neutral-700">
            {progress}%
          </div>
        </div>
      </section>
    </main>
  );
}
