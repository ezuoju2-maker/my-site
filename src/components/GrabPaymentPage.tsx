import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getBase } from "../lib/url";
import { API_BASE_URL } from "../lib/api";

type Platform = {
  code: string;
  name: string;
  brand: string;
  price: number;
};

type PaymentId = "wechat" | "alipay" | "usdt" | "balance";

type Props = {
  platform: Platform;
  payment: PaymentId;
  onBack: () => void;
  onPaid: () => void;
};

const PAYMENT_ICONS: Record<string, { color: string; path: string }> = {
  wechat: {
    color: "#07C160",
    path: "M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178.978.978 0 0 1-.98-.981c0-.542.439-.981.98-.981z",
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

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function genOrderNo(): string {
  const d = new Date();
  const ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  return ymd + rand;
}

const PAYMENT_LABELS: Record<PaymentId, string> = {
  wechat: "微信支付",
  alipay: "支付宝",
  usdt: "USDT (TRC20)",
  balance: "账户余额",
};

export default function GrabPaymentPage({ platform: p, payment, onBack, onPaid }: Props) {
  const [countdown, setCountdown] = useState(payment === "usdt" ? 872 : 598); // 14:32 / 09:58
  const [orderNo] = useState(genOrderNo());
  const [balance, setBalance] = useState(0);
  const [balanceLoaded, setBalanceLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const theme = "#" + p.brand;

  // USDT 换算（1 USDT ≈ 7.2 CNY）
  const usdtRate = 7.2;
  const usdtAmount = (p.price / usdtRate).toFixed(4);
  const usdtAddress = "TQbv3f2e9kJ_7X8a3d2";

  useEffect(() => {
    if (payment === "balance") {
      fetch(`${API_BASE_URL}/api/user/balance`, { credentials: "include", cache: "no-store" })
        .then((r) => r.json() as Promise<{ ok?: boolean; balance?: number }>)
        .then((d) => {
          if (d.ok && typeof d.balance === "number") setBalance(d.balance);
          setBalanceLoaded(true);
        })
        .catch(() => setBalanceLoaded(true));
    }
  }, [payment]);

  useEffect(() => {
    if (payment === "balance") return;
    if (countdown <= 0) return;
    const t = window.setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [countdown, payment]);

  // 模拟支付：5 秒后自动跳转支付成功页
  const [autoCount, setAutoCount] = useState(5);
  useEffect(() => {
    if (payment === "balance") return;
    if (autoCount <= 0) {
      onPaid();
      return;
    }
    const t = window.setTimeout(() => setAutoCount((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [autoCount, payment, onPaid]);

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

  // ==================== 账户余额支付页 ====================
  if (payment === "balance") {
    const enough = balanceLoaded && balance >= p.price;
    return (
      <div className="min-h-screen bg-neutral-50 pb-32">
        <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
            <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center text-neutral-700">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-lg font-semibold text-neutral-900">确认支付</h1>
          </div>
        </header>

        <main className="mx-auto max-w-3xl space-y-3 px-5 py-4">
          {/* 商品卡 */}
          <section className="rounded-2xl border border-neutral-100 bg-white p-4">
            <div className="flex items-start gap-3">
              <PlatformLogo code={p.code} brand={p.brand} size={56} />
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
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
              <div><div className="text-xs text-neutral-400">商品类型</div><div className="mt-0.5 text-sm font-medium text-neutral-900">账号授权</div></div>
              <div><div className="text-xs text-neutral-400">购买数量</div><div className="mt-0.5 text-sm font-medium text-neutral-900">1 次</div></div>
            </div>
          </section>

          {/* 订单金额 */}
          <section className="rounded-2xl border border-neutral-100 bg-white p-4">
            <h3 className="text-sm font-semibold text-neutral-900">订单金额</h3>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between text-sm"><span className="text-neutral-500">商品金额</span><span className="text-neutral-900">¥{p.price.toFixed(2)}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-neutral-500">优惠券</span><button type="button" className="flex items-center gap-1 text-neutral-400">暂无可用<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></button></div>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-3"><span className="text-sm font-medium text-neutral-900">应付金额</span><span className="text-2xl font-bold text-blue-500">¥{p.price.toFixed(2)}</span></div>
            </div>
          </section>

          {/* 账户余额支付卡 */}
          <section className="rounded-2xl border border-neutral-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500">
                <svg viewBox="0 0 24 24" style={{ width: "60%", height: "60%", display: "block" }} fill="#fff" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-neutral-900">账户余额支付</div>
                <div className="mt-0.5 text-xs text-neutral-500">当前账户余额</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-lg font-bold text-blue-500">¥{balanceLoaded ? balance.toFixed(3) : "—.———"}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
              <span className="min-w-0 flex-1 text-xs text-neutral-400">使用账户余额支付，余额充足，可直接支付</span>
              <button type="button" onClick={onBack} className="flex shrink-0 items-center gap-0.5 text-xs text-neutral-500">更改支付方式<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></button>
            </div>
          </section>

          {/* 支付安全保障 */}
          <section className="rounded-2xl border border-neutral-100 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-3.5 w-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
              </span>
              <span className="text-sm font-medium text-neutral-900">支付安全保障</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-3 text-xs text-neutral-600">
              {["账户资金安全保障", "平台正规合规", "7×24小时服务", "支付加密保障"].map((t) => (
                <div key={t} className="flex items-center gap-1.5"><svg className="h-3.5 w-3.5 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg><span className="truncate">{t}</span></div>
              ))}
            </div>
          </section>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-neutral-500">应付金额</div>
              <div className="text-2xl font-bold leading-tight text-blue-500">¥{p.price.toFixed(2)}</div>
            </div>
            <button type="button" disabled={!enough}
              onClick={() => { showToast("支付成功，正在生成二维码…"); window.setTimeout(onPaid, 800); }}
              className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-blue-500 px-7 text-base font-medium text-white disabled:opacity-60">
              <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9z" />
                <rect x="16" y="10" width="5" height="4" rx="1" />
              </svg>
              立即支付
            </button>
          </div>
        </div>
        {toast && (<div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"><div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">{toast}</div></div>)}
      </div>
    );
  }

  // ==================== 微信 / 支付宝 / USDT 扫码支付页 ====================
  const isUSDT = payment === "usdt";
  const icon = isUSDT ? PAYMENT_ICONS.usdt : payment === "wechat" ? PAYMENT_ICONS.wechat : PAYMENT_ICONS.alipay;
  const title = isUSDT ? "USDT 支付" : payment === "wechat" ? "微信支付" : "支付宝支付";

  // 生成二维码内容（微信/支付宝是支付链接，USDT 是地址）
  const qrContent = isUSDT ? usdtAddress : `${title}:${orderNo}:¥${p.price}`;

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center text-neutral-700">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-5 py-4">
        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-start gap-3">
            <PlatformLogo code={p.code} brand={p.brand} size={56} />
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
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
            <div><div className="text-xs text-neutral-400">商品类型</div><div className="mt-0.5 text-sm font-medium text-neutral-900">账号授权</div></div>
            <div><div className="text-xs text-neutral-400">购买数量</div><div className="mt-0.5 text-sm font-medium text-neutral-900">1 次</div></div>
          </div>
        </section>

        {/* 待支付 / 应付金额（USDT 换算） */}
        {!isUSDT ? (
          <section className="rounded-2xl border border-neutral-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-neutral-900">待支付</span>
              <span className="text-2xl font-bold" style={{ color: theme }}>¥{p.price.toFixed(2)}</span>
            </div>
            <div className="mt-1 text-right text-xs text-neutral-400">{p.name}账号授权服务</div>

            <div className="mt-4 flex flex-col items-center">
              <div className="relative rounded-xl border-2 border-neutral-100 bg-white p-3">
                <QRCodeSVG value={qrContent} size={180} level="M" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: icon.color }}>
                    <svg viewBox="0 0 24 24" style={{ width: "60%", height: "60%", display: "block" }}>
                      <path fill="#fff" d={icon.path} />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-4 text-sm text-neutral-700">
                请使用{title === "微信支付" ? "微信" : "支付宝"}扫一扫完成支付
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                支付剩余时间
              </div>
              <div className="mt-1 text-2xl font-bold text-blue-500">{fmtTime(countdown)}</div>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-neutral-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-neutral-500">应付金额</div>
                  <div className="mt-1 text-2xl font-bold text-blue-500">{usdtAmount} USDT</div>
                  <div className="mt-0.5 text-xs text-neutral-400">≈ ¥{p.price.toFixed(2)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-neutral-500">网络</div>
                  <span className="mt-1 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-500">TRC20（波场网络）</span>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-neutral-800">{usdtAddress}</span>
                  <button type="button" onClick={() => copyText(usdtAddress, "地址已复制")}
                    className="shrink-0 rounded-md bg-blue-500 px-2.5 py-1 text-xs font-medium text-white">复制</button>
                </div>
              </div>

              <div className="mt-5 flex flex-col items-center">
                <div className="rounded-xl border-2 border-neutral-100 bg-white p-3">
                  <QRCodeSVG value={usdtAddress} size={180} level="M" />
                </div>
                <div className="mt-3 text-sm text-neutral-700">请使用支持 TRC20 的钱包扫描支付</div>
              </div>
            </section>

            <section className="rounded-xl bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                <div>
                  <div className="text-sm font-medium text-amber-700">请确认使用 TRC20 网络转账</div>
                  <div className="mt-0.5 text-xs text-amber-600">仅支持 USDT（TRC20），使用其他网络转账可能导致资产无法到账。</div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-100 bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                支付剩余时间
              </div>
              <div className="mt-1 text-2xl font-bold text-blue-500">{fmtTime(countdown)}</div>
              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.5" /><path d="M22 4v6h-6" /></svg>
                等待区块确认
              </div>
            </section>
          </>
        )}

        {/* 订单信息 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between"><span className="text-neutral-500">订单号</span><span className="font-mono text-neutral-800">{orderNo}</span></div>
            <div className="flex items-center justify-between"><span className="text-neutral-500">商品名称</span><span className="text-neutral-800">{p.name}账号授权服务</span></div>
            <div className="flex items-center justify-between"><span className="text-neutral-500">支付方式</span><span className="text-neutral-800">{PAYMENT_LABELS[payment]}</span></div>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-600">等待支付</span>
          </div>
        </section>

        {/* 取消订单 */}
        <button type="button" onClick={onBack}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white text-sm text-neutral-600">
          取消订单
        </button>
      </main>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
