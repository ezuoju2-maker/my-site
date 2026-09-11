import { useEffect, useState } from "react";

// 总时长（毫秒）：无论网络快慢，最多显示这么久
const TOTAL_DURATION = 1200;

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let finished = false;
    const startTime = performance.now();

    const finish = () => {
      if (finished) return;
      finished = true;
      setProgress(100);

      window.setTimeout(() => {
        const loadingEl = document.getElementById("loading-screen");
        const loginEl = document.getElementById("login-page");
        loadingEl?.removeAttribute("aria-busy");
        loadingEl?.remove();
        loginEl?.removeAttribute("hidden");
      }, 120);
    };

    // 每 50ms 更新一次进度：0 → 99
    const progressTimer = window.setInterval(() => {
      if (finished) return;
      const elapsed = performance.now() - startTime;
      const ratio = Math.min(1, elapsed / TOTAL_DURATION);
      // 用 1.1 倍系数保证 99 前结束
      const pct = Math.min(99, Math.floor(ratio * 110));
      setProgress(pct);
    }, 50);

    // 硬性总时长后强制完成（不依赖 document.readyState）
    const finishTimer = window.setTimeout(finish, TOTAL_DURATION);

    return () => {
      finished = true;
      window.clearInterval(progressTimer);
      window.clearTimeout(finishTimer);
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
