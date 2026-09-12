import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { getBase } from "../lib/url";

type Platform = { code: string; name: string; brand: string };

type Props = {
  platform: Platform;
  qrContent: string;
  onBack: () => void;
  onViewOrders: () => void;
};

function PlatformLogo({ code, brand, size = 88 }: { code: string; brand: string; size?: number }) {
  const base = getBase();
  const inner = Math.round(size * 0.62);
  const radius = Math.round(size * 0.24);
  const bg = "#" + brand;

  if (code === "google") {
    return (
      <span className="flex shrink-0 items-center justify-center"
        style={{ width: size, height: size, background: "#fff", borderRadius: radius, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }}>
        <svg viewBox="0 0 48 48" width={inner} height={inner} xmlns="http://www.w3.org/2000/svg">
          <path d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" fill="#FFC107" />
          <path d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00" />
          <path d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.6 2.5-7.6 2.5-5.3 0-9.7-3.4-11.3-8L6.1 32.3C9.5 38.8 16.2 44 24 44z" fill="#4CAF50" />
          <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.5l.1-.1 6.5 5.5c-.5.4 6.9-5 6.9-15.4 0-1.3-.1-2.3-.4-3.5z" fill="#1976D2" />
        </svg>
      </span>
    );
  }

  const cfg: Record<string, { bg: string; text?: string; textSize?: number; icon?: string }> = {
    xiaohongshu: { bg: "#FF2442", text: "小红书", textSize: 0.2 },
    douyin: { bg: "#000000", icon: "douyin" },
    bilibili: { bg: "#00A1D6", icon: "bilibili" },
    weibo: { bg: "#FDD35C", icon: "sinaweibo" },
    wechat: { bg: "#07C160", icon: "wechat" },
    qq: { bg: "#12B7F5", icon: "qq" },
    discord: { bg: "#5865F2", icon: "discord" },
    zhihu: { bg: "#0084FF", text: "知", textSize: 0.42 },
    xiaoyuzhou: { bg: "#6B4EFF", text: "小宇宙", textSize: 0.14 },
    dewu: { bg: "#000000", text: "得", textSize: 0.42 },
    kuaishou: { bg: "#FF6E00", icon: "kuaishou" },
    taobao: { bg: "#FF5000", text: "淘", textSize: 0.42 },
    jd: { bg: "#E1251B", text: "京东", textSize: 0.22 },
    pinduoduo: { bg: "#E02E24", text: "拼", textSize: 0.42 },
    zsxq: { bg: "#00B26F", text: "星", textSize: 0.42 },
    baidu: { bg: "#2932E1", icon: "baidu" },
    telegram: { bg: "#26A5E4", icon: "telegram" },
    whatsapp: { bg: "#25D366", icon: "whatsapp" },
    twitch: { bg: "#9146FF", icon: "twitch" },
    facebook: { bg: "#1877F2", icon: "facebook" },
    instagram: { bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)", icon: "instagram" },
    youtube: { bg: "#FF0000", icon: "youtube" },
    twitter: { bg: "#000000", icon: "x" },
    threads: { bg: "#000000", icon: "threads" },
    linkedin: { bg: "#0A66C2", text: "in", textSize: 0.36 },
  };

  const conf = cfg[code] || { bg: bg, text: "?", textSize: 0.42 };

  return (
    <span className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, background: conf.bg, borderRadius: radius }}>
      {conf.text ? (
        <span style={{ color: "#fff", fontWeight: 700, fontSize: Math.round(size * (conf.textSize || 0.3)), letterSpacing: "0.3px", fontFamily: "-apple-system, PingFang SC, Microsoft YaHei, sans-serif", lineHeight: 1 }}>{conf.text}</span>
      ) : (
        <img src={base + "icons/" + (conf.icon || code) + ".svg"} alt="" width={inner} height={inner} loading="lazy" style={{ filter: "brightness(0) invert(1)" }} />
      )}
    </span>
  );
}

export default function GrabAuthorizePage({ platform, qrContent, onBack, onViewOrders }: Props) {
  const [toast, setToast] = useState("");
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const theme = "#" + platform.brand;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }

  async function handleSave() {
    try {
      const canvas = canvasWrapRef.current?.querySelector("canvas");
      if (!canvas) {
        showToast("保存失败");
        return;
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        (canvas as HTMLCanvasElement).toBlob(resolve, "image/png"),
      );
      if (!blob) {
        showToast("保存失败");
        return;
      }

      const filename = platform.name + "授权二维码.png";

      // 优先 Web Share API（iOS/Android 弹原生分享，可"存储图像"到相册）
      const file = new File([blob], filename, { type: "image/png" });
      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof (navigator as any).canShare === "function" &&
        (navigator as any).canShare({ files: [file] }) === true &&
        typeof (navigator as any).share === "function";

      if (canShareFiles) {
        try {
          await (navigator as any).share({ files: [file] });
          showToast("已保存到相册");
          return;
        } catch (err) {
          // 用户取消分享，不提示失败
          if ((err as Error).name === "AbortError") return;
          // 其他错误 fallback 到下载
        }
      }

      // Fallback：桌面浏览器走下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("二维码已保存");
    } catch {
      showToast("保存失败");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      {/* 顶部 */}
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button type="button" onClick={onBack}
            className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-neutral-900">{platform.name}账号授权</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        {/* 授权卡 */}
        <section className="rounded-2xl border border-neutral-100 bg-white px-6 py-8 flex flex-col items-center">
          {/* 官方授权服务标签 */}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: theme + "15", color: theme }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            官方授权服务
          </span>

          {/* 大 Logo */}
          <div className="mt-6">
            <PlatformLogo code={platform.code} brand={platform.brand} size={88} />
          </div>

          {/* 标题 */}
          <h2 className="mt-5 text-xl font-bold text-neutral-900">{platform.name}账号授权</h2>
          <p className="mt-2 text-center text-sm leading-6 text-neutral-500">
            请使用{platform.name} App 扫码完成<br />官方授权
          </p>

          {/* QR 码 */}
          <div ref={canvasWrapRef} className="mt-7 rounded-xl border-2 border-neutral-100 bg-white p-4">
            <QRCodeCanvas value={qrContent} size={220} level="M" includeMargin={false} />
          </div>

          {/* 状态 */}
          <div className="mt-6 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-600">当前状态：等待扫码中</span>
          </div>

          {/* 有效期说明 */}
          <div className="mt-5 text-center text-xs leading-6 text-neutral-400">
            <p>二维码持续有效</p>
            <p>授权成功后二维码立即失效</p>
          </div>

          {/* 保存按钮 */}
          <button type="button" onClick={handleSave}
            className="mt-6 h-11 w-full max-w-xs rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 active:bg-neutral-50">
            保存二维码
          </button>
        </section>

        {/* 分隔 + 查看订单 */}
        <div className="mt-6 border-t border-neutral-100" />

        <section className="mt-6 flex flex-col items-center">
          <p className="text-sm text-neutral-500">已购买的抓号服务</p>
          <button type="button" onClick={onViewOrders}
            className="mt-3 flex h-11 items-center gap-1.5 rounded-full px-6 text-sm font-medium text-white"
            style={{ background: theme }}>
            查看抓号订单
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </section>
      </main>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center px-4">
          <div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
