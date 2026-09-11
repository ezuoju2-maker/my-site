import { useEffect, useMemo, useState } from "react";
import { getBase } from "../lib/url";
import {
  ALL_SERVICES as RAW_SERVICES,
  POPULAR_SERVICES as RAW_POPULAR,
  groupByCategory as rawGroupByCategory,
  mergeWithAuto,
  type SmsService,
} from "./sms-services-data";
import { AUTO_SERVICES } from "./sms-services-auto";
import { scoreService } from "./sms-service-aliases";
import {
  ALL_COUNTRIES as RAW_COUNTRIES,
  POPULAR_COUNTRIES as RAW_POPULAR_COUNTRIES,
  groupByRegion as rawGroupByRegion,
  getFlag,
  type SmsCountry,
  type SmsRegion,
  REGION_LABELS,
} from "./sms-countries-data";
import { AUTO_COUNTRIES } from "./sms-countries-auto";
import SmsServiceDetail from "./SmsServiceDetail";
import SmsCountryDetail from "./SmsCountryDetail";
import SmsOrderPage from "./SmsOrderPage";
import SmsChannelPage from "./SmsChannelPage";
import type { PaymentMethodId } from "./sms-channels";

const ALL_SERVICES = mergeWithAuto(RAW_SERVICES, AUTO_SERVICES);

const ALL_COUNTRIES: SmsCountry[] = (() => {
  const existing = new Set(RAW_COUNTRIES.map((c) => c.code));
  const extra = AUTO_COUNTRIES.filter((a) => !existing.has(a.code)).map(
    (a) => ({
      code: a.code,
      name: a.name,
      nameEn: a.nameEn,
      dial: a.dial,
      region: a.region as SmsRegion,
    }),
  );
  return [...RAW_COUNTRIES, ...extra];
})();

const POPULAR_SERVICES: SmsService[] = RAW_POPULAR.map((p) =>
  ALL_SERVICES.find((s) => s.slug === p.slug),
).filter((s): s is SmsService => Boolean(s));

const POPULAR_COUNTRIES: SmsCountry[] = RAW_POPULAR_COUNTRIES.map((p) =>
  ALL_COUNTRIES.find((c) => c.code === p.code),
).filter((c): c is SmsCountry => Boolean(c));

