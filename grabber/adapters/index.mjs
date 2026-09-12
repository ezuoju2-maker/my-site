/**
 * 平台适配器
 *
 * 每个适配器提供：
 *   - name          平台名
 *   - instructions  引导用户操作的步骤（数组）
 *   - buildCredential({ nickname, externalId, orderId })
 *                   生成提交给后端的凭证字符串
 *
 * 抓号层不抓 Cookie，只收集用户提供的账号信息。
 * 上号时通过官方 App 打开（见 grabber/README.md）。
 */

const xiaohongshu = {
  name: "小红书",
  instructions: [
    "打开手机上的「小红书」App",
    "点右下角「我」进入个人主页",
    "点顶部「编辑资料」可看到「小红书号」（形如 123456789）",
    "复制小红书号，并记下昵称",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return [
      "type=xiaohongshu",
      `id=${externalId}`,
      `nickname=${encodeURIComponent(nickname)}`,
      `order=${orderId.slice(0, 12)}`,
    ].join("&");
  },
};

const douyin = {
  name: "抖音",
  instructions: [
    "打开手机上的「抖音」App",
    "点右下角「我」进入个人主页",
    "点右上角三条杠 → 设置 → 账号与安全 → 抖音号",
    "复制抖音号（形如 xiaoming123），并记下昵称",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return [
      "type=douyin",
      `id=${externalId}`,
      `nickname=${encodeURIComponent(nickname)}`,
      `order=${orderId.slice(0, 12)}`,
    ].join("&");
  },
};

const bilibili = {
  name: "B站",
  instructions: [
    "打开「哔哩哔哩」App",
    "点右下角「我的」",
    "点右上角设置 → 账号资料",
    "复制 UID（形如 123456789），并记下昵称",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return [
      "type=bilibili",
      `id=${externalId}`,
      `nickname=${encodeURIComponent(nickname)}`,
      `order=${orderId.slice(0, 12)}`,
    ].join("&");
  },
};

const weibo = {
  name: "微博",
  instructions: [
    "打开手机上的「微博」App",
    "点右下角「我」进入个人主页",
    "点顶部「编辑资料」可看到「微博昵称」和账号 ID",
    "记下昵称和账号 ID",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return [
      "type=weibo",
      `id=${externalId}`,
      `nickname=${encodeURIComponent(nickname)}`,
      `order=${orderId.slice(0, 12)}`,
    ].join("&");
  },
};

const wechat = {
  name: "微信",
  instructions: [
    "打开「微信」App",
    "点右下角「我」进入个人主页",
    "点顶部头像进入个人信息页",
    "记下「微信号」（不是昵称）和「微信昵称」",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return [
      "type=wechat",
      `id=${externalId}`,
      `nickname=${encodeURIComponent(nickname)}`,
      `order=${orderId.slice(0, 12)}`,
    ].join("&");
  },
};

const qq = {
  name: "QQ",
  instructions: [
    "打开「QQ」App",
    "点左上角头像进入个人主页",
    "记下「QQ 号」和「QQ 昵称」",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return [
      "type=qq",
      `id=${externalId}`,
      `nickname=${encodeURIComponent(nickname)}`,
      `order=${orderId.slice(0, 12)}`,
    ].join("&");
  },
};

const discord = {
  name: "Discord",
  instructions: [
    "打开「Discord」客户端",
    "点左下角头像 → 设置 → 我的账号",
    "记下「用户名」（形如 xiaoming#1234）和「显示名」",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return [
      "type=discord",
      `id=${externalId}`,
      `nickname=${encodeURIComponent(nickname)}`,
      `order=${orderId.slice(0, 12)}`,
    ].join("&");
  },
};

const google = {
  name: "Google",
  instructions: [
    "打开浏览器访问 https://myaccount.google.com/",
    "查看「个人信息」→「基本信息」",
    "记下邮箱地址和姓名",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return [
      "type=google",
      `id=${externalId}`,
      `nickname=${encodeURIComponent(nickname)}`,
      `order=${orderId.slice(0, 12)}`,
    ].join("&");
  },
};

const zhihu = {
  name: "知乎",
  instructions: [
    "打开「知乎」App 或网页",
    "点右下角「我的」进入个人主页",
    "记下「知乎 ID」或昵称",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return ["type=zhihu", `id=${externalId}`, `nickname=${encodeURIComponent(nickname)}`, `order=${orderId.slice(0, 12)}`].join("&");
  },
};

const kuaishou = {
  name: "快手",
  instructions: [
    "打开「快手」App",
    "点左上角三条杠 → 头像进入个人主页",
    "记下「快手号」和昵称",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return ["type=kuaishou", `id=${externalId}`, `nickname=${encodeURIComponent(nickname)}`, `order=${orderId.slice(0, 12)}`].join("&");
  },
};

const taobao = {
  name: "淘宝",
  instructions: [
    "打开「淘宝」App",
    "点右下角「我的淘宝」",
    "点顶部头像进入个人资料，记下淘宝会员名",
  ],
  buildCredential({ nickname, externalId, orderId }) {
    return ["type=taobao", `id=${externalId}`, `nickname=${encodeURIComponent(nickname)}`, `order=${orderId.slice(0, 12)}`].join("&");
  },
};

const ADAPTERS = {
  xiaohongshu,
  douyin,
  bilibili,
  weibo,
  wechat,
  qq,
  discord,
  google,
  zhihu,
  kuaishou,
  taobao,
};

export function getAdapter(platformCode) {
  return ADAPTERS[platformCode] || null;
}

export function listAdapters() {
  return Object.entries(ADAPTERS).map(([code, a]) => ({ code, name: a.name }));
}
