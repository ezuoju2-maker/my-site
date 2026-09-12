import { useEffect, useState } from "react";
import { getBase } from "../lib/url";
import { API_BASE_URL } from "../lib/api";

type Platform = { code: string; name: string; brand: string };

type OrderAccount = {
  nickname: string | null;
  externalId: string;
  authorizationCode: string | null;
  deviceId: string | null;
  expiresAt: string | null;
};

type Order = {
  id: string;
  platform: string;
  platformName: string;
  platformBrand: string;
  price: number;
  status: string;
  statusLabel: string;
  statusTone: "waiting" | "success" | "expired";
  createdAt: string;
  consumedAt: string | null;
  account: OrderAccount | null;
};

type TabKey = "all" | "waiting" | "authorized";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "waiting", label: "待扫码" },
  { key: "authorized", label: "已授权" },
];

function PlatformLogo({ code, brand, size = 48 }: { code: string; brand: string; size?: number }) {
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
    xiaohongshu: { bg: "#FF2442", text: "小红书", textSize: 0.22 },
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

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}

export default function GrabOrders({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<TabKey>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/grab/me/orders`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json() as Promise<{ ok?: boolean; orders?: Order[]; error?: string }>)
      .then((d) => {
        if (cancelled) return;
        if (d.ok && d.orders) {
          setOrders(d.orders);
        } else {
          setError(d.error || "加载失败");
        }
      })
      .catch(() => { if (!cancelled) setError("网络错误"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function goBack() {
    window.location.href = getBase() + "dashboard/grab/";
  }

  const filtered = orders.filter((o) => {
    if (tab === "all") return true;
    if (tab === "waiting") return o.status === "waiting";
    if (tab === "authorized") return o.status === "consumed";
    return true;
  });

  const inner = (
    <>
      <main className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        {loading && (
          <div className="py-20 text-center text-sm text-neutral-400">加载中…</div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M9 13h6" /><path d="M9 17h6" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-neutral-400">暂无订单</p>
          </div>
        )}

        {!loading && !error && filtered.map((o) => (
          <div key={o.id} className="rounded-2xl border border-neutral-100 bg-white p-4">
            <div className="flex items-start gap-3">
              <PlatformLogo code={o.platform} brand={o.platformBrand} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-neutral-900">
                  {o.platformName}账号授权
                </div>
                <div className="mt-0.5 text-xs text-neutral-500">官方授权服务</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-lg font-bold" style={{ color: "#" + o.platformBrand }}>
                  ¥{o.price.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
              <span className="text-xs text-neutral-400">订单状态</span>
              {o.statusTone === "waiting" && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                  {o.statusLabel}
                </span>
              )}
              {o.statusTone === "success" && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {o.statusLabel}
                </span>
              )}
              {o.statusTone === "expired" && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                  {o.statusLabel}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-neutral-400">购买时间</span>
              <span className="text-xs text-neutral-600">{fmtDate(o.createdAt)}</span>
            </div>

            <button type="button"
              onClick={() => {
                // 点击详情：跳到抓号系统页面看二维码/结果
                window.location.href = getBase() + "dashboard/grab/";
              }}
              className="mt-3 flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 active:bg-neutral-50">
              查看详情
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        ))}
      </main>
    </>
  );

  if (embedded) {
    return inner;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button type="button" onClick={goBack}
            className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-neutral-900">抓号订单</h1>
        </div>

        <div className="mx-auto max-w-2xl px-4">
          <div className="grid grid-cols-3 border-b border-neutral-100">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button key={t.key} type="button" onClick={() => setTab(t.key)}
                  className="relative flex flex-col items-center py-3">
                  <span className={active ? "text-sm font-medium text-neutral-900" : "text-sm text-neutral-500"}>
                    {t.label}
                  </span>
                  {active && <span className="absolute -bottom-px h-0.5 w-10 rounded-full bg-neutral-900" />}
                </button>
              );
            })}
          </div>
        </div>
      </header>
      {inner}
    </div>
  );
}
