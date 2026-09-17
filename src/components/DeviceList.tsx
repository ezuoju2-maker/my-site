import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";

type Device = {
  deviceId: string;
  deviceType: string | null;
  deviceModel: string | null;
  modelConfidence: string | null;
  osVersion: string | null;
  browser: string | null;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  ipAddress: string | null;
  location: string | null;
};

// 把"系列"型号收敛到最可能的一个具体型号
const MODEL_CONVERGE: Record<string, string> = {
  "iPhone X/XS/11 Pro/12 mini/13 mini 系列": "iPhone 12 mini",
  "iPhone 12/13/14 系列": "iPhone 13",
  "iPhone 14 Pro/15/16 系列": "iPhone 15",
  "iPhone 12 Pro Max/13 Pro Max/14 Plus 系列": "iPhone 13 Pro Max",
  "iPhone 14 Pro Max/15 Plus/16 Plus 系列": "iPhone 15 Pro Max",
  "iPhone SE/8/7/6s 系列": "iPhone SE",
  "iPhone XR/11 系列": "iPhone 11",
  "iPhone XS Max/11 Pro Max 系列": "iPhone XS Max",
  "iPhone 6/7/8 Plus 系列": "iPhone 8 Plus",
  "iPhone 16 Pro 系列": "iPhone 16 Pro",
  "iPhone 16 Pro Max 系列": "iPhone 16 Pro Max",
};

function pickOneModel(model: string | null): string {
  if (!model || model === "未知" || model.includes("未知")) return "iPhone";
  if (MODEL_CONVERGE[model]) return MODEL_CONVERGE[model];
  if (model.includes("/")) return model.split("/")[0].trim();
  return model;
}

function getOSFamily(deviceType: string | null): string {
  if (!deviceType) return "未知";
  if (deviceType === "iPhone" || deviceType === "iPad" || deviceType === "Mac") return "iOS";
  if (deviceType === "Android") return "Android";
  if (/harmony|鸿蒙/i.test(deviceType)) return "鸿蒙";
  return deviceType;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "未知";
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

function formatDateTime(iso: string | null): string {
  if (!iso) return "未知";
  try {
    const t = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${hh}:${mm}`;
  } catch {
    return iso;
  }
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

  async function handleRevoke(deviceId: string) {
    setRevokingId(deviceId);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/devices?device_id=${encodeURIComponent(deviceId)}`,
        { method: "DELETE", credentials: "include" },
      );
      const data = await parseApiResponse(response);
      if (!response.ok || !data.ok) {
        setError("撤销失败，请稍后重试");
        return;
      }
      // 同步清掉本地 device_id（如果是当前设备）
      try {
        if (localStorage.getItem("device_id") === deviceId) {
          localStorage.removeItem("device_id");
        }
      } catch {}
      setDevices((prev) => (prev ? prev.filter((d) => d.deviceId !== deviceId) : prev));
      setConfirmId(null);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setRevokingId(null);
    }
  }

  async function submitCorrection(deviceId: string, model: string) {
    if (!model.trim()) return;
    setCorrectSaving(true);
    setError("");
    try {
      const response = await fetch(API_BASE_URL + "/api/user/devices", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, model: model.trim() }),
      });
      const data = await parseApiResponse(response);
      if (!response.ok || !data.ok) { setError("提交失败，请重试"); return; }
      setDevices((prev) =>
        prev ? prev.map((d) => d.deviceId === deviceId ? { ...d, groundTruthModel: model.trim(), correctedAt: new Date().toISOString() } : d) : prev
      );
      setCorrectingId(null);
      setCorrectInput("");
    } catch { setError("网络错误"); }
    finally { setCorrectSaving(false); }
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
          <h1 className="text-base font-semibold text-neutral-900">登录设备</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        <p className="text-xs leading-5 text-neutral-500">
          以下是最近登录过你账号的设备。如发现陌生设备，请立即撤销并修改密码。
        </p>

        {devices === null && (
          <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
            <p className="mt-3 text-sm text-neutral-500">加载中…</p>
          </div>
        )}

        {devices && devices.length === 0 && (
          <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">暂无登录记录</p>
          </div>
        )}

        {devices && devices.map((d) => (
          <div key={d.deviceId} className="rounded-2xl border border-neutral-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-base font-medium text-neutral-900">
                    {pickOneModel(d.deviceModel)}
                  </div>
                  {d.modelConfidence === "高" && (
                    <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                      精准
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-neutral-500">
                  <div>系统：{getOSFamily(d.deviceType)}{d.osVersion ? ` ${d.osVersion}` : ""}</div>
                  <div>浏览器：{d.browser || "未知"}</div>
                  <div>首次登录：{formatDateTime(d.firstLoginAt)}</div>
                  <div>最近登录：{timeAgo(d.lastLoginAt)}</div>
                  <div>IP：{d.ipAddress || "未知"}</div>
                  <div>登录地点：{d.location || "未知"}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmId(d.deviceId)}
                disabled={revokingId === d.deviceId}
                className="shrink-0 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
              >
                {revokingId === d.deviceId ? "撤销中…" : "撤销"}
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

      {correctingId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => { if (e.target === e.currentTarget && !correctSaving) setCorrectingId(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900">你用的是哪款 iPhone？</h2>
            <p className="mt-1 text-xs text-neutral-500">你的确认将帮助改进识别准确率</p>
            <div className="mt-4 space-y-2">
              {(devices?.find((x) => x.deviceId === correctingId)?.modelCandidates || []).map((c) => (
                <button
                  key={c.model}
                  type="button"
                  onClick={() => submitCorrection(correctingId, c.model)}
                  disabled={correctSaving}
                  className="w-full rounded-lg border border-neutral-200 py-3 text-sm font-medium text-neutral-800 hover:border-neutral-900 disabled:opacity-50"
                >
                  {c.model}
                </button>
              ))}
            </div>
            <div className="mt-3 border-t border-neutral-100 pt-3">
              <input
                type="text"
                value={correctInput}
                onChange={(e) => setCorrectInput(e.target.value)}
                placeholder="其他型号（手动输入）"
                className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setCorrectingId(null)} disabled={correctSaving}
                className="h-11 flex-1 rounded-lg border border-neutral-300 text-base font-medium text-neutral-700 disabled:opacity-50">
                取消
              </button>
              <button type="button" onClick={() => submitCorrection(correctingId, correctInput)} disabled={correctSaving || !correctInput.trim()}
                className="h-11 flex-1 rounded-lg bg-neutral-900 text-base font-medium text-white disabled:opacity-50">
                {correctSaving ? "提交中…" : "提交"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              撤销后该设备的登录记录将被清除。
              <br />
              下次登录时会重新记录。
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
