import { useEffect, useRef, useState } from "react";

type Status = "idle" | "success" | "error";

type Props = {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  status?: Status;
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function VerifyCodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  status = "idle",
  disabled = false,
  autoFocus = true,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    if (autoFocus && refs.current[0]) {
      refs.current[0]?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length && onComplete) onComplete(value);
  }, [value, length, onComplete]);

  function getBoxClass(idx: number): string {
    const base = "h-13 w-11 rounded-lg border bg-white text-center text-xl font-semibold outline-none transition-colors sm:h-14 sm:w-12 sm:text-2xl";
    if (status === "success") return `${base} border-green-500 bg-green-50 text-green-700`;
    if (status === "error") return `${base} border-red-500 bg-red-50 text-red-700`;
    if (focusIdx === idx) return `${base} border-neutral-900 ring-2 ring-neutral-200`;
    return `${base} border-neutral-300 focus:border-neutral-500`;
  }

  function handleChange(idx: number, raw: string) {
    if (disabled) return;
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      const next = value.split("");
      next[idx] = "";
      onChange(next.join("").slice(0, length));
      return;
    }

    if (digits.length > 1) {
      const next = (value.slice(0, idx) + digits + value.slice(idx + digits.length)).slice(0, length);
      onChange(next);
      const targetIdx = Math.min(idx + digits.length, length - 1);
      refs.current[targetIdx]?.focus();
      return;
    }

    const next = value.split("");
    next[idx] = digits;
    const s = next.join("").slice(0, length);
    onChange(s);
    if (idx < length - 1) {
      refs.current[idx + 1]?.focus();
      setFocusIdx(idx + 1);
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "Backspace") {
      if (value[idx]) {
        const next = value.split("");
        next[idx] = "";
        onChange(next.join(""));
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
        setFocusIdx(idx - 1);
      }
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
      setFocusIdx(idx - 1);
    }
    if (e.key === "ArrowRight" && idx < length - 1) {
      refs.current[idx + 1]?.focus();
      setFocusIdx(idx + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    if (disabled) return;
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusIdx(i)}
          className={getBoxClass(i)}
          style={{ height: "52px" }}
        />
      ))}
    </div>
  );
}
