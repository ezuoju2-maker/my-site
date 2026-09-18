import type { ReactNode } from "react";
import { formatTime, maskEmail } from "./utils";

type Device = {
  deviceId: string;
  deviceModel: string | null;
  osName: string | null;
  osVersion: string | null;
  browserName: string | null;
  lastLoginAt: string | null;
  location: string | null;
  ipAddress: string | null;
};

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt?: string;
};

export function OverviewPanel({ user, devices, joinedDays }: { user: User; devices: Device[]; joinedDays: number | null }) {
  return (
    <div>
      <PanelHeader icon="🔥" title="账号概览" />
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat label="邮箱" value={maskEmail(user.email)} />
        <Stat label="注册" value={joinedDays ? `${joinedDays} 天` : "未知"} />
        <Stat label="角色" value={user.role === "admin" ? "管理员" : "普通用户"} />
        <Stat label="设备" value={`${devices.length} 台`} />
      </div>
    </div>
  );
}

export function DevicesPanel({ devices }: { devices: Device[] }) {
  if (devices.length === 0) {
    return (
      <div>
        <PanelHeader icon="📱" title="登录设备" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-3xl">📱</div>
          <p className="mt-3 text-sm text-neutral-500">暂无登录设备</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <PanelHeader icon="📱" title="登录设备" />
      <div className="mt-3 space-y-2">
        {devices.slice(0, 5).map((d) => (
          <div key={d.deviceId} className="rounded-lg border border-neutral-100 p-3">
            <div className="text-sm font-medium text-neutral-900">{d.deviceModel || "未知设备"}</div>
            <div className="mt-1 text-[11px] text-neutral-500">
              {d.osName || "?"} · {d.browserName || "?"} · {d.location || "未知"}
            </div>
          </div>
        ))}
      </div>
      <a href="/settings/devices/" className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700">
        查看更多
      </a>
    </div>
  );
}

export function SecurityPanel() {
  const items = [
    { label: "修改密码", desc: "定期更换，保护账号安全", href: "/forgot-password/", icon: "🔒" },
    { label: "退出所有设备", desc: "撤销全部信任设备", href: "/settings/devices/", icon: "🚪" },
  ];
  return (
    <div>
      <PanelHeader icon="🔒" title="安全设置" />
      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <a key={it.label} href={it.href} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 hover:border-neutral-300">
            <span className="text-lg">{it.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-neutral-900">{it.label}</div>
              <div className="text-[11px] text-neutral-500">{it.desc}</div>
            </div>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

export function PasskeyPanel() {
  return (
    <div>
      <PanelHeader icon="🔑" title="Passkey" />
      <p className="mt-3 text-xs text-neutral-500">使用面容 / 指纹登录，无需输入密码</p>
      <a href="/passkey/recover/" className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-neutral-900 text-xs font-medium text-white">
        添加 Passkey
      </a>
    </div>
  );
}

export function HistoryPanel({ devices }: { devices: Device[] }) {
  return (
    <div>
      <PanelHeader icon="📋" title="最近记录" />
      <div className="mt-3 space-y-2">
        {devices.slice(0, 5).map((d) => (
          <div key={d.deviceId} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3">
            <span className="text-base">🔹</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-neutral-900">{d.deviceModel || "未知"}</div>
              <div className="text-[11px] text-neutral-500">{formatTime(d.lastLoginAt)}</div>
            </div>
          </div>
        ))}
        {devices.length === 0 && <p className="text-xs text-neutral-500">暂无记录</p>}
      </div>
    </div>
  );
}

function PanelHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-bold text-neutral-900">{title}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2">
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-neutral-900">{value}</div>
    </div>
  );
}
