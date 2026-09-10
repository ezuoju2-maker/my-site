import { useEffect, useRef } from "react";
import { CAP_SCRIPT_URL, CAP_API_ENDPOINT } from "../lib/cap-config";

type Props = {
  onSolve: (token: string) => void;
  onReset?: () => void;
};

let capScriptLoading: Promise<void> | null = null;

function loadCapScript(): Promise<void> {
  if (customElements.get("cap-widget")) {
    return Promise.resolve();
  }

  if (capScriptLoading) {
    return capScriptLoading;
  }

  capScriptLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cap-script="true"]',
    );

    if (existing) {
      customElements
        .whenDefined("cap-widget")
        .then(() => resolve())
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = CAP_SCRIPT_URL;
    script.async = true;
    script.setAttribute("data-cap-script", "true");

    script.onload = () => {
      customElements
        .whenDefined("cap-widget")
        .then(() => resolve())
        .catch(reject);
    };

    script.onerror = () => {
      capScriptLoading = null;
      reject(new Error("Failed to load cap.min.js"));
    };

    document.head.appendChild(script);
  });

  return capScriptLoading;
}

export default function CapWidget({ onSolve, onReset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 用 ref 存储最新回调，避免 useEffect 依赖变化
  const onSolveRef = useRef(onSolve);
  const onResetRef = useRef(onReset);
  onSolveRef.current = onSolve;
  onResetRef.current = onReset;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let widget: HTMLElement | null = null;

    const handleSolve = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: string }>).detail;
      if (detail?.token) {
        onSolveRef.current(detail.token);
      }
    };

    const handleReset = () => {
      onResetRef.current?.();
    };

    loadCapScript()
      .then(() => {
        if (cancelled || !container) return;

        // 防止重复插入
        if (container.querySelector("cap-widget")) return;

        widget = document.createElement("cap-widget");
        widget.setAttribute("data-cap-api-endpoint", CAP_API_ENDPOINT);

        widget.addEventListener("solve", handleSolve);
        widget.addEventListener("reset", handleReset);

        container.appendChild(widget);
      })
      .catch((error) => {
        console.error("[CapWidget] failed to load cap.min.js", error);
      });

    return () => {
      cancelled = true;
      if (widget) {
        widget.removeEventListener("solve", handleSolve);
        widget.removeEventListener("reset", handleReset);
        widget.remove();
      }
    };
  }, []); // 空依赖：只跑一次

  return <div ref={containerRef} className="flex justify-center" />;
}
