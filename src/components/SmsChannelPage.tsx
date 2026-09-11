import { useMemo, useState } from "react";
import { getBase } from "../lib/url";
import { getFlag, type SmsCountry } from "./sms-countries-data";
import { priceFor, stockFor } from "./sms-mock-stock";
import type { SmsService } from "./sms-services-data";
import {
  getChannelsForPayment,
  applyMarkup,
  channelStock,
  type PaymentMethodId,
} from "./sms-channels";

type Props = {
  service: SmsService;
  country: SmsCountry;
  paymentMethod: PaymentMethodId;
  paymentLabel: string;
  quantity: number;
  onBack: () => void;
};

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
        {service.name.charAt(0).toUpperCase()}
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
        src={base + "icons/" + service.slug + ".svg"}
        alt=""
        width={Math.round(size * 0.58)}
        height={Math.round(size * 0.58)}
        onError={() => setFailed(true)}
        style={{
          filter: light ? "brightness(0)" : "brightness(0) invert(1)",
        }}
      />
    </span>
  );
}

export default function SmsChannelPage({
  service,
  country,
  paymentMethod,
  paymentLabel,
  quantity,
  onBack,
}: Props) {
  const basePrice = priceFor(service.slug, country.code);
  const baseStock = stockFor(service.slug, country.code);

  const channels = useMemo(() => {
    return getChannelsForPayment(paymentMethod)
      .map((ch) => ({
        ch,
        price: applyMarkup(basePrice, ch),
        stock: channelStock(service.slug, country.code, ch.id, baseStock),
      }))
      .sort((a, b) => b.ch.successRate - a.ch.successRate);
  }, [paymentMethod, basePrice, service.slug, country.code, baseStock]);

  const [selectedId, setSelectedId] = useState<string | null>(
    channels[0]?.ch.id ?? null,
  );
  const [submitting, setSubmitting] = useState(false);

  const selected = channels.find((x) => x.ch.id === selectedId);
  const total = selected
    ? Math.round(selected.price * quantity * 100) / 100
    : 0;

  function handleSubmit() {
    if (!selected) {
      window.alert("请先选择通道");
      return;
    }
    if (selected.stock <= 0) {
      window.alert("该通道在此服务/国家暂无库存，请选择其它通道");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      window.alert(
        "订单已提交（演示模式）\n\n" +
          "服务：" + service.name + "\n" +
          "国家：" + country.name + " " + country.dial + "\n" +
          "数量：" + quantity + " 个\n" +
          "支付方式：" + paymentLabel + "\n" +
          "通道：" + selected.ch.displayName + "\n" +
          "合计：$" + total.toFixed(2) + "\n\n" +
          "接入真实 API 后将在此创建订单并返回号码。",
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
          <h1 className="text-lg font-semibold text-neutral-900">选择通道</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-5 py-5">
        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <ServiceBadge service={service} size={44} />
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
            <div className="shrink-0 text-right text-xs text-neutral-500">
              <div>x{quantity}</div>
              <div className="mt-0.5">{paymentLabel}</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-100 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-neutral-900">
            可用通道
            <span className="ml-2 text-xs text-neutral-400">
              {channels.length} 个
            </span>
          </h2>

          {channels.length === 0 ? (
            <p className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-500">
              该支付方式暂无可用通道
            </p>
          ) : (
            <div className="space-y-2">
              {channels.map(({ ch, price, stock }) => {
                const isSelected = selectedId === ch.id;
                const noStock = stock <= 0;
                const successPct = Math.round(ch.successRate * 100);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    disabled={noStock}
                    onClick={() => setSelectedId(ch.id)}
                    className={
                      "w-full rounded-xl border p-3 text-left transition-colors " +
                      (isSelected
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 bg-white") +
                      (noStock ? " opacity-50" : "")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 " +
                          (isSelected
                            ? "border-neutral-900 bg-neutral-900"
                            : "border-neutral-300")
                        }
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 12 5 5L20 7" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm font-medium text-neutral-900">
                        {ch.displayName}
                      </span>
                      <span className="flex-1" />
                      <span className="text-base font-semibold text-neutral-900">
                        ${price.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-2 ml-8 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-400">成功率</span>
                        <span
                          className={
                            successPct >= 85
                              ? "font-medium text-green-600"
                              : successPct >= 70
                                ? "font-medium text-amber-600"
                                : "font-medium text-neutral-500"
                          }
                        >
                          {successPct}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-400">库存</span>
                        <span
                          className={
                            noStock
                              ? "text-neutral-400"
                              : "font-medium text-neutral-700"
                          }
                        >
                          {noStock ? "无货" : stock}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <p className="pt-2 text-center text-xs text-neutral-400">
          通道信息为演示数据。接入真实 API 后将按实时库存和成功率动态展示。
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
            disabled={submitting || !selected}
            className="h-12 shrink-0 rounded-xl bg-neutral-900 px-8 text-base font-medium text-white disabled:opacity-50"
          >
            {submitting ? "提交中…" : "确认下单"}
          </button>
        </div>
      </div>
    </div>
  );
}
