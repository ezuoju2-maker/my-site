import { useState } from "react";
import { getBase } from "../lib/url";
import { getFlag, type SmsCountry } from "./sms-countries-data";
import { priceFor, stockFor } from "./sms-mock-stock";
import type { SmsService } from "./sms-services-data";

type PaymentMethod = "wechat" | "alipay" | "usdt";

type Props = {
  service: SmsService;
  country: SmsCountry;
  onBack: () => void;
};

const PAYMENTS: {
  id: PaymentMethod;
  name: string;
  hint: string;
  iconSlug: string;
  brand: string;
}[] = [
  {
    id: "wechat",
    name: "微信支付",
    hint: "扫码支付，人民币结算",
    iconSlug: "wechat",
    brand: "07C160",
  },
  {
    id: "alipay",
    name: "支付宝",
    hint: "扫码支付，人民币结算",
    iconSlug: "alipay",
    brand: "1677FF",
  },
  {
    id: "usdt",
    name: "USDT (TRC20)",
    hint: "加密货币支付，全球通用",
    iconSlug: "tether",
    brand: "26A17B",
  },
];

function isLightHex(hex: string): boolean {
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function BrandCircle({
  slug,
  brand,
  fallbackText,
  size = 36,
}: {
  slug: string;
  brand: string;
  fallbackText: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const base = getBase();
  const bg = "#" + brand;
  const light = isLightHex(brand);

  if (failed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full font-semibold"
        style={{
          width: size,
          height: size,
          background: bg,
          color: light ? "#171717" : "#ffffff",
          fontSize: Math.round(size * 0.42),
        }}
        aria-hidden="true"
      >
        {fallbackText}
      </span>
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, background: bg }}
      aria-hidden="true"
    >
      <img
        src={base + "icons/" + slug + ".svg"}
        alt=""
        width={Math.round(size * 0.58)}
        height={Math.round(size * 0.58)}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{
          filter: light ? "brightness(0)" : "brightness(0) invert(1)",
        }}
      />
    </span>
  );
}

export default function SmsOrderPage({ service, country, onBack }: Props) {
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethod | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const unitPrice = priceFor(service.slug, country.code);
  const stock = stockFor(service.slug, country.code);
  const total = Math.round(unitPrice * quantity * 100) / 100;

  function handleSubmit() {
    if (!selectedPayment) {
      window.alert("请先选择支付方式");
      return;
    }
    if (stock <= 0) {
      window.alert("该服务在此国家暂无库存");
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      const method = PAYMENTS.find((p) => p.id === selectedPayment);
      window.alert(
        "订单已提交（演示模式）\n\n" +
          "服务：" + service.name + "\n" +
          "国家：" + country.name + " " + country.dial + "\n" +
          "数量：" + quantity + " 个\n" +
          "合计：$" + total.toFixed(2) + "\n" +
          "支付方式：" + (method ? method.name : "-") + "\n\n" +
          "接入真实 API 后将创建订单并返回号码。",
      );
    }, 600);
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center text-neutral-700"
            aria-label="返回"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">确认订单</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-5 py-5">
        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <BrandCircle
              slug={service.slug}
              brand={service.brand || "737373"}
              fallbackText={service.name.charAt(0).toUpperCase()}
              size={44}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-neutral-900">
                {service.name}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500">
                <span className="text-lg leading-none" aria-hidden="true">
                  {getFlag(country.code)}
                </span>
                <span className="truncate">
                  {country.name} · {country.dial}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-900">购买数量</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 disabled:opacity-40"
                aria-label="减少"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <span className="w-10 text-center text-base font-semibold text-neutral-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                disabled={quantity >= 10}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 disabled:opacity-40"
                aria-label="增加"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
            <span>单价 ${unitPrice.toFixed(2)}</span>
            <span>库存 {stock}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">合计</span>
            <span className="text-2xl font-bold text-neutral-900">
              ${total.toFixed(2)}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-neutral-900">
            选择支付方式
          </h2>
          <div className="space-y-2">
            {PAYMENTS.map((p) => {
              const selected = selectedPayment === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPayment(p.id)}
                  className={
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors " +
                    (selected
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 bg-white")
                  }
                >
                  <BrandCircle
                    slug={p.iconSlug}
                    brand={p.brand}
                    fallbackText={p.name.charAt(0)}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-900">
                      {p.name}
                    </div>
                    <div className="truncate text-xs text-neutral-500">
                      {p.hint}
                    </div>
                  </div>
                  <span
                    className={
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 " +
                      (selected
                        ? "border-neutral-900 bg-neutral-900"
                        : "border-neutral-300")
                    }
                    aria-hidden="true"
                  >
                    {selected && (
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <p className="pt-2 text-center text-xs text-neutral-400">
          当前为演示模式。接入真实支付后将跳转到对应支付页面。
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-neutral-500">应付</div>
            <div className="text-lg font-bold text-neutral-900">
              ${total.toFixed(2)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedPayment}
            className="h-12 shrink-0 rounded-xl bg-neutral-900 px-8 text-base font-medium text-white disabled:opacity-50"
          >
            {submitting ? "提交中…" : "确认下单"}
          </button>
        </div>
      </div>
    </div>
  );
}
