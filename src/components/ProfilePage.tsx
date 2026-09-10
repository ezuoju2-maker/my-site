import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import { useEffect, useState } from "react";
import { IconChevronRight } from "./icons/dashboard-icons";

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<"loading" | "ok">("loading");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarForm, setShowAvatarForm] = useState(false);

  const [saving, setSaving] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
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

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function goBack() {
    window.location.href = `${getBase()}dashboard/`;
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
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  头像图片 URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  粘贴一个公开可访问的图片链接（.jpg / .png / .webp）
                </p>
              </div>

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
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              邮箱
            </label>
            <input
              type="text"
              value={profile.email}
              readOnly
              className="h-11 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-base text-neutral-500 outline-none"
            />
            <p className="mt-1 text-xs text-neutral-400">修改邮箱功能开发中</p>
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
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="当前密码"
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新密码（8-128 字符，含大小写、数字、特殊符号）"
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="确认新密码"
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
              />

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
