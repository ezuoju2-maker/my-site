import { useMemo, useState } from "react";
import { getBase } from "../lib/url";
import {
  ALL_SERVICES as RAW_SERVICES,
  POPULAR_SERVICES as RAW_POPULAR,
  groupByCategory as rawGroupByCategory,
  mergeWithAuto,
  type SmsService,
} from "./sms-services-data";
import { AUTO_SERVICES } from "./sms-services-auto";

const ALL_SERVICES = mergeWithAuto(RAW_SERVICES, AUTO_SERVICES);

const POPULAR_SERVICES = (() => {
  const known = new Map(ALL_SERVICES.map((s) => [s.slug, s]));
  const out: SmsService[] = [];
  for (const p of RAW_POPULAR) {
    const fresh = known.get(p.slug);
    if (fresh) out.push(fresh);
  }
  return out;
})();

function groupByCategory() {
  const groups = rawGroupByCategory();
  const autoOnly = ALL_SERVICES.filter(
    (s) => !RAW_SERVICES.some((r) => r.slug === s.slug),
  );
  if (autoOnly.length === 0) return groups;

  const map = new Map(groups.map((g) => [g.category, g]));
  for (const svc of autoOnly) {
    const existing = map.get(svc.category);
    if (existing) {
      existing.items.push(svc);
    } else {
      map.set(svc.category, {
        category: svc.category,
        label: categoryLabel(svc.category),
        items: [svc],
      });
    }
  }
  return Array.from(map.values());
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    social: "社交与通讯",
    china: "中国平台",
    japan_korea: "日本 · 韩国",
    sea: "东南亚",
    south_asia: "南亚",
    tw_hk_mo: "港澳台",
    russia: "俄罗斯 · 独联体",
    europe: "欧洲",
    north_america: "北美",
    latam: "拉美",
    mena_africa: "中东 · 非洲",
    oceania: "大洋洲",
    ai: "AI 工具",
    dev: "开发者服务",
    ecommerce: "电商购物",
    entertainment: "影音娱乐",
    gaming: "游戏",
    travel: "出行旅游",
    fintech: "金融科技",
    productivity: "效率工具",
    other: "其他",
  };
  return labels[cat] || cat;
}

type SmsCountry = { id: string; name: string; code: string; flag: string };

const COUNTRIES: SmsCountry[] = [
  { id: "us", name: "美国",     code: "+1",  flag: "\u{1F1FA}\u{1F1F8}" },
  { id: "gb", name: "英国",     code: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { id: "ca", name: "加拿大",   code: "+1",  flag: "\u{1F1E8}\u{1F1E6}" },
  { id: "au", name: "澳大利亚", code: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { id: "sg", name: "新加坡",   code: "+65", flag: "\u{1F1F8}\u{1F1EC}" },
  { id: "jp", name: "日本",     code: "+81", flag: "\u{1F1EF}\u{1F1F5}" },
  { id: "kr", name: "韩国",     code: "+82", flag: "\u{1F1F0}\u{1F1F7}" },
  { id: "de", name: "德国",     code: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
];

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
  const initial = service.name.charAt(0).toUpperCase();

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
        {initial}
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

const ChevronRight = () => (
  <svg
    className="h-4 w-4 shrink-0 text-neutral-300"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

function ServiceRow({ service }: { service: SmsService }) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left"
    >
      <BrandIcon service={service} />
      <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">
        {service.name}
      </span>
      <ChevronRight />
    </button>
  );
}

export default function SmsServicePage() {
  const [serviceQuery, setServiceQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [showAllServices, setShowAllServices] = useState(false);

  const grouped = useMemo(() => groupByCategory(), []);

  const searchResults = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return null;
    return ALL_SERVICES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q),
    );
  }, [serviceQuery]);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.includes(countryQuery.trim()) ||
      c.code.includes(countryQuery.trim()),
  );

  function goBack() {
    window.location.href = getBase() + "dashboard/";
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5">
          <button
            type="button"
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center text-neutral-700"
            aria-label="返回"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">接码系统</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-6">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={serviceQuery}
            onChange={(e) => setServiceQuery(e.target.value)}
            placeholder="搜索服务"
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-base outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

        {searchResults ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              搜索结果
              <span className="ml-2 text-sm font-normal text-neutral-400">
                {searchResults.length} 项
              </span>
            </h2>
            {searchResults.length === 0 ? (
              <p className="rounded-xl border border-neutral-100 bg-white p-4 text-sm text-neutral-500">
                未找到匹配的服务
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map((s) => (
                  <ServiceRow key={s.slug} service={s} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-neutral-900">
                热门服务
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_SERVICES.slice(0, 8).map((s) => (
                  <ServiceRow key={s.slug} service={s} />
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={() => setShowAllServices(true)}
              className="flex w-full items-center justify-between rounded-xl border border-neutral-100 bg-white px-4 py-3 text-left"
            >
              <span className="text-sm text-neutral-900">
                全部服务
                <span className="ml-2 text-xs text-neutral-400">
                  {ALL_SERVICES.length} 种
                </span>
              </span>
              <ChevronRight />
            </button>
          </>
        )}

        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <input
            type="text"
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
            placeholder="搜索国家 / 地区"
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-base outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            热门国家
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {filteredCountries.map((country) => (
              <button
                key={country.id}
                type="button"
                className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl leading-none"
                  aria-hidden="true"
                >
                  {country.flag}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-neutral-900">
                    {country.name}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {country.code}
                  </div>
                </div>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-neutral-100 bg-white px-4 py-3 text-left"
        >
          <span className="text-sm text-neutral-900">其他国家</span>
          <ChevronRight />
        </button>
      </main>

      {showAllServices && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-50">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-neutral-100 bg-white px-5">
            <button
              type="button"
              onClick={() => setShowAllServices(false)}
              className="flex h-9 w-9 items-center justify-center text-neutral-700"
              aria-label="关闭"
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-neutral-900">
              全部服务
            </h1>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-8 px-5 py-6">
              {grouped.map(({ category, label, items }) => (
                <section key={category}>
                  <h2 className="mb-3 text-base font-semibold text-neutral-900">
                    {label}
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      {items.length}
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((s) => (
                      <ServiceRow key={s.slug} service={s} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
