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
 * 递归遍历 light DOM + shadow DOM 的所有文本节点。
 * Cap 组件用 Shadow DOM，必须递归进去才能改文本。
 */
function walkAllText(root: Node, callback: (textNode: Text) => void) {
  if (root.nodeType === Node.TEXT_NODE) {
    callback(root as Text);
    return;
  }
  if (
    root.nodeType !== Node.ELEMENT_NODE &&
    root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
  ) {
    return;
  }
  const el = root as Element;
  if (el.shadowRoot) {
    walkAllText(el.shadowRoot, callback);
  }
  const children = root.childNodes;
  for (let i = 0; i < children.length; i += 1) {
    walkAllText(children[i], callback);
  }
}

function translateCapWidget(root: Element, labels: Record<string, string>) {
  walkAllText(root, (textNode) => {
    const text = textNode.nodeValue ?? "";
    if (!text) return;
    for (const [key, value] of Object.entries(labels)) {
      if (!key) continue;
      if (text.includes(key)) {
        textNode.nodeValue = text.split(key).join(value);
        break;
      }
    }
  });
}

export default function CapWidget({ onSolve, onReset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSolveRef = useRef(onSolve);
  const onResetRef = useRef(onReset);
  onSolveRef.current = onSolve;
  onResetRef.current = onReset;

  const { t } = useTranslation();
  const labelsRef = useRef<Record<string, string>>({});
  labelsRef.current = {
    "Verify to continue": t("cap.verify"),
    Verified: t("cap.verified"),
    Verifying: t("cap.verifying"),
    "点击进行人机验证": t("cap.verify"),
    已验证: t("cap.verified"),
    验证中: t("cap.verifying"),
    "Cap-Worker": "",
  };

  // 挂载 widget（只跑一次）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let widget: HTMLElement | null = null;
    let observer: MutationObserver | null = null;
    let intervalId: number | null = null;

    const translate = () => {
      if (!widget) return;
      translateCapWidget(widget, labelsRef.current);
    };

    const handleSolve = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: string }>).detail;
      if (detail?.token) onSolveRef.current(detail.token);
      window.setTimeout(translate, 30);
      window.setTimeout(translate, 120);
    };
    const handleReset = () => {
      onResetRef.current?.();
      window.setTimeout(translate, 30);
      window.setTimeout(translate, 120);
    };

    loadCapScript()
      .then(() => {
        if (cancelled || !container) return;
        if (container.querySelector("cap-widget")) return;

        widget = document.createElement("cap-widget");
        widget.setAttribute("data-cap-api-endpoint", CAP_API_ENDPOINT);
        widget.addEventListener("solve", handleSolve);
        widget.addEventListener("reset", handleReset);
        container.appendChild(widget);

        // 立即翻译
        translate();
        window.setTimeout(translate, 50);
        window.setTimeout(translate, 200);

        // Observer：cap-widget + shadow root
        observer = new MutationObserver(translate);
        const targets: (Element | ShadowRoot)[] = [widget];
        if (widget.shadowRoot) targets.push(widget.shadowRoot);
        for (const target of targets) {
          observer.observe(target, {
            childList: true,
            subtree: true,
            characterData: true,
          });
        }

        // 兜底轮询：8 秒内每 400ms 一次
        let ticks = 0;
        intervalId = window.setInterval(() => {
          translate();
          ticks += 1;
          if (ticks >= 20) {
            if (intervalId !== null) window.clearInterval(intervalId);
            intervalId = null;
          }
        }, 400);
      })
      .catch((error) => {
        console.error("[CapWidget] failed to load cap.min.js", error);
      });

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (intervalId !== null) window.clearInterval(intervalId);
      if (widget) {
        widget.removeEventListener("solve", handleSolve);
        widget.removeEventListener("reset", handleReset);
        widget.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 语言变化时立即翻译（不重建 widget）
  useEffect(() => {
    const widget = containerRef.current?.querySelector(
      "cap-widget",
    ) as HTMLElement | null;
    if (widget) {
      translateCapWidget(widget, labelsRef.current);
    }
  }, [t]);

  return <div ref={containerRef} className="flex justify-center" />;
}
