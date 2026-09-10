import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "./languages";

type Props = {
  open: boolean;
  current: string;
  onClose: () => void;
  onSelect: (code: string) => void;
};

const ITEM_HEIGHT = 44;
const VISIBLE = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE;
const PADDING = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

export default function LanguagePicker({
  open,
  current,
  onClose,
  onSelect,
}: Props) {
  const [tempIndex, setTempIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // open 时，把当前语言滚到中间
  useEffect(() => {
    if (!open) return;

    const idx = Math.max(
      0,
      LANGUAGES.findIndex((l) => l.code === current),
    );
    setTempIndex(idx);

    const scroller = scrollRef.current;
    if (scroller) {
      // 等 DOM 更新后滚动
      window.setTimeout(() => {
        scroller.scrollTop = idx * ITEM_HEIGHT;
      }, 0);
    }
  }, [open, current]);

  // 锁定 body 滚动
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function handleScroll() {
    const scroller = scrollRef.current;
    if (!scroller) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      const idx = Math.round(scroller.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(LANGUAGES.length - 1, idx));
      setTempIndex(clamped);
    }, 80);
  }

  function handleConfirm() {
    const lang = LANGUAGES[tempIndex];
    if (lang) onSelect(lang.code);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 底部面板 */}
      <div className="relative z-10 rounded-t-2xl bg-white pb-6 pt-3">
        {/* 顶栏 */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 text-sm text-neutral-500"
          >
            取消
          </button>
          <h3 className="text-base font-medium text-neutral-900">
            选择语言
          </h3>
          <button
            type="button"
            onClick={handleConfirm}
            className="py-2 text-sm font-medium text-neutral-900"
          >
            完成
          </button>
        </div>

        {/* 滚轮选择器 */}
        <div
          className="relative mt-3"
          style={{ height: `${CONTAINER_HEIGHT}px` }}
        >
          {/* 中央高亮条 */}
          <div
            className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-lg bg-neutral-100"
            style={{ height: `${ITEM_HEIGHT}px` }}
          />

          {/* 顶部/底部渐变 */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10"
            style={{
              height: `${PADDING}px`,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,1) 30%, rgba(255,255,255,0))",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
            style={{
              height: `${PADDING}px`,
              background:
                "linear-gradient(to top, rgba(255,255,255,1) 30%, rgba(255,255,255,0))",
            }}
          />

          {/* 滚动区 */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-scroll"
            style={{
              scrollSnapType: "y mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingTop: `${PADDING}px`,
              paddingBottom: `${PADDING}px`,
            }}
          >
            {LANGUAGES.map((lang, index) => {
              const active = index === tempIndex;
              return (
                <div
                  key={lang.code}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    scrollSnapAlign: "center",
                  }}
                  className="flex items-center justify-center"
                >
                  <span
                    className={
                      active
                        ? "text-lg font-medium text-neutral-900"
                        : "text-base text-neutral-400"
                    }
                  >
                    {lang.native}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
