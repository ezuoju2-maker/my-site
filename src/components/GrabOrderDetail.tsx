import { useEffect, useState } from "react";
import { getBase } from "../lib/url";
import { API_BASE_URL } from "../lib/api";

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
  account: {
    nickname: string | null;
    externalId: string;
    authorizationCode: string | null;
    deviceId: string | null;
    expiresAt: string | null;
  } | null;
};

type Props = {
  orderId: string;
  onBack: () => void;
  onViewQr: (orderId: string) => void;
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

function fmtTime(iso: string): string {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}

export default function GrabOrderDetail({ orderId, onBack, onViewQr }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // 拉订单数据（含轮询）
  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const fetchOrder = async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/grab/me/orders`, {
          credentials: "include",
          cache: "no-store",
        });
        const d = (await r.json()) as { ok?: boolean; orders?: Order[] };
        if (cancelled) return;
        if (d.ok && d.orders) {
          const found = d.orders.find((o) => o.id === orderId);
          if (found) {
            setOrder(found);
            setError("");
            // 状态不再 waiting 时停止轮询
            if (found.status !== "waiting" && timer !== null) {
              window.clearInterval(timer);
              timer = null;
            }
          } else {
            setError("订单不存在");
          }
        } else {
          setError("加载失败");
        }
      } catch {
        if (!cancelled) setError("网络错误");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchOrder();
    // 每 3 秒轮询（授权成功后停止）
    timer = window.setInterval(fetchOrder, 3000);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearInterval(timer);
    };
  }, [orderId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        <Header platformName={null} onBack={onBack} />
        <div className="py-20 text-center text-sm text-neutral-400">加载中…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        <Header platformName={null} onBack={onBack} />
        <div className="py-20 text-center text-sm text-red-500">{error || "订单不存在"}</div>
      </div>
    );
  }

  const theme = "#" + order.platformBrand;
  const isWaiting = order.status === "waiting";
  const isSuccess = order.status === "consumed" && order.account;

  // ============ 待扫码 ============
  if (isWaiting) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        <Header platformName={order.platformName} onBack={onBack} />

        <main className="mx-auto max-w-2xl space-y-3 px-5 py-4">
          {/* 头部卡 */}
          <section className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white py-8">
            <PlatformLogo code={order.platform} brand={order.platformBrand} size={88} />
            <h2 className="mt-5 text-xl font-bold text-neutral-900">{order.platformName}账号授权</h2>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              当前状态：等待扫码中
            </span>
          </section>

          {/* 订单信息 */}
          <section className="rounded-2xl border border-neutral-100 bg-white p-5">
            <h3 className="mb-4 text-base font-bold text-neutral-900">订单信息</h3>
            <div className="space-y-3 text-sm">
              <Row label="服务名称" value={order.platformName + "账号授权服务"} />
              <Row label="支付金额" value={"¥" + order.price.toFixed(2)} />
              <Row label="订单编号" value={order.id.slice(0, 12).toUpperCase()} mono />
              <Row label="创建时间" value={fmtTime(order.createdAt)} />
            </div>
          </section>

          {/* 授权状态 */}
          <section className="rounded-2xl border border-neutral-100 bg-white p-5">
            <h3 className="mb-3 text-base font-bold text-neutral-900">授权状态</h3>
            <div className="rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-500">
              尚未完成授权
            </div>
          </section>

          <button type="button"
            onClick={() => onViewQr(orderId)}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl text-base font-medium text-white"
            style={{ background: theme }}>
            查看授权二维码
          </button>
        </main>

        {toast && <Toast text={toast} />}
      </div>
    );
  }

  // ============ 已授权成功 ============
  if (isSuccess && order.account) {
    const acc = order.account;

    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        <Header platformName={order.platformName} onBack={onBack} />

        <main className="mx-auto max-w-2xl space-y-3 px-5 py-4">
          {/* 头部卡 */}
          <section className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white py-8">
            <PlatformLogo code={order.platform} brand={order.platformBrand} size={88} />
            <h2 className="mt-5 text-xl font-bold text-neutral-900">{order.platformName}账号授权</h2>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
              当前状态：成功授权
            </span>
          </section>

          {/* 订单信息 */}
          <section className="rounded-2xl border border-neutral-100 bg-white p-5">
            <h3 className="mb-4 text-base font-bold text-neutral-900">订单信息</h3>
            <div className="space-y-3 text-sm">
              <Row label="服务名称" value={order.platformName + "账号授权服务"} />
              <Row label="支付金额" value={"¥" + order.price.toFixed(2)} />
              <Row label="订单编号" value={order.id.slice(0, 12).toUpperCase()} mono />
              <Row label="创建时间" value={fmtTime(order.createdAt)} />
            </div>
          </section>

          {/* 授权信息 */}
          <section className="rounded-2xl border border-neutral-100 bg-white p-5">
            <h3 className="mb-4 text-base font-bold text-neutral-900">授权信息</h3>
            <div className="space-y-3 text-sm">
              <Row label="账号昵称" value={acc.nickname || "—"} />
              <Row label="平台账号ID" value={acc.externalId} mono />
              <Row label="授权状态" value="有效" valueClass="text-emerald-600" />
              <Row label="授权时间" value={fmtTime(order.consumedAt || order.createdAt)} />
              <Row
                label="授权有效期"
                value={acc.expiresAt ? fmtTime(acc.expiresAt) : "以平台规则为准"}
              />
            </div>

            <button type="button"
              onClick={() => {
                const info = [
                  "平台：" + order.platformName,
                  "账号昵称：" + (acc.nickname || "—"),
                  "平台账号ID：" + acc.externalId,
                  "授权ID：" + (acc.authorizationCode || "—"),
                  "授权状态：有效",
                  "授权时间：" + fmtTime(order.consumedAt || order.createdAt),
                  "授权有效期：" + (acc.expiresAt ? fmtTime(acc.expiresAt) : "以平台规则为准"),
                ].join("\n");
                copyText(info, "授权信息已复制");
              }}
              className="mt-6 flex h-12 w-full items-center justify-center gap-1.5 rounded-xl text-base font-medium text-white"
              style={{ background: theme }}>
              查看授权信息
            </button>
          </section>
        </main>

        {toast && <Toast text={toast} />}
      </div>
    );
  }

  // ============ 已过期 ============
  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <Header platformName={order.platformName} onBack={onBack} />
      <main className="mx-auto max-w-2xl space-y-3 px-5 py-4">
        <section className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white py-8">
          <PlatformLogo code={order.platform} brand={order.platformBrand} size={88} />
          <h2 className="mt-5 text-xl font-bold text-neutral-900">{order.platformName}账号授权</h2>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-500">
            已过期
          </span>
        </section>
        <section className="rounded-2xl border border-neutral-100 bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-neutral-900">订单信息</h3>
          <div className="space-y-3 text-sm">
            <Row label="服务名称" value={order.platformName + "账号授权服务"} />
            <Row label="支付金额" value={"¥" + order.price.toFixed(2)} />
            <Row label="订单编号" value={order.id.slice(0, 12).toUpperCase()} mono />
            <Row label="创建时间" value={fmtTime(order.createdAt)} />
          </div>
        </section>
      </main>
      {toast && <Toast text={toast} />}
    </div>
  );
}

function Header({ platformName, onBack }: { platformName: string | null; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
        <button type="button" onClick={onBack}
          className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-neutral-900">
          {platformName ? platformName + "账号授权" : "授权详情"}
        </h1>
      </div>
    </header>
  );
}

function Row({ label, value, mono, valueClass }: { label: string; value: string; mono?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className={"min-w-0 flex-1 break-all text-right " + (mono ? "font-mono " : "") + (valueClass || "text-neutral-900")}>
        {value}
      </span>
    </div>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center px-4">
      <div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">{text}</div>
    </div>
  );
}