const CATEGORY_LABEL_MAP: Record<string, string> = {
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

function groupByCategory() {
  const groups = rawGroupByCategory();
  const autoOnly = ALL_SERVICES.filter(
    (s) => !RAW_SERVICES.some((r) => r.slug === s.slug),
  );
  if (autoOnly.length === 0) return groups;
  const map = new Map(groups.map((g) => [g.category, g]));
  for (const svc of autoOnly) {
    const existing = map.get(svc.category);
    if (existing) existing.items.push(svc);
    else {
      map.set(svc.category, {
        category: svc.category,
        label: CATEGORY_LABEL_MAP[svc.category] || svc.category,
        items: [svc],
      });
    }
  }
  return Array.from(map.values());
}

function groupByRegion() {
  const groups = rawGroupByRegion();
  const autoOnly = ALL_COUNTRIES.filter(
    (c) => !RAW_COUNTRIES.some((r) => r.code === c.code),
  );
  if (autoOnly.length === 0) return groups;
  const map = new Map(groups.map((g) => [g.region, g]));
  for (const country of autoOnly) {
    const existing = map.get(country.region);
    if (existing) existing.items.push(country);
    else {
      map.set(country.region, {
        region: country.region,
        label: REGION_LABELS[country.region] || country.region,
        items: [country],
      });
    }
  }
  return Array.from(map.values());
}

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

const ChevronRight = () => (
  <svg className="h-4 w-4 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const SearchIcon = () => (
  <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

type View =
  | { type: "list" }
  | { type: "service"; slug: string }
  | { type: "country"; code: string }
  | { type: "order"; serviceSlug: string; countryCode: string }
  | {
      type: "channel";
      serviceSlug: string;
      countryCode: string;
      payment: PaymentMethodId;
      quantity: number;
    };

type ListProps = {
  onOpenService: (svc: SmsService) => void;
  onOpenCountry: (c: SmsCountry) => void;
};

function ListView({ onOpenService, onOpenCountry }: ListProps) {
  const [serviceQuery, setServiceQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);

  const groupedServices = useMemo(() => groupByCategory(), []);
  const groupedCountries = useMemo(() => groupByRegion(), []);

  const searchedServices = useMemo(() => {
    const q = serviceQuery.trim();
    if (!q) return null;
    return ALL_SERVICES.map((s) => ({ svc: s, score: scoreService(s.slug, s.name, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.svc);
  }, [serviceQuery]);

  const searchedCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return null;
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase() === q,
    );
  }, [countryQuery]);

  function goBack() {
    window.location.href = getBase() + "dashboard/";
  }

  function ServiceRow({ service }: { service: SmsService }) {
    return (
      <button
        type="button"
        onClick={() => onOpenService(service)}
        className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left active:bg-neutral-50"
      >
        <BrandIcon service={service} />
        <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">
          {service.name}
        </span>
        <ChevronRight />
      </button>
    );
  }

  function CountryRow({ country }: { country: SmsCountry }) {
    return (
      <button
        type="button"
        onClick={() => onOpenCountry(country)}
        className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left active:bg-neutral-50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl leading-none" aria-hidden="true">
          {getFlag(country.code)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-neutral-900">{country.name}</div>
          <div className="truncate text-xs text-neutral-400">{country.dial}</div>
        </div>
        <ChevronRight />
      </button>
    );
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
            <ArrowLeft />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">接码系统</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-6">
        <div className="relative">
          <SearchIcon />
          <input
            type="text"
            value={serviceQuery}
            onChange={(e) => setServiceQuery(e.target.value)}
            placeholder="搜索服务"
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-base outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

        {searchedServices ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              搜索结果
              <span className="ml-2 text-sm font-normal text-neutral-400">
                {searchedServices.length} 项
              </span>
            </h2>
            {searchedServices.length === 0 ? (
              <p className="rounded-xl border border-neutral-100 bg-white p-4 text-sm text-neutral-500">
                未找到匹配的服务
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {searchedServices.map((s) => (
                  <ServiceRow key={s.slug} service={s} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-neutral-900">热门服务</h2>
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
          <GlobeIcon />
          <input
            type="text"
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
            placeholder="搜索国家 / 地区"
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-base outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

        {searchedCountries ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              搜索结果
              <span className="ml-2 text-sm font-normal text-neutral-400">
                {searchedCountries.length} 项
              </span>
            </h2>
            {searchedCountries.length === 0 ? (
              <p className="rounded-xl border border-neutral-100 bg-white p-4 text-sm text-neutral-500">
                未找到匹配的国家 / 地区
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {searchedCountries.map((c) => (
                  <CountryRow key={c.code} country={c} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-neutral-900">热门国家</h2>
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_COUNTRIES.slice(0, 8).map((c) => (
                  <CountryRow key={c.code} country={c} />
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={() => setShowAllCountries(true)}
              className="flex w-full items-center justify-between rounded-xl border border-neutral-100 bg-white px-4 py-3 text-left"
            >
              <span className="text-sm text-neutral-900">
                全部国家 / 地区
                <span className="ml-2 text-xs text-neutral-400">
                  {ALL_COUNTRIES.length} 个
                </span>
              </span>
              <ChevronRight />
            </button>
          </>
        )}
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
              <ArrowLeft />
            </button>
            <h1 className="text-lg font-semibold text-neutral-900">全部服务</h1>
          </header>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-8 px-5 py-6">
              {groupedServices.map(({ category, label, items }) => (
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

      {showAllCountries && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-50">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-neutral-100 bg-white px-5">
            <button
              type="button"
              onClick={() => setShowAllCountries(false)}
              className="flex h-9 w-9 items-center justify-center text-neutral-700"
              aria-label="关闭"
            >
              <ArrowLeft />
            </button>
            <h1 className="text-lg font-semibold text-neutral-900">全部国家 / 地区</h1>
          </header>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-8 px-5 py-6">
              {groupedCountries.map(({ region, label, items }) => (
                <section key={region}>
                  <h2 className="mb-3 text-base font-semibold text-neutral-900">
                    {label}
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      {items.length}
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((c) => (
                      <CountryRow key={c.code} country={c} />
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

export default function SmsServicePage() {
  const [view, setView] = useState<View>({ type: "list" });

  // 让浏览器后退键可以回到列表
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const state = e.state as View | null;
      if (state && (state.type === "service" || state.type === "country")) {
        setView(state);
      } else {
        setView({ type: "list" });
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  function openService(svc: SmsService) {
    const next: View = { type: "service", slug: svc.slug };
    window.history.pushState(next, "");
    setView(next);
  }

  function openCountry(c: SmsCountry) {
    const next: View = { type: "country", code: c.code };
    window.history.pushState(next, "");
    setView(next);
  }

  function openOrder(serviceSlug: string, countryCode: string) {
    const next: View = { type: "order", serviceSlug, countryCode };
    window.history.pushState(next, "");
    setView(next);
  }

  function openChannel(
    serviceSlug: string,
    countryCode: string,
    payment: PaymentMethodId,
    quantity: number,
  ) {
    const next: View = {
      type: "channel",
      serviceSlug,
      countryCode,
      payment,
      quantity,
    };
    window.history.pushState(next, "");
    setView(next);
  }

  function back() {
    window.history.back();
  }

  if (view.type === "service") {
    const svc = ALL_SERVICES.find((s) => s.slug === view.slug);
    if (!svc) {
      return (
        <ListView onOpenService={openService} onOpenCountry={openCountry} />
      );
    }
    return (
      <SmsServiceDetail
        serviceSlug={svc.slug}
        serviceName={svc.name}
        allCountries={ALL_COUNTRIES}
        onBack={back}
        onPickCountry={(code) => openOrder(svc.slug, code)}
      />
    );
  }

  if (view.type === "country") {
    const c = ALL_COUNTRIES.find((x) => x.code === view.code);
    if (!c) {
      return (
        <ListView onOpenService={openService} onOpenCountry={openCountry} />
      );
    }
    return (
      <SmsCountryDetail
        countryCode={c.code}
        country={c}
        allServices={ALL_SERVICES}
        onBack={back}
        onPickService={(slug) => openOrder(slug, c.code)}
      />
    );
  }

  if (view.type === "order") {
    const svc = ALL_SERVICES.find((s) => s.slug === view.serviceSlug);
    const c = ALL_COUNTRIES.find((x) => x.code === view.countryCode);
    if (!svc || !c) {
      return (
        <ListView onOpenService={openService} onOpenCountry={openCountry} />
      );
    }
    return (
      <SmsOrderPage
        service={svc}
        country={c}
        onBack={back}
        onConfirm={(payment) => {
          const PAYMENT_LABELS: Record<PaymentMethodId, string> = {
            wechat: "微信支付",
            alipay: "支付宝",
            usdt: "USDT (TRC20)",
          };
          // USDT 无通道可选，直接模拟下单
          if (payment === "usdt") {
            window.alert(
              "USDT 订单已提交（演示模式）\n\n" +
                "服务：" + svc.name + "\n" +
                "国家：" + c.name + " " + c.dial + "\n" +
                "支付方式：USDT (TRC20)\n\n" +
                "接入真实支付后将显示 USDT 收款地址。",
            );
            return;
          }
          void PAYMENT_LABELS;
          openChannel(svc.slug, c.code, payment, 1);
        }}
      />
    );
  }

  if (view.type === "channel") {
    const svc = ALL_SERVICES.find((s) => s.slug === view.serviceSlug);
    const c = ALL_COUNTRIES.find((x) => x.code === view.countryCode);
    if (!svc || !c) {
      return (
        <ListView onOpenService={openService} onOpenCountry={openCountry} />
      );
    }
    const PAYMENT_LABELS: Record<PaymentMethodId, string> = {
      wechat: "微信支付",
      alipay: "支付宝",
      usdt: "USDT (TRC20)",
    };
    return (
      <SmsChannelPage
        service={svc}
        country={c}
        paymentMethod={view.payment}
        paymentLabel={PAYMENT_LABELS[view.payment]}
        quantity={view.quantity}
        onBack={back}
      />
    );
  }

  return <ListView onOpenService={openService} onOpenCountry={openCountry} />;
}
