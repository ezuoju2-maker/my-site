/**
 * 各平台官方 App 的 URL Scheme
 *
 * 点击「进入账号」时，优先尝试打开官方 App。
 * 打开失败（App 未安装）则 fallback 到官方网页。
 */

export type SchemeEntry = {
  scheme: string;      // App Scheme，如 xiaohongshu://
  webFallback: string; // 未安装时打开的网页
  appName: string;
};

export const APP_SCHEMES: Record<string, SchemeEntry> = {
  xiaohongshu: {
    scheme: "xhsdiscover://",
    webFallback: "https://www.xiaohongshu.com",
    appName: "小红书",
  },
  douyin: {
    scheme: "snssdk1128://",
    webFallback: "https://www.douyin.com",
    appName: "抖音",
  },
  bilibili: {
    scheme: "bilibili://",
    webFallback: "https://www.bilibili.com",
    appName: "哔哩哔哩",
  },
  weibo: {
    scheme: "sinaweibo://",
    webFallback: "https://weibo.com",
    appName: "微博",
  },
  wechat: {
    scheme: "weixin://",
    webFallback: "https://weixin.qq.com",
    appName: "微信",
  },
  qq: {
    scheme: "mqq://",
    webFallback: "https://im.qq.com",
    appName: "QQ",
  },
  discord: {
    scheme: "discord://",
    webFallback: "https://discord.com/app",
    appName: "Discord",
  },
  google: {
    scheme: "googlegmail://",
    webFallback: "https://myaccount.google.com",
    appName: "Google",
  },
  zhihu: {
    scheme: "zhihu://",
    webFallback: "https://www.zhihu.com",
    appName: "知乎",
  },
  kuaishou: {
    scheme: "kwai://",
    webFallback: "https://www.kuaishou.com",
    appName: "快手",
  },
  taobao: {
    scheme: "taobao://",
    webFallback: "https://www.taobao.com",
    appName: "淘宝",
  },
};

/**
 * 尝试打开平台 App。
 * @returns Promise<boolean> - true 表示已跳转到 App，false 表示未安装
 */
export async function openPlatformApp(platformCode: string): Promise<boolean> {
  const entry = APP_SCHEMES[platformCode];
  if (!entry) return false;

  return new Promise<boolean>((resolve) => {
    let hidden = false;

    const onVisibility = () => {
      if (document.hidden) {
        hidden = true;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // 触发 scheme
    window.location.href = entry.scheme;

    // 1.5 秒后检查：如果页面变 hidden，说明跳转成功
    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", onVisibility);
      resolve(hidden);
    }, 1500);
  });
}

export function getSchemeEntry(platformCode: string): SchemeEntry | null {
  return APP_SCHEMES[platformCode] || null;
}
