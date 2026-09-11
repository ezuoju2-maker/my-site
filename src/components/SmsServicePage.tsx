import { useState } from "react";
import { getBase } from "../lib/url";

type SmsService = { id: string; name: string; color: string; letter: string };
type SmsCountry = { id: string; name: string; code: string; flag: string };

const SERVICES: SmsService[] = [
  {
    "id": "whatsapp",
    "name": "WhatsApp",
    "color": "#25D366",
    "letter": "W"
  },
  {
    "id": "telegram",
    "name": "Telegram",
    "color": "#0088cc",
    "letter": "T"
  },
  {
    "id": "google",
    "name": "Google",
    "color": "#4285F4",
    "letter": "G"
  },
  {
    "id": "facebook",
    "name": "Facebook",
    "color": "#1877F2",
    "letter": "f"
  },
  {
    "id": "instagram",
    "name": "Instagram",
    "color": "#E1306C",
    "letter": "I"
  },
  {
    "id": "tiktok",
    "name": "TikTok",
    "color": "#010101",
    "letter": "T"
  },
  {
    "id": "discord",
    "name": "Discord",
    "color": "#5865F2",
    "letter": "D"
  },
  {
    "id": "x",
    "name": "X / Twitter",
    "color": "#000000",
    "letter": "X"
  }
];

const COUNTRIES: SmsCountry[] = [
  {
    "id": "us",
    "name": "美国",
    "code": "+1",
    "flag": "🇺🇸"
  },
  {
    "id": "gb",
    "name": "英国",
    "code": "+44",
    "flag": "🇬🇧"
  },
  {
    "id": "ca",
    "name": "加拿大",
    "code": "+1",
    "flag": "🇨🇦"
  },
  {
    "id": "au",
    "name": "澳大利亚",
    "code": "+61",
    "flag": "🇦🇺"
  },
  {
    "id": "sg",
    "name": "新加坡",
    "code": "+65",
    "flag": "🇸🇬"
  },
  {
    "id": "jp",
    "name": "日本",
    "code": "+81",
    "flag": "🇯🇵"
  },
  {
    "id": "kr",
    "name": "韩国",
    "code": "+82",
    "flag": "🇰🇷"
  },
  {
    "id": "de",
    "name": "德国",
    "code": "+49",
    "flag": "🇩🇪"
  }
];

const ChevronRight = () => (
  <svg className="h-4 w-4 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default function SmsServicePage() {
  const [serviceQuery, setServiceQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  function goBack() {
    window.location.href = `${getBase()}dashboard/`;
  }

  const filteredServices = SERVICES.filter((s) =>
    s.name.toLowerCase().includes(serviceQuery.trim().toLowerCase()),
  );

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.includes(countryQuery.trim()) ||
      c.code.includes(countryQuery.trim()),
  );

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          <button
            type="button"
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center text-neutral-700"
            aria-label="返回"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-neutral-900">接码系统</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-4">
        <div className="relative">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

        <section>
          <h2 className="mb-3 text-base font-semibold text-neutral-900">热门服务</h2>
          <div className="grid grid-cols-2 gap-3">
            {filteredServices.map((service) => (
              <button key={service.id} type="button" className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: service.color }}>
                  {service.letter}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">{service.name}</span>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="flex w-full items-center justify-between rounded-xl border border-neutral-100 bg-white px-4 py-3 text-left">
          <span className="text-sm text-neutral-900">其他服务</span>
          <ChevronRight />
        </button>

        <div className="relative">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <h2 className="mb-3 text-base font-semibold text-neutral-900">热门国家</h2>
          <div className="grid grid-cols-2 gap-3">
            {filteredCountries.map((country) => (
              <button key={country.id} type="button" className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl leading-none" aria-hidden="true">
                  {country.flag}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-neutral-900">{country.name}</div>
                  <div className="text-xs text-neutral-400">{country.code}</div>
                </div>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="flex w-full items-center justify-between rounded-xl border border-neutral-100 bg-white px-4 py-3 text-left">
          <span className="text-sm text-neutral-900">其他国家</span>
          <ChevronRight />
        </button>
      </main>
    </div>
  );
}
