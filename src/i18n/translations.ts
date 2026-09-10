/**
 * 全站文案翻译表。
 *
 * 结构：
 *   translations[langCode][translationKey] = "翻译后的文字"
 *
 * 键命名规则：
 *   - 页面/组件前缀，点号分隔，如 "login.title"
 *   - 通用文案用 "common.xxx"
 *   - 后端错误码用 "error.CODE"
 *
 * 语言完整性：
 *   - zh / en 完整翻译（本文件维护）
 *   - 其他语言未翻译时，useTranslation 会回退到 en
 *   - 未来要完整支持某语言，只需在此文件加一个 xx: {} 块
 */

export const translations: Record<string, Record<string, string>> = {
  zh: {
    // ============ 通用 ============
    "common.loading": "加载中…",
    "common.save": "保存",
    "common.saving": "保存中…",
    "common.cancel": "取消",
    "common.confirm": "确认",
    "common.confirming": "处理中…",
    "common.done": "完成",
    "common.back": "返回",
    "common.ok": "好",
    "common.copy": "复制",
    "common.copied": "已复制",
    "common.network_error": "网络连接失败，请检查网络后重试",
    "common.unknown_error": "操作失败，请稍后重试",
    "common.developing": "开发中",
    "common.no_data": "暂无数据",

    // ============ 登录 ============
    "login.title": "登录",
    "login.welcome": "欢迎回来，请登录",
    "login.site_name": "网站名称",
    "login.identifier": "用户名 / 邮箱",
    "login.identifier_placeholder": "请输入用户名或邮箱",
    "login.identifier_required": "请输入用户名或邮箱",
    "login.identifier_clear": "清除用户名或邮箱",
    "login.password": "密码",
    "login.password_placeholder": "请输入密码",
    "login.password_required": "请输入密码",
    "login.password_clear": "清除密码",
    "login.password_show": "显示密码",
    "login.password_hide": "隐藏密码",
    "login.captcha": "人机验证",
    "login.captcha_required": "请完成人机验证",
    "login.remember": "记住登录",
    "login.forgot": "忘记密码？",
    "login.submit": "登录",
    "login.submitting": "登录中…",
    "login.no_account": "还没有账号？",
    "login.register": "注册",

    // ============ 登录错误 ============
    "login.error.INVALID_CREDENTIALS": "用户名或密码错误",
    "login.error.CAPTCHA_FAILED": "人机验证失败，请重试",
    "login.error.FORBIDDEN_ORIGIN": "请求来源不被允许",
    "login.error.INVALID_REQUEST": "请求格式错误，请重新提交",
    "login.error.UNAUTHENTICATED": "登录状态已失效，请重新登录",
    "login.error.SESSION_SERVICE_NOT_CONFIGURED": "登录服务暂时不可用，请稍后重试",
    "login.error.INTERNAL_ERROR": "服务器内部错误，请稍后重试",
    "login.error.DEFAULT": "登录失败，请稍后重试",
  },

  en: {
    // ============ Common ============
    "common.loading": "Loading…",
    "common.save": "Save",
    "common.saving": "Saving…",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.confirming": "Processing…",
    "common.done": "Done",
    "common.back": "Back",
    "common.ok": "OK",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.network_error": "Network error, please check and retry",
    "common.unknown_error": "Operation failed, please try again",
    "common.developing": "In development",
    "common.no_data": "No data",

    // ============ Login ============
    "login.title": "Sign In",
    "login.welcome": "Welcome back, please sign in",
    "login.site_name": "Site Name",
    "login.identifier": "Username / Email",
    "login.identifier_placeholder": "Enter username or email",
    "login.identifier_required": "Please enter username or email",
    "login.identifier_clear": "Clear",
    "login.password": "Password",
    "login.password_placeholder": "Enter password",
    "login.password_required": "Please enter password",
    "login.password_clear": "Clear password",
    "login.password_show": "Show password",
    "login.password_hide": "Hide password",
    "login.captcha": "Verification",
    "login.captcha_required": "Please complete verification",
    "login.remember": "Remember me",
    "login.forgot": "Forgot password?",
    "login.submit": "Sign In",
    "login.submitting": "Signing in…",
    "login.no_account": "Don't have an account?",
    "login.register": "Sign up",

    // ============ Login errors ============
    "login.error.INVALID_CREDENTIALS": "Incorrect username or password",
    "login.error.CAPTCHA_FAILED": "Verification failed, please retry",
    "login.error.FORBIDDEN_ORIGIN": "Request origin not allowed",
    "login.error.INVALID_REQUEST": "Invalid request format",
    "login.error.UNAUTHENTICATED": "Session expired, please sign in again",
    "login.error.SESSION_SERVICE_NOT_CONFIGURED": "Login service temporarily unavailable",
    "login.error.INTERNAL_ERROR": "Internal server error, please retry",
    "login.error.DEFAULT": "Login failed, please try again",
  },
};
