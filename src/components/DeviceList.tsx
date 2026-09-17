import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";

type Device = {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
};

function timeAgo(iso: string): string {
  try {
    const t = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z").getTime();
    const diff = Date.now() - t;
    if (diff < 60_000) return "刚刚";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
    if (diff < 30 * 86400_000) return `${Math.floor(diff / 86400_000)} 天前`;
    return `${Math.floor(diff / (30 * 86400_000))} 个月前`;
  } catch {
    return iso;
  }
}

function timeUntil(iso: string): string {
  try {
    const t = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z").getTime();
    const diff = t - Date.now();
    if (diff <= 0) return "已过期";
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时后`;
    return `${Math.floor(diff / 86400_000)} 天后`;
  } catch {
    return iso;
  }
}

function simplifyUA(ua: string | null): string {
  if (!ua || ua === "unknown") return "未知设备";

  // === 浏览器识别（顺序很重要）===
  let browser = "浏览器";

  // iOS 上的 Chrome / Edge / Firefox / Opera 有特殊标识
  if (ua.includes("CriOS/")) browser = "Chrome";
  else if (ua.includes("EdgiOS/")) browser = "Edge";
  else if (ua.includes("FxiOS/")) browser = "Firefox";
  else if (ua.includes("OPiOS/")) browser = "Opera";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("MicroMessenger")) browser = "微信";
  else if (ua.includes("QQBrowser")) browser = "QQ 浏览器";
  else if (ua.includes("UCBrowser")) browser = "UC 浏览器";
  else if (ua.includes("Quark")) browser = "夸克";
  else if (ua.includes("HuaweiBrowser")) browser = "华为浏览器";
  else if (ua.includes("MiuiBrowser")) browser = "小米浏览器";
  else if (ua.includes("Chrome/") || ua.includes("Chromium/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";

  // === 系统 / 设备识别 ===
  let device = "";

  // 手机 / 平板优先识别（在 OS 前）
  if (ua.includes("iPhone")) device = "iPhone";
  else if (ua.includes("iPad")) device = "iPad";
  else if (ua.includes("Android")) {
    // 尝试从 UA 里提取机型
    const m = ua.match(/Android[^;]*;s*([^;)]+)/);
    if (m && m[1] && !m[1].includes("wv") && m[1].length < 40) {
      device = m[1].trim();
      // 清理常见后缀
      device = device.replace(/\s+Build.*$/i, "").replace(/\s+Mobile.*$/i, "");
    } else {
      device = "Android";
    }
  } else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) {
    device = "Mac";
  } else if (ua.includes("Windows NT")) {
    device = "Windows";
  } else if (ua.includes("CrOS")) {
    device = "ChromeOS";
  } else if (ua.includes("Linux")) {
    device = "Linux";
  }

  if (device && browser !== "浏览器") return `${browser} · ${device}`;
  if (device) return device;
  return browser;
}

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/devices`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) {
          window.location.replace(getBase());
          return;
        }
        const data = (await parseApiResponse(response)) as unknown as {
          ok?: boolean;
          devices?: Device[];
        };
        if (cancelled) return;
        if (data.ok && Array.isArray(data.devices)) {
          setDevices(data.devices);
        } else {
          setError("数据格式异常");
        }
      } catch {
        if (!cancelled) setError("网络错误");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRevoke(id: string) {
    setRevokingId(id);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/devices?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await parseApiResponse(response);
      if (!response.ok || !data.ok) {
        setError("撤销失败，请稍后重试");
        return;
      }
      setDevices((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
      setConfirmId(null);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setRevokingId(null);
    }
  }

  function goBack() {
    window.location.href = getBase() + "welcome/";
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center text-neutral-700"
            aria-label="返回"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-neutral-900">已信任的设备</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        <p className="text-xs leading-5 text-neutral-500">
          这些设备在 90 天内可以自动登录，无需输入密码。如发现陌生设备，请立即撤销并修改密码。
        </p>

        {devices === null && (
          <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
            <p className="mt-3 text-sm text-neutral-500">加载中…</p>
          </div>
        )}

        {devices && devices.length === 0 && (
          <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">暂无可信设备</p>
          </div>
        )}

        {devices && devices.map((d) => (
          <div
            key={d.id}
            className="rounded-2xl border border-neutral-100 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-medium text-neutral-900">
                  {simplifyUA(d.userAgent)}
                </div>
                <div className="mt-1 space-y-0.5 text-xs text-neutral-500">
                  <div>最后使用：{timeAgo(d.lastUsedAt)}</div>
                  <div>添加时间：{d.createdAt.slice(0, 16)}</div>
                  <div>剩余有效期：{timeUntil(d.expiresAt)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmId(d.id)}
                disabled={revokingId === d.id}
                className="shrink-0 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
              >
                {revokingId === d.id ? "撤销中…" : "撤销"}
              </button>
            </div>
          </div>
        ))}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </main>

      {/* 撤销确认弹窗 */}
      {confirmId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !revokingId) setConfirmId(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">
              ⚠️
            </div>
            <h2 className="mt-4 text-center text-lg font-semibold text-neutral-900">
              撤销此设备？
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-neutral-500">
              该设备将无法再自动登录。
              <br />
              用户在此设备上需要重新输入密码。
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                disabled={!!revokingId}
                className="h-11 flex-1 rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => confirmId && handleRevoke(confirmId)}
                disabled={!!revokingId}
                className="h-11 flex-1 rounded-lg bg-red-600 text-base font-medium text-white disabled:opacity-50"
              >
                {revokingId ? "撤销中…" : "确认撤销"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
