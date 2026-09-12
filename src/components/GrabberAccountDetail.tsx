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

type Props = {
  bindingId: string;
  onBack: () => void;
  onRemoved: () => void;
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

export default function GrabberAccountDetail({ bindingId, onBack, onRemoved }: Props) {
  const [binding, setBinding] = useState<Binding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/bindings/${encodeURIComponent(bindingId)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const d = (await r.json()) as { ok?: boolean; binding?: Binding; error?: string };
      if (d.ok && d.binding) {
        setBinding(d.binding);
        setEditName(d.binding.displayName || "");
        setEditNote(d.binding.note || "");
      } else {
        setError(d.error === "NOT_FOUND" ? "账号不存在" : "加载失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [bindingId]);

  useEffect(() => { void load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }

  async function handleDetect() {
    if (detecting) return;
    setDetecting(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/bindings/${encodeURIComponent(bindingId)}/detect`, {
        method: "POST",
        credentials: "include",
      });
      const d = (await r.json()) as { ok?: boolean };
      if (d.ok) {
        showToast("检测完成");
        await load();
      } else {
        showToast("检测失败");
      }
    } catch {
      showToast("网络错误");
    } finally {
      setDetecting(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/bindings/${encodeURIComponent(bindingId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: editName, note: editNote }),
      });
      const d = (await r.json()) as { ok?: boolean };
      if (d.ok) {
        showToast("已保存");
        setShowEdit(false);
        await load();
      } else {
        showToast("保存失败");
      }
    } catch {
      showToast("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm("解除账号绑定？\n\n此操作会从「我的账号」中移除，但不会删除原始抓码订单，也不代表撤销平台官方授权。")) return;
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/bindings/${encodeURIComponent(bindingId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const d = (await r.json()) as { ok?: boolean };
      if (d.ok) {
        showToast("已解除绑定");
        window.setTimeout(onRemoved, 600);
      } else {
        showToast("解除失败");
      }
    } catch {
      showToast("网络错误");
    }
  }

  function handleEnterAccount() {
    // 当前平台未接入真实官方 App Scheme/Universal Link
    // 按规范：不支持直接进入时，弹提示
    alert(
      "当前平台暂不支持直接打开 App 账号\n\n" +
      "您可以通过以下方式使用：\n" +
      "· 复制授权信息，前往官方 App 使用\n" +
      "· 等待官方 API 能力接入"
    );
  }

  if (loading) {
    return (
      <Shell onBack={onBack} title="账号详情">
        <div className="py-20 text-center text-sm text-neutral-400">加载中…</div>
      </Shell>
    );
  }

  if (error || !binding) {
    return (
      <Shell onBack={onBack} title="账号详情">
        <div className="py-20 text-center text-sm text-red-500">{error || "加载失败"}</div>
      </Shell>
    );
  }

  const theme = "#" + binding.platformBrand;
  const online = onlineLabel(detecting ? "checking" : binding.lastOnlineStatus);
  const acc = accountStatusLabel(detecting ? "checking" : binding.lastAccountStatus);

  return (
    <Shell onBack={onBack} title="账号详情" toast={toast}>
      <main className="mx-auto max-w-2xl space-y-3 px-5 py-4">
        {/* 头部卡 */}
        <section className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white py-8">
          <PlatformLogo code={binding.platform} brand={binding.platformBrand} size={88} />
          <h2 className="mt-5 text-xl font-bold text-neutral-900">{binding.displayName}</h2>
          <p className="mt-1 text-xs text-neutral-400">{binding.platformName} · {binding.externalId}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className={"inline-flex items-center gap-1.5 " + online.cls}>
              <span className={"h-1.5 w-1.5 rounded-full " + online.dot} />
              {online.text}
            </span>
            <span className={"inline-flex items-center " + acc.cls}>
              账号状态：{acc.text}
            </span>
          </div>

          {binding.lastDetectedAt && (
            <p className="mt-3 text-xs text-neutral-400">最后检测：{fmtTime(binding.lastDetectedAt)}</p>
          )}
        </section>

        {/* 授权信息 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-neutral-900">授权信息</h3>
          <div className="space-y-3 text-sm">
            <Row label="授权状态" value="有效" valueClass="text-emerald-600" />
            <Row label="授权时间" value={fmtTime(binding.createdAt)} />
            <Row
              label="授权有效期"
              value={binding.accountExpiresAt ? fmtTime(binding.accountExpiresAt) : "以平台官方规则为准"}
            />
          </div>
        </section>

        {/* 上号配置 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900">上号配置</h3>
            <button type="button" onClick={() => setShowEdit((v) => !v)}
              className="text-sm font-medium text-neutral-900">
              {showEdit ? "取消" : "编辑"}
            </button>
          </div>

          {!showEdit ? (
            <div className="space-y-3 text-sm">
              <Row label="账号名称" value={binding.displayName} />
              <Row label="备注" value={binding.note || "—"} />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs text-neutral-500">账号名称</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  maxLength={60}
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-neutral-500">备注</label>
                <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)}
                  maxLength={200} rows={3}
                  className="w-full resize-none rounded-lg border border-neutral-200 bg-white p-3 text-base outline-none focus:border-neutral-400" />
              </div>
              <button type="button" onClick={handleSave} disabled={saving}
                className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-medium text-white disabled:opacity-50">
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          )}
        </section>

        {/* 操作按钮 */}
        <div className="space-y-2 pt-2">
          <button type="button" onClick={handleDetect} disabled={detecting}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl text-base font-medium text-white disabled:opacity-60"
            style={{ background: theme }}>
            {detecting ? "检测中…" : "立即检测"}
          </button>

          <button type="button" onClick={handleEnterAccount}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-base font-medium text-neutral-700">
            进入账号
          </button>

          <button type="button" onClick={handleRemove}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white text-base font-medium text-red-600">
            解除账号绑定
          </button>
        </div>

        {/* 说明 */}
        <p className="pt-2 text-center text-xs leading-5 text-neutral-400">
          在线状态与授权状态为独立指标。<br />
          无法检测不代表账号异常、封禁或违规。
        </p>
      </main>
    </Shell>
  );
}

function Shell({ title, onBack, toast, children }: { title: string; onBack: () => void; toast?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button type="button" onClick={onBack}
            className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-neutral-900">{title}</h1>
        </div>
      </header>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center px-4">
          <div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className={"min-w-0 flex-1 break-all text-right " + (valueClass || "text-neutral-900")}>{value}</span>
    </div>
  );
}
