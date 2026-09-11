import { useMemo, useState } from "react";
import { getBase } from "../lib/url";
import { getFlag, type SmsCountry } from "./sms-countries-data";
import { getStockForCountry } from "./sms-mock-stock";
import { getPriceRange, getTotalStock } from "./sms-pricing";
import type { SmsService } from "./sms-services-data";

type Props = {
  countryCode: string;
  country: SmsCountry;
  allServices: SmsService[];
  onBack: () => void;
  onPickService: (slug: string) => void;
};

function isLightHex(hex: string): boolean {
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function BrandIcon({ service, size = 36 }: { service: SmsService; size?: number }) {
  const [failed, setFailed] = useState(false);
  const base = getBase();
  const brandHex = service.brand || "737373";
  const bg = `#${brandHex}`;
  const light = isLightHex(brandHex);

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
        src={`${base}icons/${service.slug}.svg`}
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

export default function SmsCountryDetail({
  countryCode,
  country,
  allServices,
  onBack,
  onPickService,
}: Props) {
  const [query, setQuery] = useState("");

  const serviceMap = useMemo(() => {
    const m = new Map<string, SmsService>();
    for (const s of allServices) m.set(s.slug, s);
    return m;
  }, [allServices]);

  const stock = useMemo(
    () => getStockForCountry(countryCode, allServices),
    [countryCode, allServices],
  );

  const available = useMemo(
    () =>
      stock
        .map((s) => {
          const priceRange = getPriceRange(s.price);
          const totalStock = getTotalStock(s.serviceSlug, countryCode, s.stock);
          return { s, svc: serviceMap.get(s.serviceSlug), priceRange, totalStock };
        })
        .filter((x): x is { s: typeof stock[0]; svc: SmsService; priceRange: { min: number; max: number }; totalStock: number } => Boolean(x.svc))
        .sort((a, b) => b.totalStock - a.totalStock),
    [stock, serviceMap, countryCode],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      ({ svc }) =>
        svc.name.toLowerCase().includes(q) ||
        svc.slug.toLowerCase().includes(q),
    );
  }, [available, query]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
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
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none" aria-hidden="true">
              {getFlag(countryCode)}
            </span>
            <div>
              <h1 className="text-base font-semibold text-neutral-900">
                {country.name}
              </h1>
              <p className="text-xs text-neutral-400">
                {country.dial} · 支持 {available.length} 个服务
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-5 py-5">
        <div className="relative">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索服务"
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-base outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-neutral-100 bg-white p-4 text-sm text-neutral-500">
            未找到匹配的服务
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map(({ s, svc, priceRange, totalStock }) => {
              const inStock = totalStock > 0;
              const priceText = priceRange.min === priceRange.max
                ? "$" + priceRange.min.toFixed(2)
                : "$" + priceRange.min.toFixed(2) + " ~ $" + priceRange.max.toFixed(2);
              return (
                <button
                  key={svc.slug}
                  type="button"
                  onClick={() => onPickService(svc.slug)}
                  className="flex w-full items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left active:bg-neutral-50"
                >
                  <BrandIcon service={svc} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-neutral-900">
                      {svc.name}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-neutral-900">
                      {priceText}
                    </div>
                    <div
                      className={
                        "text-xs " +
                        (inStock ? "text-green-600" : "text-neutral-400")
                      }
                    >
                      {inStock ? "库存 " + totalStock : "无货"}
                    </div>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}

        <p className="pt-2 text-center text-xs text-neutral-400">
          价格和库存为演示数据。接入真实 API 后将显示实时信息。
        </p>
      </main>
    </div>
  );
}
