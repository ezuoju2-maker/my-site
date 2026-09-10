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
