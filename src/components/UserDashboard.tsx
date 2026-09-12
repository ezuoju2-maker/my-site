import { API_BASE_URL } from "../lib/api";

// 功能卡片跳转 URL 映射（未映射的显示"开发中"）
const FEATURE_URLS: Record<string, string> = {
  "接码系统": "dashboard/services/sms/",
  "抓号系统": "dashboard/grab/",
  "上号系统": "dashboard/grab/use/",
};
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import { useEffect, useState } from "react";
import {
  FEATURES,
  TABS,
  SITE_NAME,
  ANNOUNCEMENT,
  type TabKey,
  type IconName,
} from "./dashboard-data";
import LanguagePicker from "./LanguagePicker";
import { DEFAULT_LANG, getLanguage } from "./languages";
import { setLanguage } from "../i18n/useTranslation";
import {
  IconBox,
  IconGlobe,
  IconBell,
  IconMenu,
  IconUser,
  IconMail,
  IconWallet,
  IconCreditCard,
  IconMegaphone,
  IconHome,
  IconClipboard,
  IconHeadphones,
  IconSmartphone,
  IconSend,
  IconCrosshair,
  IconMonitor,
  IconTicket,
  IconChevronRight,
  IconPlus,
  IconZap,
  IconShield,
  IconGem,
} from "./icons/dashboard-icons";

type UserInfo = {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
};

const FEATURE_ICONS: Record<IconName, React.FC<{ className?: string }>> = {
  smartphone: IconSmartphone,
  send: IconSend,
  crosshair: IconCrosshair,
  monitor: IconMonitor,
  ticket: IconTicket,
};

const TAB_ICONS: Record<TabKey, React.FC<{ className?: string }>> = {
  home: IconHome,
  orders: IconClipboard,
  support: IconHeadphones,
  me: IconUser,
};

const SUBTITLE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  globe: IconGlobe,
  zap: IconZap,
  shield: IconShield,
  gem: IconGem,
};

