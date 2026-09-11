/**
 * 通道配置
 *
 * 概念：
 *   - 通道 = 接码平台供应商（sms-activate / 5sim / sms-man ...）
 *   - 对用户只显示"通道一 / 通道二 / 通道三"
 *   - provider 字段仅内部使用，不渲染到界面
 *   - 管理员未来可在后台修改 displayName / markup / enabled 等
 *   - 供应商平台只能绑定微信 / 支付宝，不能绑定 USDT
 *
 * 加价规则：
 *   用户看到的价格 = 供应商报价 × markup
 *   markup = 1.0  不加价
 *   markup = 1.2  加 20%
 */

export type PaymentMethodId = "wechat" | "alipay" | "usdt";

export type SmsChannel = {
  id: string;
  provider: string;
  displayName: string;
  paymentMethods: PaymentMethodId[];
  successRate: number;
  markup: number;
  enabled: boolean;
};

export const CHANNELS: SmsChannel[] = [
  {
    id: "ch-1",
    provider: "sms-activate",
    displayName: "通道一",
    paymentMethods: ["wechat", "alipay"],
    successRate: 0.92,
    markup: 1.0,
    enabled: true,
  },
  {
    id: "ch-2",
    provider: "5sim",
    displayName: "通道二",
    paymentMethods: ["wechat", "alipay"],
    successRate: 0.87,
    markup: 1.15,
    enabled: true,
  },
  {
    id: "ch-3",
    provider: "sms-man",
    displayName: "通道三",
    paymentMethods: ["alipay"],
    successRate: 0.81,
    markup: 0.92,
    enabled: true,
  },
  {
    id: "ch-4",
    provider: "smspool",
    displayName: "通道四",
    paymentMethods: ["wechat"],
    successRate: 0.78,
    markup: 0.88,
    enabled: true,
  },
];

export function getChannelsForPayment(method: PaymentMethodId): SmsChannel[] {
  // USDT 不支持任何供应商通道（业务约束）
  if (method === "usdt") return [];
  return CHANNELS.filter(
    (c) => c.enabled && c.paymentMethods.includes(method),
  );
}

export function applyMarkup(basePrice: number, channel: SmsChannel): number {
  return Math.round(basePrice * channel.markup * 100) / 100;
}

// === 每个通道的库存：基于 (service, country, channelId) 确定性生成 ===
function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function prand(seed: string): number {
  return hashStr(seed) / 0xffffffff;
}

export function channelStock(
  serviceSlug: string,
  countryCode: string,
  channelId: string,
  baseStock: number,
): number {
  const ratio = 0.25 + prand(serviceSlug + ":" + countryCode + ":" + channelId) * 0.75;
  return Math.floor(baseStock * ratio);
}
