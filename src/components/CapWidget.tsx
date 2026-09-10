import { useEffect, useRef } from "react";
import { CAP_SCRIPT_URL, CAP_API_ENDPOINT } from "../lib/cap-config";
import { useTranslation } from "../i18n/useTranslation";

type Props = {
  onSolve: (token: string) => void;
  onReset?: () => void;
};

let capScriptLoading: Promise<void> | null = null;

function loadCapScript(): Promise<void> {
  if (customElements.get("cap-widget")) return Promise.resolve();
  if (capScriptLoading) return capScriptLoading;

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

/**
 * 把 cap-widget 内部的英文/中文替换为当前语言。
 * Cap 组件的 DOM 在外部 iframe/shadow DOM 外渲染，文本是普通节点。
 */
function translateCapWidget(root: HTMLElement, labels: Record<string, string>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    nodes.push(node as Text);
  }
  for (const textNode of nodes) {
    const text = textNode.nodeValue ?? "";
    for (const [key, value] of Object.entries(labels)) {
      if (text.includes(key)) {
        textNode.nodeValue = text.split(key).join(value);
        break;
      }
    }
  }
}

export default function CapWidget({ onSolve, onReset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSolveRef = useRef(onSolve);
  const onResetRef = useRef(onReset);
  onSolveRef.current = onSolve;
  onResetRef.current = onReset;

  const { t } = useTranslation();

  // 当前语言的 Cap 文案映射
  const labels: Record<string, string> = {
    "Verify to continue": t("cap.verify"),
    "Verified": t("cap.verified"),
    "Verifying": t("cap.verifying"),
    "点击进行人机验证": t("cap.verify"),
    "已验证": t("cap.verified"),
    "验证中": t("cap.verifying"),
    "Cap-Worker": "",
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let widget: HTMLElement | null = null;
    let observer: MutationObserver | null = null;

    const handleSolve = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: string }>).detail;
      if (detail?.token) onSolveRef.current(detail.token);
    };
    const handleReset = () => onResetRef.current?.();

    loadCapScript()
      .then(() => {
        if (cancelled || !container) return;
        if (container.querySelector("cap-widget")) return;

        widget = document.createElement("cap-widget");
        widget.setAttribute("data-cap-api-endpoint", CAP_API_ENDPOINT);
        widget.addEventListener("solve", handleSolve);
        widget.addEventListener("reset", handleReset);
        container.appendChild(widget);

        // 用 MutationObserver 监听文本变化，动态替换
        observer = new MutationObserver(() => {
          if (!widget) return;
          translateCapWidget(widget, labels);
        });
        observer.observe(widget, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        // 立即翻译一次（可能 Cap 已渲染）
        translateCapWidget(widget, labels);
      })
      .catch((error) => {
        console.error("[CapWidget] failed to load cap.min.js", error);
      });

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (widget) {
        widget.removeEventListener("solve", handleSolve);
        widget.removeEventListener("reset", handleReset);
        widget.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  return <div ref={containerRef} className="flex justify-center" />;
}
