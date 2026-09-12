import { useState } from "react";
import { getBase } from "../lib/url";

type Platform = {
  code: string;
  name: string;
  brand: string;
  iconSlug: string;
  price: number;
};

type PaymentId = "wechat" | "alipay" | "usdt";

type Props = {
  platform: Platform;
  onBack: () => void;
  onPay: (payment: PaymentId) => void;
  loading: boolean;
};

const PAYMENT_ICONS: Record<PaymentId, { color: string; path: string }> = {
  wechat: {
    color: "#07C160",
    path: "M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.55 3.85 4.21 7.02 3.90 4.75.02 8.10-2.78 8.10-6.31 0-3.02-3.19-5.47-8.06-5.60zm-3.282 3.28c.542 0 .98.439.98.981a.978.978 0 0 1-.98.981.978.978 0 0 1-.98-.981c0-.542.439-.981.98-.981zm5.47 0c.543 0 .982.439.982.981a.978.978 0 0 1-.981.981.978.978 0 0 1-.98-.981c0-.542.439-.981.98-.981z",
  },
  alipay: {
    color: "#1677FF",
    path: "M21.44 16.18c-1.56-.57-3.68-1.31-5.9-1.83.55-1.12.86-2.05 1.06-2.75h-3.55V10.8h4.39V9.92h-4.39V7.02h-2.02c-.35 0-.35.35-.35.35v2.56H6.29v.88h4.39v.81H7.03v.82h6.87c-.16.6-.39 1.28-.66 1.94-1.44-.31-2.89-.58-4.13-.58-2.58.01-4.21 1.22-4.6 2.44-.39 1.22.11 2.68 2.38 3.44 2.05.68 4.5-.01 5.87-1.29.85-.79 1.6-1.77 2.19-2.78 1.96.5 3.68 1.19 4.85 1.83l.27-2.21zM8.57 18.5c-1.85.22-3.17-.42-3.48-1.24-.32-.83.28-1.77 1.93-2.21 1.55-.42 3.5.42 4.63.91-.72 1.12-1.75 2.16-3.08 2.54z",
  },
  usdt: {
    color: "#26A17B",
    path: "M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117",
  },
};

const PAYMENTS: { id: PaymentId; name: string; hint: string }[] = [
  { id: "wechat", name: "微信支付", hint: "推荐使用，安全快捷" },
  { id: "alipay", name: "支付宝", hint: "安全快捷，支持多种支付方式" },
  { id: "usdt", name: "USDT (TRC20)", hint: "支持 TRC20 网络转账" },
];

function PlatformLogo({ code, brand, iconSlug, size = 48 }: { code: string; brand: string; iconSlug: string; size?: number }) {
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

export default function GrabOrderPage({ platform: p, onBack, onPay, loading }: Props) {
  const [payment, setPayment] = useState<PaymentId>("wechat");
  const theme = "#" + p.brand;

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">确认订单</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-5 py-4">
        {/* 商品卡 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-start gap-3">
            <PlatformLogo code={p.code} brand={p.brand} iconSlug={p.iconSlug} size={56} />
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-neutral-900">{p.name}账号授权服务</div>
              <div className="mt-0.5 text-xs text-neutral-500">官方授权 | 安全可靠 | 快速高效</div>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: theme + "18", color: theme }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                官方授权服务
              </span>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-lg font-bold leading-none" style={{ color: theme }}>¥{p.price.toFixed(2)}</div>
              <div className="mt-1 text-xs text-neutral-400">× 1</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400">商品类型</div>
                <div className="mt-0.5 text-sm font-medium text-neutral-900">账号授权</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400">数量</div>
                <div className="mt-0.5 text-sm font-medium text-neutral-900">1 次</div>
              </div>
            </div>
          </div>
        </section>

        {/* 订单金额 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <h3 className="text-base font-semibold text-neutral-900">订单金额</h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">商品金额</span>
              <span className="text-neutral-900">¥{p.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">优惠券</span>
              <button type="button" className="flex items-center gap-1 text-neutral-400">
                暂无可用
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
              <span className="text-sm font-medium text-neutral-900">应付金额</span>
              <span className="text-2xl font-bold" style={{ color: theme }}>¥{p.price.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* 支付方式 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <h3 className="text-base font-semibold text-neutral-900">选择支付方式</h3>
          <div className="mt-3 space-y-2">
            {PAYMENTS.map((m) => {
              const selected = payment === m.id;
              const icon = PAYMENT_ICONS[m.id];
              return (
                <button key={m.id} type="button" onClick={() => setPayment(m.id)}
                  className={"flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors " + (selected ? "border-blue-500 bg-blue-50/40" : "border-neutral-200 bg-white")}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: icon.color }}>
                    <svg viewBox="0 0 24 24" style={{ width: "58%", height: "58%", display: "block" }}>
                      <path fill="#ffffff" d={icon.path} />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-900">{m.name}</div>
                    <div className="mt-0.5 text-xs text-neutral-500">{m.hint}</div>
                  </div>
                  <span className={"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 " + (selected ? "border-blue-500" : "border-neutral-300")}>
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
                  </span>
                </button>
              );
            })}
            <div className="flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
              <p className="text-xs text-neutral-500">USDT 支付需使用 TRON (TRC20) 网络</p>
            </div>
          </div>
        </section>

        {/* 安全保障 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-3.5 w-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
            </span>
            <span className="text-sm font-medium text-neutral-900">安全保障</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-neutral-600">
            {["官方授权服务", "支付加密保障", "订单自动处理", "售后服务支持"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
                <span className="truncate">{t}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-neutral-500">应付金额</div>
            <div className="text-2xl font-bold leading-tight" style={{ color: theme }}>¥{p.price.toFixed(2)}</div>
          </div>
          <button type="button" disabled={loading} onClick={() => onPay(payment)}
            className="h-12 shrink-0 rounded-full px-10 text-base font-medium text-white disabled:opacity-60"
            style={{ background: theme }}>
            {loading ? "处理中…" : "立即支付"}
          </button>
        </div>
      </div>
    </div>
  );
}
