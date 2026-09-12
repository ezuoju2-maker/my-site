import { useState } from "react";
import { getBase } from "../lib/url";

type Order = {
  id: string;
  platform: string;
  platformName: string;
  platformBrand: string;
  createdAt: string;
  consumedAt: string | null;
  account: {
    nickname: string | null;
    externalId: string;
    authorizationCode: string | null;
    expiresAt: string | null;
  } | null;
};

type Props = {
  order: Order;
  onBack: () => void;
  onAddToGrabber: () => void;
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

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}

export default function GrabAuthorizationInfo({ order, onBack, onAddToGrabber }: Props) {
  const [toast, setToast] = useState("");
  const theme = "#" + order.platformBrand;
  const acc = order.account;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }

  async function copyText(text: string, label = "已复制") {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast("复制失败");
    }
  }

  if (!acc) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        <Header onBack={onBack} />
        <div className="py-20 text-center text-sm text-red-500">授权信息缺失</div>
      </div>
    );
  }

  const authCode = acc.authorizationCode || order.id.slice(0, 16).toUpperCase();
  const infoText = [
    "平台：" + order.platformName,
    "账号昵称：" + (acc.nickname || "—"),
    "平台账号ID：" + acc.externalId,
    "授权ID：" + authCode,
    "授权状态：有效",
    "授权时间：" + fmtTime(order.consumedAt || order.createdAt),
    "授权有效期：" + (acc.expiresAt ? fmtTime(acc.expiresAt) : "以平台官方规则为准"),
  ].join("\n");

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <Header onBack={onBack} />

      <main className="mx-auto max-w-2xl space-y-3 px-5 py-4">
        {/* 头部卡 */}
        <section className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white py-8">
          <PlatformLogo code={order.platform} brand={order.platformBrand} size={88} />
          <h2 className="mt-5 text-xl font-bold text-neutral-900">{order.platformName}账号授权</h2>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            授权状态：有效
          </span>
        </section>

        {/* 账号信息 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-neutral-900">账号信息</h3>
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-xs text-neutral-500">账号昵称</div>
              <div className="text-sm font-medium text-neutral-900">{acc.nickname || "—"}</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-neutral-500">平台账号 ID</div>
              <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3">
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-neutral-800">
                  {acc.externalId}
                </span>
                <button type="button"
                  onClick={() => copyText(acc.externalId, "账号 ID 已复制")}
                  className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-white"
                  style={{ background: theme }}>
                  复制
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 授权信息 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-neutral-900">授权信息</h3>
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-xs text-neutral-500">授权 ID</div>
              <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3">
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-neutral-800">
                  {authCode}
                </span>
                <button type="button"
                  onClick={() => copyText(authCode, "授权 ID 已复制")}
                  className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-white"
                  style={{ background: theme }}>
                  复制
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs text-neutral-500">授权时间</div>
              <div className="text-sm text-neutral-900">
                {fmtTime(order.consumedAt || order.createdAt)}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs text-neutral-500">授权有效期</div>
              <div className="text-sm text-neutral-900">
                {acc.expiresAt ? fmtTime(acc.expiresAt) : "以平台官方规则为准"}
              </div>
            </div>
          </div>
        </section>

        {/* 上号系统 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-5">
          <h3 className="mb-3 text-base font-bold text-neutral-900">上号系统</h3>
          <p className="text-xs leading-5 text-neutral-500">此授权可用于绑定上号系统</p>

          <button type="button" onClick={onAddToGrabber}
            className="mt-4 flex h-12 w-full items-center justify-center gap-1.5 rounded-xl text-base font-medium text-white"
            style={{ background: theme }}>
            添加到上号系统
          </button>

          <button type="button"
            onClick={() => copyText(infoText, "授权信息已复制")}
            className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-base font-medium text-neutral-700">
            复制授权信息
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

function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
        <button type="button" onClick={onBack}
          className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-neutral-900">授权信息</h1>
      </div>
    </header>
  );
}
