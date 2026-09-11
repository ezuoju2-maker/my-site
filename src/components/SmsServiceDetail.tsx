import { useMemo, useState } from "react";
import { getBase } from "../lib/url";
import { getFlag, type SmsCountry } from "./sms-countries-data";
import { getStockForService } from "./sms-mock-stock";

type Props = {
  serviceSlug: string;
  serviceName: string;
  allCountries: SmsCountry[];
  onBack: () => void;
  onPickCountry: (code: string) => void;
};

export default function SmsServiceDetail({
  serviceSlug,
  serviceName,
  allCountries,
  onBack,
  onPickCountry,
}: Props) {
  const [query, setQuery] = useState("");

  const countryMap = useMemo(() => {
    const m = new Map<string, SmsCountry>();
    for (const c of allCountries) m.set(c.code, c);
    return m;
  }, [allCountries]);

  const stock = useMemo(
    () => getStockForService(serviceSlug, allCountries),
    [serviceSlug, allCountries],
  );

  const available = useMemo(
    () =>
      stock
        .map((s) => ({ s, c: countryMap.get(s.countryCode) }))
        .filter((x): x is { s: typeof stock[0]; c: SmsCountry } => Boolean(x.c))
        .sort((a, b) => b.s.stock - a.s.stock),
    [stock, countryMap],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      ({ c }) =>
        c.name.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase() === q,
    );
  }, [available, query]);

  const base = getBase();

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
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-neutral-900">
              {serviceName}
            </h1>
            <p className="text-xs text-neutral-400">
              支持 {available.length} 个国家 / 地区
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
            <img
              src={`${base}icons/${serviceSlug}.svg`}
              alt=""
              width="22"
              height="22"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </span>
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
            placeholder="搜索国家 / 地区"
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-base outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-neutral-100 bg-white p-4 text-sm text-neutral-500">
            未找到匹配的国家
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map(({ s, c }) => {
              const inStock = s.stock > 0;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => onPickCountry(c.code)}
                  className="flex w-full items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left active:bg-neutral-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl leading-none" aria-hidden="true">
                    {getFlag(c.code)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-neutral-900">
                      {c.name}
                    </div>
                    <div className="truncate text-xs text-neutral-400">
                      {c.dial}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-neutral-900">
                      ${s.price.toFixed(2)}
                    </div>
                    <div
                      className={
                        "text-xs " +
                        (inStock ? "text-green-600" : "text-neutral-400")
                      }
                    >
                      {inStock ? `库存 ${s.stock}` : "无货"}
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
