import { useEffect, useRef } from "react";
import { CAP_WORKER_URL, CAP_API_ENDPOINT } from "../lib/cap-config";

type Props = {
  onSolve: (token: string) => void;
  onReset?: () => void;
};

// 全局：确保 cap.min.js 只加载一次
let capScriptLoading: Promise<void> | null = null;

function loadCapScript(): Promise<void> {
  // 已经定义过，直接返回
  if (customElements.get("cap-widget")) {
    return Promise.resolve();
  }

  // 已经在加载中，复用同一个 Promise
  if (capScriptLoading) {
    return capScriptLoading;
  }

  capScriptLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cap-script="true"]',
    );

    if (existing) {
      // 脚本标签已存在，等它 load 或等元素定义
      customElements
        .whenDefined("cap-widget")
        .then(() => resolve())
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = `${CAP_WORKER_URL}/cap.min.js`;
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let widget: HTMLElement | null = null;

    const handleSolve = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: string }>).detail;
      if (detail?.token) {
        onSolve(detail.token);
      }
    };

    const handleReset = () => {
      onReset?.();
    };

    loadCapScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        widget = document.createElement("cap-widget");
        widget.setAttribute("data-cap-api-endpoint", CAP_API_ENDPOINT);

        widget.addEventListener("solve", handleSolve);
        widget.addEventListener("reset", handleReset);

        containerRef.current.appendChild(widget);
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
  }, [onSolve, onReset]);

  return <div ref={containerRef} className="flex justify-center" />;
}
