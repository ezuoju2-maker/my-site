import { useEffect, useState } from "react";

type Risk = {
  score: number;
  level: "low" | "medium" | "high";
  isNewDevice: boolean;
  reasons: string[];
};

export default function LoginRiskBanner() {
  const [risk, setRisk] = useState<Risk | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("login_risk");
    if (!raw) return;
    try {
      const r = JSON.parse(raw) as Risk;
      if (r.level === "low") {
        sessionStorage.removeItem("login_risk");
        return;
      }
      setRisk(r);
    } catch {}
  }, []);

  if (!risk || dismissed) return null;

  const isHigh = risk.level === "high";
  const bg = isHigh ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200";
  const textCls = isHigh ? "text-red-800" : "text-amber-800";
  const iconBg = isHigh ? "bg-red-100" : "bg-amber-100";
  const iconText = isHigh ? "text-red-600" : "text-amber-600";

  function dismiss() {
    setDismissed(true);
    sessionStorage.removeItem("login_risk");
  }

  return (
    <div className={`mb-4 rounded-xl border ${bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconText} text-xl`}>
          {isHigh ? "\u{1F6A8}" : "\u26A0\uFE0F"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold ${textCls}`}>
            {isHigh ? "本次登录存在高风险" : "检测到新的登录环境"}
          </h3>
          <ul className={`mt-2 space-y-1 text-xs ${textCls}`}>
            {risk.reasons.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
          <p className={`mt-2 text-xs ${textCls} opacity-80`}>
            如果这不是你本人的操作，请立即处理：
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/settings/devices/"
              className={`rounded-lg ${isHigh ? "bg-red-600" : "bg-amber-600"} px-3 py-1.5 text-xs font-medium text-white`}
            >
              查看登录设备
            </a>
            <a
              href="/forgot-password/"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
            >
              修改密码
            </a>
            <button
              type="button"
              onClick={dismiss}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${textCls} underline-offset-2 hover:underline`}
            >
              是我本人
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