export default function UserDashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ok">("loading");
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [toast, setToast] = useState("");
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(DEFAULT_LANG);

  // 从 localStorage 读语言（首屏）
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lang");
      if (saved) setCurrentLang(saved);
    } catch {
      // localStorage 不可用时忽略
    }
  }, []);

  function handleLangSelect(code: string) {
    setCurrentLang(code);
    try {
      window.localStorage.setItem("lang", code);
    } catch {
      // localStorage 不可用时忽略
    }
    setLanguage(code);
    setToast(`已切换到 ${getLanguage(code).native}`);
    window.setTimeout(() => setToast(""), 2200);
  }
  const [loggingOut, setLoggingOut] = useState(false);

  // 未读通知数量。当前为 0，接入通知 API 后改为真实数据。
  // 红点仅在有未读通知时显示。
  const [notificationCount, setNotificationCount] = useState(0);
  const [balance, setBalance] = useState<number>(0);
  const [balanceLoaded, setBalanceLoaded] = useState(false);

  // 预留 setter，避免未使用警告（接入通知 API 时可直接调用）
  void setNotificationCount;

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (cancelled) return;

        if (!response.ok) {
          window.location.replace(getBase());
          return;
        }

        const data = await parseApiResponse(response);

        if (cancelled) return;

        if (!data.ok || !data.user) {
          window.location.replace(getBase());
          return;
        }

        setUser(data.user);
        setStatus("ok");
      } catch {
        if (!cancelled) {
          window.location.replace(getBase());
        }
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/user/balance`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json() as Promise<{ ok?: boolean; balance?: number }>)
      .then((d) => {
        if (cancelled) return;
        if (d.ok && typeof d.balance === "number") {
          setBalance(d.balance);
        }
        setBalanceLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setBalanceLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // 忽略登出网络错误
    }

    window.location.replace(getBase());
  }

  if (status === "loading" || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          <p className="mt-4 text-sm text-neutral-500">正在验证身份…</p>
        </div>
      </main>
    );
  }

  // 头像首字母：优先用昵称的首字，无昵称则用用户名首字
  // 英文自动大写，中文直接显示首个汉字
  const initial = (user.displayName || user.username)
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <IconBox className="h-6 w-6 text-neutral-900" />
            <span className="text-neutral-300">|</span>
            <span className="text-base font-semibold text-neutral-900">
              {SITE_NAME}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLangPickerOpen(true)}
              className="flex items-center gap-1 text-sm text-neutral-700"
            >
              <IconGlobe className="h-4 w-4" />
              <span>{getLanguage(currentLang).native}</span>
            </button>
            <button
              type="button"
              onClick={() => notify("消息中心开发中")}
              className="relative flex items-center justify-center text-neutral-700"
              aria-label="通知"
            >
              <IconBell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => notify("菜单开发中")}
              className="flex items-center justify-center text-neutral-700"
              aria-label="菜单"
            >
              <IconMenu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-3">
        {/* 用户信息卡 */}
        <button
          type="button"
          onClick={() => {
            window.location.href = `${getBase()}dashboard/profile/`;
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 text-left"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-lg font-semibold text-white">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="头像"
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-neutral-900">
              {user.displayName || user.username}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
              <IconMail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
          <IconChevronRight className="h-5 w-5 shrink-0 text-neutral-300" />
        </button>

        {/* 账户余额卡 */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <IconWallet className="h-6 w-6 shrink-0 text-neutral-900" />
              <div>
                <div className="text-base font-semibold text-neutral-900">
                  账户余额
                </div>
                <div className="mt-1 text-sm text-neutral-500">
                  当前余额：<span className="ml-1 font-medium text-neutral-900">¥{balanceLoaded ? balance.toFixed(3) : "—.———"}</span>
                </div>
              </div>
            </div>
            <IconCreditCard className="h-8 w-8 text-neutral-200" />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => notify("充值开发中")}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-base font-medium text-white"
            >
              <IconPlus className="h-4 w-4" />
              充值
            </button>
            <button
              type="button"
              onClick={() => notify("余额详情开发中")}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white text-base font-medium text-neutral-700"
            >
              查看详情
              <IconChevronRight className="h-4 w-4 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* 公告栏 */}
        <button
          type="button"
          onClick={() => notify("公告列表开发中")}
          className="flex w-full items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 text-left"
        >
          <IconMegaphone className="h-5 w-5 shrink-0 text-neutral-900" />
          <span className="shrink-0 text-base font-semibold text-neutral-900">
            公告
          </span>
          <span className="min-w-0 flex-1 truncate text-right text-sm text-neutral-500">
            {ANNOUNCEMENT}
          </span>
          <IconChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
        </button>

        {/* Tab 导航 */}
        <div className="rounded-2xl border border-neutral-100 bg-white py-2">
          <div className="grid grid-cols-4">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const TabIcon = TAB_ICONS[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === "orders") {
                      window.location.href = getBase() + "dashboard/orders/";
                    } else if (tab.key !== "home") {
                      notify(`${tab.label}开发中`);
                    }
                  }}
                  className="relative flex flex-col items-center gap-1.5 py-2"
                >
                  <TabIcon
                    className={
                      active
                        ? "h-6 w-6 text-neutral-900"
                        : "h-6 w-6 text-neutral-500"
                    }
                  />
                  <span
                    className={
                      active
                        ? "text-xs font-medium text-neutral-900"
                        : "text-xs text-neutral-500"
                    }
                  >
                    {tab.label}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-neutral-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 功能列表 */}
        <div className="space-y-3">
          {FEATURES.map((feature) => {
            const FeatureIcon = FEATURE_ICONS[feature.icon];
            const SubtitleIcon = SUBTITLE_ICONS[feature.subtitleIcon];
            return (
              <button
                key={feature.title}
                type="button"
                onClick={() => {
                  const target = FEATURE_URLS[feature.title];
                  if (target) {
                    window.location.href = `${getBase()}${target}`;
                  } else {
                    notify(`${feature.title}正在开发中`);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <FeatureIcon className="h-6 w-6 text-neutral-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-neutral-900">
                    {feature.title}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                    <SubtitleIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{feature.subtitle}</span>
                  </div>
                </div>
                <IconChevronRight className="h-5 w-5 shrink-0 text-neutral-300" />
              </button>
            );
          })}
        </div>

        {/* 退出 */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-600 disabled:opacity-50"
        >
          {loggingOut ? "退出中…" : "退出登录"}
        </button>
      </main>

      {/* 语言选择器 */}
      <LanguagePicker
        open={langPickerOpen}
        current={currentLang}
        onClose={() => setLangPickerOpen(false)}
        onSelect={handleLangSelect}
      />

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
