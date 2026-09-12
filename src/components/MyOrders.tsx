import { useState } from "react";
import { getBase } from "../lib/url";

type OrderType = "sms" | "grab" | "card";

type Props = {
  onBack: () => void;
};

const TABS: { key: OrderType; label: string }[] = [
  { key: "sms", label: "接码订单" },
  { key: "grab", label: "抓号订单" },
  { key: "card", label: "卡券订单" },
];

export default function MyOrders({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<OrderType>("grab");

  function goBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.href = getBase() + "dashboard/";
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      {/* 顶部 */}
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center text-neutral-700"
            aria-label="返回"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-neutral-900">我的订单</h1>
        </div>

        {/* 三个分类 tab */}
        <div className="mx-auto max-w-2xl px-4">
          <div className="grid grid-cols-3 border-b border-neutral-100">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="relative flex flex-col items-center py-3"
                >
                  <span
                    className={
                      active
                        ? "text-sm font-medium text-neutral-900"
                        : "text-sm text-neutral-500"
                    }
                  >
                    {tab.label}
                  </span>
                  {active && (
                    <span className="absolute -bottom-px h-0.5 w-10 rounded-full bg-neutral-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        {activeTab === "sms" && <EmptyState text="暂无接码订单" />}
        {activeTab === "grab" && <EmptyState text="暂无抓号订单" />}
        {activeTab === "card" && <EmptyState text="暂无卡券订单" />}
      </main>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
        </svg>
      </div>
      <p className="mt-4 text-sm text-neutral-400">{text}</p>
    </div>
  );
}
