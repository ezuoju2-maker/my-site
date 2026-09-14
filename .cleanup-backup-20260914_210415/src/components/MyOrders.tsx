import { getBase } from "../lib/url";

type Props = { onBack?: () => void };

export default function MyOrders({ onBack }: Props) {
  function goBack() {
    if (onBack) onBack();
    else window.location.href = getBase() + "dashboard/";
  }
  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button type="button" onClick={goBack} className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-neutral-900">我的订单</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" />
            </svg>
          </div>
          <p className="mt-4 text-sm text-neutral-400">暂无订单</p>
        </div>
      </main>
    </div>
  );
}
