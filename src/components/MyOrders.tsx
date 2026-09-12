import { useEffect, useState } from "react";
import { getBase } from "../lib/url";
import { API_BASE_URL } from "../lib/api";
import GrabOrders from "./GrabOrders";
import GrabOrderDetail from "./GrabOrderDetail";
import GrabAuthorizePage from "./GrabAuthorizePage";

type OrderType = "sms" | "grab" | "card";

type Props = {
  onBack?: () => void;
};

const TABS: { key: OrderType; label: string }[] = [
  { key: "sms", label: "接码订单" },
  { key: "grab", label: "抓号订单" },
  { key: "card", label: "卡券订单" },
];

export default function MyOrders({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<OrderType>("grab");
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [viewQrOrderId, setViewQrOrderId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{ token: string; platform: { code: string; name: string; brand: string } } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    if (!viewQrOrderId) return;
    setQrLoading(true);
    setQrError("");
    setQrData(null);
    fetch(`${API_BASE_URL}/api/grab/me/order-token?id=${encodeURIComponent(viewQrOrderId)}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json() as Promise<{ ok?: boolean; error?: string; token?: string; platform?: { code: string; name: string; brand: string } }>)
      .then((d) => {
        if (d.ok && d.token && d.platform) {
          setQrData({ token: d.token, platform: d.platform });
        } else {
          setQrError(
            d.error === "NOT_WAITING" ? "该订单已授权或已过期" :
            d.error === "TOKEN_MISSING" ? "二维码数据缺失" :
            d.error === "DECRYPT_FAILED" ? "二维码解密失败" :
            "加载失败",
          );
        }
      })
      .catch(() => setQrError("网络错误"))
      .finally(() => setQrLoading(false));
  }, [viewQrOrderId]);

  function goBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.href = getBase() + "dashboard/";
    }
  }

  if (viewQrOrderId) {
    if (qrLoading) {
      return (
        <div className="min-h-screen bg-neutral-50 pb-10">
          <div className="flex h-14 items-center justify-center border-b border-neutral-100 bg-white">
            <span className="text-base font-semibold text-neutral-900">加载中…</span>
          </div>
          <div className="py-20 text-center text-sm text-neutral-400">正在生成二维码…</div>
        </div>
      );
    }
    if (qrError || !qrData) {
      return (
        <div className="min-h-screen bg-neutral-50 pb-10">
          <div className="flex h-14 items-center justify-center border-b border-neutral-100 bg-white">
            <span className="text-base font-semibold text-neutral-900">二维码</span>
          </div>
          <div className="py-20 text-center text-sm text-red-500">{qrError || "加载失败"}</div>
          <div className="flex justify-center">
            <button type="button" onClick={() => { setViewQrOrderId(null); }}
              className="mt-4 rounded-xl border border-neutral-200 bg-white px-6 py-2 text-sm text-neutral-700">
              返回
            </button>
          </div>
        </div>
      );
    }
    return (
      <GrabAuthorizePage
        platform={qrData.platform}
        qrContent={API_BASE_URL + "/scan/" + qrData.token}
        qrToken={qrData.token}
        mode="order"
        onBack={() => setViewQrOrderId(null)}
        onBackToDetail={() => setViewQrOrderId(null)}
        onViewOrders={() => {}}
      />
    );
  }

  if (detailOrderId) {
    return (
      <GrabOrderDetail
        orderId={detailOrderId}
        onBack={() => setDetailOrderId(null)}
        onViewQr={(id) => setViewQrOrderId(id)}
      />
    );
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
        {activeTab === "grab" && (
          <GrabOrders embedded onViewDetail={(id) => setDetailOrderId(id)} />
        )}
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
