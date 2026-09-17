import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";

type Candidate = { model: string; score: number };

type Device = {
  deviceId: string;
  deviceType: string | null;
  deviceModel: string | null;
  deviceFamily: string | null;
  modelConfidence: string | null;
  modelIdentifiability: string | null;
  modelSource: string | null;
  detectorVersion: string | null;
  modelCandidates: Candidate[];
  topCandidate: string | null;
  secondCandidate: string | null;
  osName: string | null;
  osVersion: string | null;
  browserName: string | null;
  browserVersion: string | null;
  groundTruthModel: string | null;
  correctedAt: string | null;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  ipAddress: string | null;
  location: string | null;
};

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
  } catch { return iso; }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "未知";
  try {
    const t = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
    const p = (n: number) => String(n).padStart(2, "0");
    return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`;
  } catch { return iso; }
}

function badgeForIdentifiability(id: string | null): { text: string; cls: string } | null {
  switch (id) {
    case "exact": return { text: "精确", cls: "bg-green-50 text-green-600" };
    case "probable": return { text: "较可靠", cls: "bg-blue-50 text-blue-600" };
    case "ambiguous": return { text: "推断", cls: "bg-amber-50 text-amber-600" };
    default: return null;
  }
}

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctInput, setCorrectInput] = useState("");
  const [correctSaving, setCorrectSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/devices`, {
          method: "GET", credentials: "include", cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) { window.location.replace(getBase()); return; }
        const data = (await parseApiResponse(response)) as unknown as { ok?: boolean; devices?: Device[] };
        if (cancelled) return;
        if (data.ok && Array.isArray(data.devices)) setDevices(data.devices);
        else setError("数据格式异常");
      } catch { if (!cancelled) setError("网络错误"); }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function handleRevoke(deviceId: string) {
    setRevokingId(deviceId); setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/devices?device_id=${encodeURIComponent(deviceId)}`, {
        method: "DELETE", credentials: "include",
      });
      const data = await parseApiResponse(response);
      if (!response.ok || !data.ok) { setError("撤销失败，请稍后重试"); return; }
      try { if (localStorage.getItem("device_id") === deviceId) localStorage.removeItem("device_id"); } catch {}
      setDevices((prev) => (prev ? prev.filter((d) => d.deviceId !== deviceId) : prev));
      setConfirmId(null);
    } catch { setError("网络错误，请重试"); }
    finally { setRevokingId(null); }
  }

  async function submitCorrection(deviceId: string, model: string) {
    if (!model.trim()) return;
    setCorrectSaving(true); setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/devices`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, model: model.trim() }),
      });
      const data = await parseApiResponse(response);
      if (!response.ok || !data.ok) { setError("提交失败，请重试"); return; }
      setDevices((prev) =>
        prev ? prev.map((d) => d.deviceId === deviceId
          ? { ...d, groundTruthModel: model.trim(), correctedAt: new Date().toISOString() }
          : d) : prev
      );
      setCorrectingId(null);
      setCorrectInput("");
    } catch { setError("网络错误"); }
    finally { setCorrectSaving(false); }
  }

  function goBack() { window.location.href = getBase() + "welcome/"; }

  const correctingDevice = devices?.find((d) => d.deviceId === correctingId) ?? null;

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button type="button" onClick={goBack} className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
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

        {devices && devices.map((d) => {
          const badge = badgeForIdentifiability(d.modelIdentifiability);
          const isExpanded = expandedId === d.deviceId;
          const showCandidates = d.modelCandidates.length > 1;
          return (
            <div key={d.deviceId} className="rounded-2xl border border-neutral-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-base font-medium text-neutral-900">
                      {d.groundTruthModel || d.deviceModel || d.deviceType || "未知设备"}
                    </div>
                    {badge && !d.groundTruthModel && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                        {badge.text}
                      </span>
                    )}
                    {d.groundTruthModel && (
                      <span className="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                        已确认
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs text-neutral-500">
                    <div>系统：{d.osName || "未知"}{d.osVersion ? ` ${d.osVersion}` : ""}</div>
                    <div>浏览器：{d.browserName || "未知"}{d.browserVersion ? ` ${d.browserVersion}` : ""}</div>
                    <div>首次登录：{formatDateTime(d.firstLoginAt)}</div>
                    <div>最近登录：{timeAgo(d.lastLoginAt)}</div>
                    <div>IP：{d.ipAddress || "未知"}</div>
                    <div>登录地点：{d.location || "未知"}</div>
                  </div>

                  {!d.groundTruthModel && d.modelIdentifiability === "ambiguous" && (
                    <button
                      type="button"
                      onClick={() => { setCorrectingId(d.deviceId); setCorrectInput(""); }}
                      className="mt-3 mr-3 text-xs text-purple-600 underline-offset-2 hover:underline"
                    >
                      更正真实型号
                    </button>
                  )}

                  {showCandidates && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : d.deviceId)}
                      className="mt-3 text-xs text-blue-600 underline-offset-2 hover:underline"
                    >
                      {isExpanded ? "收起候选" : `查看 ${d.modelCandidates.length} 个候选 ▾`}
                    </button>
                  )}

                  {isExpanded && showCandidates && (
                    <ul className="mt-2 space-y-1 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                      {d.modelCandidates.map((c) => (
                        <li key={c.model} className="flex items-center justify-between">
                          <span>{c.model}</span>
                          <span className="text-neutral-400">{(c.score * 100).toFixed(0)}%</span>
                        </li>
                      ))}
                      <li className="pt-2 text-[10px] leading-4 text-neutral-400">
                        Safari 不暴露设备型号，无法仅凭网页精确区分。想精确识别，可用 QQ 内置浏览器打开本站登录。
                      </li>
                    </ul>
                  )}
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
          );
        })}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
      </main>

      {correctingId && correctingDevice && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => { if (e.target === e.currentTarget && !correctSaving) setCorrectingId(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900">你用的是哪款设备？</h2>
            <p className="mt-1 text-xs text-neutral-500">你的确认会帮助改进识别准确率</p>
            <div className="mt-4 space-y-2">
              {correctingDevice.modelCandidates.map((c) => (
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
              <button type="button" onClick={() => submitCorrection(correctingId, correctInput)}
                disabled={correctSaving || !correctInput.trim()}
                className="h-11 flex-1 rounded-lg bg-neutral-900 text-base font-medium text-white disabled:opacity-50">
                {correctSaving ? "提交中…" : "提交"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => { if (e.target === e.currentTarget && !revokingId) setConfirmId(null); }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">⚠️</div>
            <h2 className="mt-4 text-center text-lg font-semibold text-neutral-900">撤销此设备？</h2>
            <p className="mt-2 text-center text-sm leading-6 text-neutral-500">
              撤销后该设备的登录记录将被清除。<br />下次登录时会重新记录。
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setConfirmId(null)} disabled={!!revokingId}
                className="h-11 flex-1 rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700 disabled:opacity-50">
                取消
              </button>
              <button type="button" onClick={() => confirmId && handleRevoke(confirmId)} disabled={!!revokingId}
                className="h-11 flex-1 rounded-lg bg-red-600 text-base font-medium text-white disabled:opacity-50">
                {revokingId ? "撤销中…" : "确认撤销"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
