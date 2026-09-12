import { useCallback, useEffect, useState } from "react";
import { getBase } from "../lib/url";
import { API_BASE_URL } from "../lib/api";

type Binding = {
  id: string;
  accountId: string;
  displayName: string;
  note: string;
  status: string;
  lastDetectedAt: string | null;
  lastOnlineStatus: string;
  lastAccountStatus: string;
  createdAt: string;
  updatedAt: string;
  platform: string;
  platformName: string;
  platformBrand: string;
  nickname: string | null;
  externalId: string;
  authorizationCode: string | null;
  accountExpiresAt: string | null;
};

type AvailableAccount = {
  accountId: string;
  platform: string;
  platformName: string;
  platformBrand: string;
  nickname: string | null;
  externalId: string;
  authorizationCode: string | null;
  accountStatus: string;
  accountExpiresAt: string | null;
  grantExpiresAt: string | null;
};

type Tab = "mine" | "add";

type Props = {
  onBack: () => void;
  onOpenDetail: (bindingId: string) => void;
};

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

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}

function onlineLabel(status: string): { text: string; dot: string; cls: string } {
  switch (status) {
    case "online": return { text: "当前在线", dot: "bg-emerald-500", cls: "text-emerald-600" };
    case "offline": return { text: "当前离线", dot: "bg-neutral-400", cls: "text-neutral-500" };
    case "checking": return { text: "检测中", dot: "bg-amber-500 animate-pulse", cls: "text-amber-600" };
    default: return { text: "无法检测", dot: "bg-neutral-300", cls: "text-neutral-400" };
  }
}

function accountStatusLabel(status: string): { text: string; cls: string } {
  switch (status) {
    case "normal": return { text: "正常", cls: "text-emerald-600" };
    case "risk": return { text: "风险提醒", cls: "text-amber-600" };
    case "limited": return { text: "功能受限", cls: "text-orange-600" };
    case "violation": return { text: "违规", cls: "text-orange-600" };
    case "banned": return { text: "封禁", cls: "text-red-600" };
    case "error": return { text: "异常", cls: "text-red-600" };
    case "checking": return { text: "检测中", cls: "text-blue-600" };
    default: return { text: "无法检测", cls: "text-neutral-400" };
  }
}

export default function GrabberSystem({ onBack, onOpenDetail }: Props) {
  const [tab, setTab] = useState<Tab>("mine");
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [available, setAvailable] = useState<AvailableAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadMine = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/bindings`, { credentials: "include", cache: "no-store" });
      const d = (await r.json()) as { ok?: boolean; bindings?: Binding[] };
      if (d.ok && d.bindings) setBindings(d.bindings);
    } catch {}
  }, []);

  const loadAvailable = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/available`, { credentials: "include", cache: "no-store" });
      const d = (await r.json()) as { ok?: boolean; accounts?: AvailableAccount[] };
      if (d.ok && d.accounts) setAvailable(d.accounts);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMine(), loadAvailable()])
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [loadMine, loadAvailable]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }

  async function handleAdd(acc: AvailableAccount) {
    if (!window.confirm(`确认添加「${acc.nickname || acc.externalId}」到上号系统？`)) return;
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/bindings`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: acc.accountId }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) {
        showToast(d.error === "NO_PERMISSION" ? "无权限" : "添加失败");
        return;
      }
      showToast("✓ 已添加到上号系统");
      await Promise.all([loadMine(), loadAvailable()]);
      setTab("mine");
    } catch {
      showToast("网络错误");
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
          <h1 className="text-base font-semibold text-neutral-900">上号系统</h1>
        </div>

        <div className="mx-auto max-w-2xl px-4">
          <div className="grid grid-cols-2 border-b border-neutral-100">
            <button type="button" onClick={() => setTab("mine")}
              className="relative flex flex-col items-center py-3">
              <span className={tab === "mine" ? "text-sm font-medium text-neutral-900" : "text-sm text-neutral-500"}>我的账号</span>
              {tab === "mine" && <span className="absolute -bottom-px h-0.5 w-14 rounded-full bg-neutral-900" />}
            </button>
            <button type="button" onClick={() => setTab("add")}
              className="relative flex flex-col items-center py-3">
              <span className={tab === "add" ? "text-sm font-medium text-neutral-900" : "text-sm text-neutral-500"}>添加授权账号</span>
              {tab === "add" && <span className="absolute -bottom-px h-0.5 w-20 rounded-full bg-neutral-900" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        {loading && <div className="py-20 text-center text-sm text-neutral-400">加载中…</div>}
        {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        {/* 我的账号 */}
        {!loading && tab === "mine" && (
          <>
            {bindings.length === 0 ? (
              <Empty icon="account" text="暂无绑定账号" hint="去「添加授权账号」绑定你的已授权账号" />
            ) : (
              bindings.map((b) => {
                const online = onlineLabel(b.lastOnlineStatus);
                const acc = accountStatusLabel(b.lastAccountStatus);
                return (
                  <button key={b.id} type="button" onClick={() => onOpenDetail(b.id)}
                    className="w-full rounded-2xl border border-neutral-100 bg-white p-4 text-left active:bg-neutral-50">
                    <div className="flex items-start gap-3">
                      <PlatformLogo code={b.platform} brand={b.platformBrand} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-neutral-900">{b.displayName}</div>
                        <div className="mt-0.5 text-xs text-neutral-500">{b.platformName} · {b.externalId}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className={"flex items-center gap-1.5 " + online.cls}>
                            <span className={"h-1.5 w-1.5 rounded-full " + online.dot} />
                            {online.text}
                          </span>
                          <span className={acc.cls}>账号状态：{acc.text}</span>
                        </div>
                      </div>
                      <svg className="mt-2 h-5 w-5 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                    {b.lastDetectedAt && (
                      <div className="mt-3 border-t border-neutral-100 pt-2 text-xs text-neutral-400">
                        最后检测：{fmtDate(b.lastDetectedAt)}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </>
        )}

        {/* 添加授权账号 */}
        {!loading && tab === "add" && (
          <>
            {available.length === 0 ? (
              <Empty icon="account" text="暂无可添加账号" hint="完成官方授权后，会出现在这里" />
            ) : (
              <>
                <p className="px-1 text-xs text-neutral-500">已完成官方授权、尚未绑定的账号：</p>
                {available.map((a) => (
                  <div key={a.accountId}
                    className="rounded-2xl border border-neutral-100 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <PlatformLogo code={a.platform} brand={a.platformBrand} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-neutral-900">
                          {a.nickname || a.externalId}
                        </div>
                        <div className="mt-0.5 text-xs text-neutral-500">{a.platformName} · {a.externalId}</div>
                        <div className="mt-1 text-xs text-emerald-600">授权有效</div>
                      </div>
                      <button type="button" onClick={() => handleAdd(a)}
                        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white">
                        添加
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </main>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center px-4">
          <div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}

function Empty({ icon, text, hint }: { icon: string; text: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {icon === "account" ? (
            <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
          ) : (
            <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>
          )}
        </svg>
      </div>
      <p className="mt-4 text-sm text-neutral-400">{text}</p>
      <p className="mt-1 text-xs text-neutral-300">{hint}</p>
    </div>
  );
}
