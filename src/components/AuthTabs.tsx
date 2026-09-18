import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

type Tab = "login" | "register";

export default function AuthTabs({ initialTab = "login" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Tab 栏 */}
      <div className="flex border-b border-neutral-100">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
            tab === "login"
              ? "text-neutral-900"
              : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          登录
          {tab === "login" && (
            <span className="absolute inset-x-8 -bottom-px h-0.5 rounded-full bg-neutral-900" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("register")}
          className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
            tab === "register"
              ? "text-neutral-900"
              : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          注册
          {tab === "register" && (
            <span className="absolute inset-x-8 -bottom-px h-0.5 rounded-full bg-neutral-900" />
          )}
        </button>
      </div>

      {/* 内容区 */}
      <div className="p-5 sm:p-6">
        {tab === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}
