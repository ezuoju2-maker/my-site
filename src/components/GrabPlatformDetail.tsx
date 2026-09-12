
import { getBase } from "../lib/url";

type Platform = {
  code: string;
  name: string;
  brand: string;
  iconSlug: string;
  price: number;
  ttlMinSeconds: number | null;
  ttlMaxSeconds: number | null;
  ttlNote: string | null;
};

type Props = {
  platform: Platform;
  onBack: () => void;
  onBuy: () => void;
  loading: boolean;
};

function formatTtl(seconds: number | null): string {
  if (seconds === null) return "";
  if (seconds === 0) return "永久";
  if (seconds < 60) return seconds + "秒";
  if (seconds < 3600) return Math.round(seconds / 60) + "分钟";
  if (seconds < 86400) return Math.round(seconds / 3600) + "小时";
  if (seconds < 2592000) return Math.round(seconds / 86400) + "天";
  return Math.round(seconds / 2592000) + "个月";
}

function ttlRange(minSec: number | null, maxSec: number | null): string {
  if (minSec === null && maxSec === null) return "以平台规则为准";
  if (minSec === 0 && maxSec === 0) return "永久有效";
  const min = formatTtl(minSec);
  const max = formatTtl(maxSec);
  if (!min && !max) return "以平台规则为准";
  if (!min) return "最长 " + max;
  if (!max) return "至少 " + min;
  if (min === max) return min;
  return min + " ~ " + max;
}

function PlatformLogo({ code, size = 64 }: { code: string; size?: number }) {
  const base = getBase();
  const inner = Math.round(size * 0.62);
  const radius = Math.round(size * 0.24);

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
    xiaohongshu: { bg: "#FF2442", text: "小红书", textSize: 0.24 },
    douyin: { bg: "#000000", icon: "douyin" },
    bilibili: { bg: "#00A1D6", icon: "bilibili" },
    weibo: { bg: "#FDD35C", icon: "sinaweibo" },
    wechat: { bg: "#07C160", icon: "wechat" },
    qq: { bg: "#12B7F5", icon: "qq" },
    discord: { bg: "#5865F2", icon: "discord" },
    zhihu: { bg: "#0084FF", text: "知", textSize: 0.42 },
    xiaoyuzhou: { bg: "#6B4EFF", text: "小宇宙", textSize: 0.16 },
    dewu: { bg: "#000000", text: "得", textSize: 0.42 },
    kuaishou: { bg: "#FF6E00", icon: "kuaishou" },
    taobao: { bg: "#FF5000", text: "淘", textSize: 0.42 },
    jd: { bg: "#E1251B", text: "京东", textSize: 0.24 },
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

  const conf = cfg[code];

  if (!conf) {
    return (
      <span className="flex shrink-0 items-center justify-center"
        style={{ width: size, height: size, background: "#F0F0F0", borderRadius: radius }}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.42)} height={Math.round(size * 0.42)} fill="#9CA3AF">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, background: conf.bg, borderRadius: radius }}>
      {conf.text ? (
        <span style={{ color: "#fff", fontWeight: 700, fontSize: Math.round(size * (conf.textSize || 0.3)), letterSpacing: "0.3px", fontFamily: "-apple-system, PingFang SC, Microsoft YaHei, sans-serif", lineHeight: 1 }}>{conf.text}</span>
      ) : (
        <img src={base + "icons/" + conf.icon + ".svg"} alt="" width={inner} height={inner} loading="lazy" style={{ filter: "brightness(0) invert(1)" }} />
      )}
    </span>
  );
}

export default function GrabPlatformDetail({ platform: p, onBack, onBuy, loading }: Props) {
  const theme = "#" + p.brand;

  const feats = [
    { t: "生成专属授权二维码", s: "购买成功后生成，支持" + p.name + " App 扫码授权" },
    { t: "获取授权后的账号信息", s: "包含账号昵称、ID、授权编号等信息" },
    { t: "查看授权记录", s: "随时查看授权状态与历史记录" },
    { t: "在有效期内查看授权状态", s: "实时掌握账号授权情况" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">{p.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-5 py-4">
        <section className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="relative z-10 flex items-center gap-4">
            <PlatformLogo code={p.code} size={64} />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-neutral-900">{p.name}账号授权</h2>
              <p className="mt-1 text-sm text-neutral-500">官方授权 | 安全可靠 | 快速高效</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: theme + "18", color: theme }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                官方授权服务
              </span>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 opacity-[0.08]">
            <PlatformLogo code={p.code} size={140} />
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-neutral-900">{p.name}账号授权服务</h3>
              <p className="mt-2 text-xs leading-5 text-neutral-500">购买后可生成专属授权二维码</p>
              <p className="text-xs leading-5 text-neutral-500">请使用{p.name} App 完成官方授权</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-3xl font-bold leading-none" style={{ color: theme }}>¥{p.price.toFixed(2)}</div>
              <div className="mt-1 text-xs text-neutral-400">/ 次</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
            </svg>
            <h3 className="text-base font-bold text-neutral-900">购买后可获得</h3>
          </div>
          <div className="mt-4 space-y-4">
            {feats.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: theme + "18" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {i === 0 && <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>}
                    {i === 1 && <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}
                    {i === 2 && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></>}
                    {i === 3 && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>}
                  </svg>
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="text-sm font-medium text-neutral-900">{f.t}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">{f.s}</div>
                </div>
                <svg className="mt-2 h-4 w-4 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl p-5" style={{ background: theme + "0A" }}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-neutral-600">授权有效期</div>
              <div className="mt-0.5 text-lg font-bold text-neutral-900">以平台规则为准</div>
              <span className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: theme + "18", color: theme }}>
                预计：{ttlRange(p.ttlMinSeconds, p.ttlMaxSeconds)}
              </span>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                {p.ttlNote ? p.ttlNote + "。" : ""}实际有效期以平台官方规则及授权结果为准。
              </p>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-bold leading-none" style={{ color: theme }}>¥{p.price.toFixed(2)}</div>
            <div className="mt-1 text-xs text-neutral-400">/ 次</div>
          </div>
          <button type="button" disabled={loading} onClick={onBuy}
            className="h-12 shrink-0 rounded-full px-10 text-base font-medium text-white disabled:opacity-60"
            style={{ background: theme }}>
            {loading ? "生成中…" : "立即购买"}
          </button>
        </div>
      </div>
    </div>
  );
}
