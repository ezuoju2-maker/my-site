import { useState } from "react";
import { getBase } from "../lib/url";
import { getFlag, type SmsCountry } from "./sms-countries-data";
import { stockFor } from "./sms-mock-stock";
import type { SmsService } from "./sms-services-data";
import type { PaymentMethodId } from "./sms-channels";

type Props = {
  service: SmsService;
  country: SmsCountry;
  onBack: () => void;
  onConfirm: (payment: PaymentMethodId, quantity: number) => void;
};

const PAYMENT_ICONS: Record<PaymentMethodId, { svg: string; color: string }> = {
  wechat: {
    color: "#07C160",
    svg: '<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.55 3.85 4.21 7.02 3.90 4.75.02 8.10-2.78 8.10-6.31 0-3.02-3.19-5.47-8.06-5.60zm-3.282 3.28c.542 0 .98.439.98.981a.978.978 0 0 1-.98.981.978.978 0 0 1-.98-.981c0-.542.439-.981.98-.981zm5.47 0c.543 0 .982.439.982.981a.978.978 0 0 1-.981.981.978.978 0 0 1-.98-.981c0-.542.439-.981.98-.981z"/></svg>',
  },
  alipay: {
    color: "#1677FF",
    svg: '<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M21.44 16.18c-1.56-.57-3.68-1.31-5.9-1.83.55-1.12.86-2.05 1.06-2.75h-3.55V10.8h4.39V9.92h-4.39V7.02h-2.02c-.35 0-.35.35-.35.35v2.56H6.29v.88h4.39v.81H7.03v.82h6.87c-.16.6-.39 1.28-.66 1.94-1.44-.31-2.89-.58-4.13-.58-2.58.01-4.21 1.22-4.6 2.44-.39 1.22.11 2.68 2.38 3.44 2.05.68 4.5-.01 5.87-1.29.85-.79 1.6-1.77 2.19-2.78 1.96.5 3.68 1.19 4.85 1.83l.27-2.21zM8.57 18.5c-1.85.22-3.17-.42-3.48-1.24-.32-.83.28-1.77 1.93-2.21 1.55-.42 3.5.42 4.63.91-.72 1.12-1.75 2.16-3.08 2.54z"/></svg>',
  },
  usdt: {
    color: "#26A17B",
    svg: '<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/></svg>',
  },
};

const PAYMENTS: { id: PaymentMethodId; name: string; hint: string }[] = [
  { id: "wechat", name: "微信支付", hint: "扫码支付，人民币结算" },
  { id: "alipay", name: "支付宝", hint: "扫码支付，人民币结算" },
  { id: "usdt", name: "USDT (TRC20)", hint: "加密货币支付，全球通用" },
];

function isLightHex(hex: string): boolean {
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function ServiceBadge({ service, size = 44 }: { service: SmsService; size?: number }) {
  const [failed, setFailed] = useState(false);
  const base = getBase();
  const bg = "#" + (service.brand || "737373");
  const light = isLightHex(service.brand || "737373");
  if (failed) {
    return (
      <span className="flex shrink-0 items-center justify-center rounded-full font-semibold" style={{ width: size, height: size, background: bg, color: light ? "#171717" : "#ffffff", fontSize: Math.round(size * 0.42) }}>{service.name.charAt(0).toUpperCase()}</span>
    );
  }
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ width: size, height: size, background: bg }}>
      <img src={base + "icons/" + service.slug + ".svg"} alt="" width={Math.round(size * 0.58)} height={Math.round(size * 0.58)} onError={() => setFailed(true)} style={{ filter: light ? "brightness(0)" : "brightness(0) invert(1)" }} />
    </span>
  );
}

export default function SmsOrderPage({ service, country, onBack, onConfirm }: Props) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId | null>(null);
  const stock = stockFor(service.slug, country.code);

  function handleNext() {
    if (!selectedPayment) { window.alert("请先选择支付方式"); return; }
    if (stock <= 0) { window.alert("该服务在此国家暂无库存"); return; }
    onConfirm(selectedPayment, 1);
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5">
          <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center text-neutral-700">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">选择支付方式</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-5 py-5">
        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <ServiceBadge service={service} size={44} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-neutral-900">{service.name}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500">
                <span className="text-lg leading-none">{getFlag(country.code)}</span>
                <span className="truncate">{country.name} · {country.dial}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-neutral-900">选择支付方式</h2>
          <div className="space-y-2">
            {PAYMENTS.map((p) => {
              const selected = selectedPayment === p.id;
              const icon = PAYMENT_ICONS[p.id];
              return (
                <button key={p.id} type="button" onClick={() => setSelectedPayment(p.id)} className={"flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors " + (selected ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white")}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-2" style={{ background: icon.color }}>
                    <span className="block h-full w-full" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-900">{p.name}</div>
                    <div className="truncate text-xs text-neutral-500">{p.hint}</div>
                  </div>
                  <span className={"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 " + (selected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300")}>
                    {selected && <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <p className="pt-2 text-center text-xs text-neutral-400">当前为演示模式。接入真实支付后将跳转到对应支付页面。</p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-end">
          <button type="button" onClick={handleNext} disabled={!selectedPayment} className="h-12 rounded-xl bg-neutral-900 px-8 text-base font-medium text-white disabled:opacity-50">
            下一步 · 选通道
          </button>
        </div>
      </div>
    </div>
  );
}
