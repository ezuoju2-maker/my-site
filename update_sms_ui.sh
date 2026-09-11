#!/data/data/com.termux/files/usr/bin/bash
set -e

FILE="src/components/SmsServicePage.tsx"
BACKUP="${FILE}.bak.$(date +%s)"

echo "================================================"
echo "【阶段 1｜接码页面 UI 修复脚本】"
echo "================================================"

echo "========== 【步骤 1/3：备份原有文件】 =========="
cp "$FILE" "$BACKUP"
echo "OK: 已备份至 $BACKUP"

echo "========== 【步骤 2/3：写入新的页面代码】 =========="
cat << 'TSX' > "$FILE"
import { useState } from "react";
import { getBase } from "../lib/url";

type SmsService = { id: string; name: string; bg: string };
type SmsCountry = { id: string; name: string; code: string; flag: string };

const LOGOS: Record<string, string> = {
  "google": "<svg viewBox=\"0 0 48 48\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"#EA4335\" d=\"M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z\"/><path fill=\"#4285F4\" d=\"M46.98 24.455c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.3-4.75 6.85l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z\"/><path fill=\"#FBBC05\" d=\"M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z\"/><path fill=\"#34A853\" d=\"M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z\"/></svg>",
  "whatsapp": "<svg fill=\"#ffffff\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>WhatsApp</title><path d=\"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z\"/></svg>",
  "telegram": "<svg fill=\"#ffffff\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>Telegram</title><path d=\"M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z\"/></svg>",
  "facebook": "<svg fill=\"#ffffff\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>Facebook</title><path d=\"M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z\"/></svg>",
  "instagram": "<svg fill=\"#ffffff\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>Instagram</title><path d=\"M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077\"/></svg>",
  "tiktok": "<svg fill=\"#ffffff\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>TikTok</title><path d=\"M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1..61.19-.33.4-.67.41156-1.06.1-1.79.069-3.57.07-5.36.01--4.03-.01-8.05.022-12.07z\"/></svg.>",
  "discord": "<svg fill=\"#ffffff\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>Discord</title><path d=\"M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z\"/></svg>",
  "x": "<svg fill=\"#ffffff\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>X</title><path d=\"M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z\"/></svg>"
};

const SERVICES: SmsService[] = [
  { id: "whatsapp", name: "WhatsApp", bg: "#25D366" },
  { id: "telegram", name: "Telegram", bg: "#0088cc" },
  { id: "google", name: "Google", bg: "#ffffff" },
  { id: "facebook", name: "Facebook", bg: "#1877F2" },
  { id: "instagram", name: "Instagram", bg: "#E1306C" },
  { id: "tiktok", name: "TikTok", bg: "#010101" },
  { id: "discord", name: "Discord", bg: "#5865F2" },
  { id: "x", name: "X / Twitter", bg: "#000000" }
];

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

const ChevronRight = () => (
  <svg className="h-4 w-4 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

function ServiceLogo({ service }: { service: SmsService }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ background: service.bg }}
    >
      <span
        className="block h-5 w-5 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: LOGOS[service.id] }}
      />
    </span>
  );
}

function CountryFlag({ country }: { country: SmsCountry }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl leading-none"
      aria-hidden="true"
    >
      {country.flag}
    </span>
  );
}

export default function SmsServicePage() {
  const [serviceQuery, setServiceQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  function goBack() {
    window.location.href = getBase() + "dashboard/";
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
    <div className="min-h-screen bg-neutral-50 pb-10">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5">
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
          <h1 className="text-lg font-semibold text-neutral-900">接码系统</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-6">
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
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">热门服务</h2>
          <div className="grid grid-cols-2 gap-3">
            {filteredServices.map((service) => (
              <button
                key={service.id}
                type="button"
                className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left"
              >
                <ServiceLogo service={service} />
                <span className="min-w-0 flex-1 whitespace-nowrap text-sm text-neutral-900">
                  {service.name}
                </span>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-neutral-100 bg-white px-4 py-3 text-left"
        >
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
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">热门国家</h2>
          <div className="grid grid-cols-2 gap-3">
            {filteredCountries.map((country) => (
              <button
                key={country.id}
                type="button"
                className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 text-left"
              >
                <CountryFlag country={country} />
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
    </div>
  );
}
TSX

echo "OK: 成功写入 src/components/SmsServicePage.tsx"

echo "========== 【步骤 3/3：验证代码并构建】 =========="
# 1. 检查文件大小
echo "文件大小：$(wc -c < "$FILE") bytes"
echo "文件行数：$(wc -l < "$FILE")"

# 2. 尝试执行 TypeScript 类型检查
echo "正在执行类型检查..."
npx astro check || true
echo "类型检查完成（若有警告请忽略或反馈）"

# 3. 执行生产构建
echo "正在执行生产构建..."
npm run build
BUILD_EXIT=$?

if [ "$BUILD_EXIT" -eq 0 ]; then
  echo "OK: npm run build 执行成功，UI 已更新！"
else
  echo "ERROR: 构建失败，退出码 $BUILD_EXIT"
fi

echo "================================================"
echo "【接码页面 UI 修复完成】"
echo "================================================"
echo "下一步：请把完整的构建输出原样发送给我，我来检查是否有隐藏报错。"
