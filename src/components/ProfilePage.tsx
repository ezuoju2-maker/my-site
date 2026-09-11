import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { IconChevronRight } from "./icons/dashboard-icons";
import { EyeIcon } from "./icons/EyeIcon";
import { ClearIcon } from "./icons/ClearIcon";
import CapWidget from "./CapWidget";

type Profile = {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  createdAt: string;
};

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const MAX = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          }
        } else {
          if (height > MAX) {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("image load failed"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<"loading" | "ok">("loading");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarForm, setShowAvatarForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailFormError, setEmailFormError] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [capKey, setCapKey] = useState(0);

  const [saving, setSaving] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
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

        const p = (data as unknown as { profile?: Profile }).profile;
        if (!p) {
          window.location.replace(getBase());
          return;
        }

        setProfile(p);
        setDisplayName(p.displayName || "");
        setBio(p.bio || "");
        setAvatarUrl(p.avatarUrl || "");
        setStatus("ok");
      } catch {
        if (!cancelled) {
          window.location.replace(getBase());
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setEmailCooldown((v) => (v <= 1 ? 0 : v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [emailCooldown]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function goBack() {
    window.location.href = `${getBase()}dashboard/`;
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("请选择图片文件");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify("图片过大（最多 5MB）");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const dataUrl = await compressImage(file);
      setAvatarUrl(dataUrl);
      notify("图片已就绪，请点右上角保存");
    } catch {
      notify("图片处理失败");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSendEmailCode() {
    setEmailFormError("");
    setCaptchaError("");

    if (!newEmail.trim()) {
      setEmailFormError("请输入新邮箱");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setEmailFormError("邮箱格式不正确");
      return;
    }
    if (!captchaToken) {
      setCaptchaError("请先完成人机验证");
      return;
    }
    if (emailCooldown > 0 || emailSending) return;

    setEmailSending(true);
    setEmailCooldown(60);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/email/send-code`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newEmail: newEmail.trim(),
            captchaToken,
          }),
        },
      );
      const data = await parseApiResponse(response);

      if (!response.ok || !data.ok) {
        const err = (data as unknown as { error?: string }).error;
        setEmailFormError(
          err === "EMAIL_ALREADY_USED"
            ? "该邮箱已被使用"
            : err === "TOO_MANY_REQUESTS"
              ? "请求过于频繁，请稍后重试"
              : err === "EMAIL_SERVICE_NOT_CONFIGURED"
                ? "邮箱服务未配置"
                : err === "EMAIL_PROVIDER_ERROR" || err === "EMAIL_PROVIDER_UNREACHABLE"
                  ? "验证码发送失败，请稍后重试"
                  : err === "INVALID_EMAIL"
                    ? "邮箱格式不正确"
                    : "验证码发送失败",
        );
        setEmailCooldown(0);
        return;
      }

      notify("验证码已发送，请检查新邮箱");
    } catch {
      setEmailFormError("网络错误，请重试");
      setEmailCooldown(0);
    } finally {
      setEmailSending(false);
      setCaptchaToken("");
      setCapKey((k) => k + 1);
    }
  }

  async function handleChangeEmail() {
    setEmailFormError("");

    if (!newEmail.trim()) {
      setEmailFormError("请输入新邮箱");
      return;
    }
    if (!/^\d{6}$/.test(emailCode.trim())) {
      setEmailFormError("请输入 6 位验证码");
      return;
    }

    if (emailSubmitting) return;
    setEmailSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/email/change`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newEmail: newEmail.trim(),
            emailCode: emailCode.trim(),
          }),
        },
      );
      const data = await parseApiResponse(response);

      if (!response.ok || !data.ok) {
        const err = (data as unknown as { error?: string }).error;
        const attemptsRemaining = (data as unknown as { attemptsRemaining?: number })
          .attemptsRemaining;
        setEmailFormError(
          err === "EMAIL_ALREADY_USED"
            ? "该邮箱已被使用"
            : err === "EMAIL_CODE_EXPIRED"
              ? "验证码已过期，请重新获取"
              : err === "INVALID_EMAIL_CODE"
                ? attemptsRemaining
                  ? `验证码错误，还可尝试 ${attemptsRemaining} 次`
                  : "验证码错误"
                : err === "EMAIL_CODE_TOO_MANY_ATTEMPTS"
                  ? "错误次数过多，请重新获取验证码"
                  : "修改失败，请稍后重试",
        );
        return;
      }

      // 成功后关闭表单 + 刷新 profile
      setShowEmailForm(false);
      setNewEmail("");
      setEmailCode("");
      notify("邮箱修改成功");

      const reload = await fetch(`${API_BASE_URL}/api/user/profile`, {
        credentials: "include",
        cache: "no-store",
      });
      const fresh = await parseApiResponse(reload);
      const p = (fresh as unknown as { profile?: Profile }).profile;
      if (p) {
        setProfile(p);
        setDisplayName(p.displayName || "");
        setBio(p.bio || "");
        setAvatarUrl(p.avatarUrl || "");
      }
    } catch {
      setEmailFormError("网络错误，请重试");
    } finally {
      setEmailSubmitting(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.ok) {
        const err = (data as unknown as { error?: string }).error;
        notify(
          err === "DISPLAY_NAME_TOO_LONG"
            ? "昵称过长（最多 30 字符）"
            : err === "BIO_TOO_LONG"
              ? "简介过长（最多 200 字符）"
              : "保存失败，请稍后重试",
        );
        return;
      }

      notify("已保存");
    } catch {
      notify("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("请填写所有字段");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError("新密码长度必须为 8-128 字符");
      return;
    }

    if (changingPassword) return;
    setChangingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.ok) {
        const err = (data as unknown as { error?: string }).error;
        setPasswordError(
          err === "INVALID_OLD_PASSWORD"
            ? "当前密码不正确"
            : err === "INVALID_NEW_PASSWORD"
              ? "新密码不符合要求（需含大小写、数字、特殊符号）"
              : err === "SAME_AS_OLD"
                ? "新密码不能与当前密码相同"
                : "修改失败，请稍后重试",
        );
        return;
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);

      const relogin = (data as unknown as { relogin?: boolean }).relogin === true;

      if (relogin) {
        notify("密码修改成功，正在跳转重新登录…");
        document.cookie = "session=; Path=/; Max-Age=0; Secure; SameSite=Lax";
        window.setTimeout(() => {
          window.location.href = getBase();
        }, 1200);
        return;
      }

      notify("密码修改成功");
    } catch {
      setPasswordError("网络错误，请重试");
    } finally {
      setChangingPassword(false);
    }
  }

  if (status === "loading" || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          <p className="mt-4 text-sm text-neutral-500">正在加载…</p>
        </div>
      </main>
    );
  }

  const roleLabel = profile.role === "admin" ? "管理员" : "普通用户";

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button
            type="button"
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center text-neutral-700"
            aria-label="返回"
          >
            <span className="text-xl leading-none">←</span>
          </button>
          <h1 className="text-base font-semibold text-neutral-900">个人资料</h1>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-3">
        {/* 头像 */}
        <section className="rounded-2xl border border-neutral-100 bg-white p-6">
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-3xl font-semibold text-white">
              {avatarUrl.trim() ? (
                <img
                  src={avatarUrl.trim()}
                  alt="头像"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                (displayName || profile.username).charAt(0).toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowAvatarForm((v) => !v)}
              className="mt-3 text-sm font-medium text-neutral-700"
            >
              更换头像
            </button>
          </div>

          {showAvatarForm && (
            <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 disabled:opacity-50"
              >
                {uploading ? "处理中…" : "从相册选择图片"}
              </button>

              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-neutral-100" />
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-neutral-400">
                    或粘贴图片链接
                  </span>
                </div>
              </div>

              <input
                type="url"
                value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl("");
                    setShowAvatarForm(false);
                  }}
                  className="h-11 flex-1 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700"
                >
                  清空头像
                </button>
                <button
                  type="button"
                  onClick={() => setShowAvatarForm(false)}
                  className="h-11 flex-1 rounded-xl bg-neutral-900 text-sm font-medium text-white"
                >
                  完成
                </button>
              </div>

              <p className="text-xs text-neutral-400">
                提示：修改后需要点右上角"保存"才会生效
              </p>
            </div>
          )}
        </section>

        {/* 基本信息 */}
        <section className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              昵称
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="请输入昵称"
              maxLength={30}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
            />
            <p className="mt-1 text-xs text-neutral-400">最多 30 字符</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              用户名
            </label>
            <input
              type="text"
              value={profile.username}
              readOnly
              className="h-11 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-base text-neutral-500 outline-none"
            />
            <p className="mt-1 text-xs text-neutral-400">用户名用于登录，不可修改</p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-700">
                邮箱
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm((v) => !v);
                  setEmailFormError("");
                }}
                className="text-sm font-medium text-neutral-900"
              >
                {showEmailForm ? "取消" : "修改邮箱"}
              </button>
            </div>
            <input
              type="text"
              value={profile.email}
              readOnly
              className="h-11 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-base text-neutral-500 outline-none"
            />

            {showEmailForm && (
              <div className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    新邮箱
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setEmailFormError("");
                    }}
                    placeholder="new@example.com"
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    验证码
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={emailCode}
                      onChange={(e) => {
                        setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setEmailFormError("");
                      }}
                      placeholder="6 位验证码"
                      className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400 h-11"
                    />
                    <button
                      type="button"
                      onClick={handleSendEmailCode}
                      disabled={emailSending || emailCooldown > 0}
                      className="h-11 shrink-0 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {emailSending
                        ? "发送中…"
                        : emailCooldown > 0
                          ? `${emailCooldown}s`
                          : "获取验证码"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    人机验证
                  </label>
                  <div className="flex min-h-[78px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-2 py-2">
                    <CapWidget
                      key={capKey}
                      onSolve={(token) => {
                        setCaptchaToken(token);
                        setCaptchaError("");
                      }}
                      onReset={() => setCaptchaToken("")}
                    />
                  </div>
                  {captchaError && (
                    <p className="mt-1.5 text-sm text-red-500">{captchaError}</p>
                  )}
                </div>

                {emailFormError && (
                  <p className="text-sm text-red-500">{emailFormError}</p>
                )}

                <button
                  type="button"
                  onClick={handleChangeEmail}
                  disabled={emailSubmitting}
                  className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-medium text-white disabled:opacity-50"
                >
                  {emailSubmitting ? "修改中…" : "确认修改"}
                </button>

                <p className="text-xs text-neutral-400">
                  验证码将发送到新邮箱，用于确认您拥有该邮箱
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              简介
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="介绍一下自己（可选）"
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-3 text-base outline-none focus:border-neutral-400"
            />
            <p className="mt-1 text-xs text-neutral-400">
              {bio.length} / 200
            </p>
          </div>
        </section>

        {/* 修改密码 */}
        <section className="rounded-2xl border border-neutral-100 bg-white">
          <button
            type="button"
            onClick={() => setShowPasswordForm((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-base font-medium text-neutral-900">
              修改密码
            </span>
            <IconChevronRight className="h-5 w-5 text-neutral-300" />
          </button>

          {showPasswordForm && (
            <div className="space-y-3 border-t border-neutral-100 p-4">
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="当前密码"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 pr-20 text-base outline-none focus:border-neutral-400"
                />
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
                  <button
                    type="button"
                    onClick={() => setOldPassword("")}
                    disabled={!oldPassword}
                    className={`flex h-9 w-9 items-center justify-center ${
                      oldPassword ? "text-neutral-500" : "pointer-events-none text-transparent"
                    }`}
                    aria-label="清空当前密码"
                  >
                    <ClearIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOldPassword((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center text-neutral-500"
                    aria-label={showOldPassword ? "隐藏密码" : "显示密码"}
                  >
                    <EyeIcon hidden={!showOldPassword} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="新密码（8-128 字符，含大小写、数字、特殊符号）"
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 pr-20 text-base outline-none focus:border-neutral-400"
                />
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
                  <button
                    type="button"
                    onClick={() => setNewPassword("")}
                    disabled={!newPassword}
                    className={`flex h-9 w-9 items-center justify-center ${
                      newPassword ? "text-neutral-500" : "pointer-events-none text-transparent"
                    }`}
                    aria-label="清空新密码"
                  >
                    <ClearIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center text-neutral-500"
                    aria-label={showNewPassword ? "隐藏密码" : "显示密码"}
                  >
                    <EyeIcon hidden={!showNewPassword} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="确认新密码"
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 pr-20 text-base outline-none focus:border-neutral-400"
                />
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
                  <button
                    type="button"
                    onClick={() => setConfirmPassword("")}
                    disabled={!confirmPassword}
                    className={`flex h-9 w-9 items-center justify-center ${
                      confirmPassword ? "text-neutral-500" : "pointer-events-none text-transparent"
                    }`}
                    aria-label="清空确认密码"
                  >
                    <ClearIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center text-neutral-500"
                    aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
                  >
                    <EyeIcon hidden={!showConfirmPassword} />
                  </button>
                </div>
              </div>

              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-medium text-white disabled:opacity-50"
              >
                {changingPassword ? "修改中…" : "确认修改"}
              </button>
            </div>
          )}
        </section>

        {/* 账户信息 */}
        <section className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">账户类型</span>
            <span className="text-sm text-neutral-900">{roleLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">注册时间</span>
            <span className="text-sm text-neutral-900">
              {profile.createdAt || "—"}
            </span>
          </div>
        </section>
      </main>

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
