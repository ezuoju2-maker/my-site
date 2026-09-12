import { useEffect, useState } from "react";

type PaymentId = "wechat" | "alipay" | "usdt" | "balance";

type Props = {
  platform: { code: string; name: string; brand: string };
  orderNo: string;
  payment: PaymentId;
  amount: number;
  onDone: () => void;
};

const PAYMENT_ICONS: Record<string, { color: string; path: string }> = {
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
  balance: {
    color: "#1677FF",
    path: "M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  wechat: "微信支付",
  alipay: "支付宝",
  usdt: "USDT (TRC20)",
  balance: "账户余额支付",
};

function formatNow(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

export default function GrabPaymentSuccess({ platform, orderNo, payment, amount, onDone }: Props) {
  const [count, setCount] = useState(3);
  const [timeStr] = useState(formatNow);
  const icon = PAYMENT_ICONS[payment] || PAYMENT_ICONS.wechat;

  useEffect(() => {
    if (count <= 0) {
      onDone();
      return;
    }
    const t = window.setTimeout(() => setCount((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [count, onDone]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <button type="button" onClick={onDone} className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">支付成功</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-5 py-6">
        {/* 成功图标 + 金额 */}
        <section className="relative flex flex-col items-center pt-4 pb-6">
          {/* 装饰粒子 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <svg width="220" height="80" viewBox="0 0 220 80" fill="none">
              <circle cx="60" cy="20" r="3" fill="#A7F3D0" />
              <circle cx="48" cy="45" r="2.5" fill="#6EE7B7" />
              <circle cx="160" cy="22" r="3" fill="#A7F3D0" />
              <circle cx="172" cy="48" r="2.5" fill="#6EE7B7" />
              <circle cx="110" cy="12" r="2" fill="#A7F3D0" />
              <rect x="90" y="42" width="4" height="8" rx="1" fill="#6EE7B7" opacity="0.5" />
              <rect x="128" y="42" width="4" height="8" rx="1" fill="#6EE7B7" opacity="0.5" />
            </svg>
          </div>
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 5 5L20 7" />
            </svg>
          </div>
          <h2 className="relative z-10 mt-4 text-2xl font-bold text-neutral-900">支付成功</h2>
          <p className="mt-1.5 text-sm text-neutral-500">{platform.name}账号授权服务</p>
          <div className="mt-2 text-4xl font-bold text-blue-600">¥{amount.toFixed(2)}</div>
        </section>

        {/* 订单信息卡 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">订单号</span>
              <span className="font-mono text-neutral-800">{orderNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">支付方式</span>
              <span className="flex items-center gap-1.5 text-neutral-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: icon.color }}>
                  <svg viewBox="0 0 24 24" style={{ width: "60%", height: "60%", display: "block" }}>
                    <path fill="#fff" d={icon.path} />
                  </svg>
                </span>
                {PAYMENT_LABELS[payment]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">支付金额</span>
              <span className="text-neutral-800">¥{amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">支付时间</span>
              <span className="text-neutral-800">{timeStr}</span>
            </div>
          </div>
        </section>

        {/* 生成二维码进度卡 */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex items-center gap-3">
            {/* 加载环 */}
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#DBEAFE" strokeWidth="4" />
                <circle cx="28" cy="28" r="24" fill="none" stroke="#3B82F6" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="150.8"
                  strokeDashoffset={150.8 * (1 - count / 3)}
                  style={{ transition: "stroke-dashoffset 1s linear" }} />
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-neutral-900">正在生成专属授权二维码…</div>
              <div className="mt-0.5 text-xs leading-5 text-neutral-500">
                支付成功，正在为你生成专属授权二维码<br />请稍候，马上完成
              </div>
            </div>
            <div className="shrink-0 rounded-lg bg-white px-3 py-2 text-center">
              <div className="text-xl font-bold text-blue-600">{count}s</div>
              <div className="mt-0.5 text-[10px] text-blue-500">自动跳转</div>
            </div>
          </div>
        </section>
      </main>

      <div className="mt-10 flex items-center justify-center gap-3 text-xs text-neutral-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        支付安全有保障 · 由官方授权服务提供
      </div>
    </div>
  );
}
