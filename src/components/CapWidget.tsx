import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../lib/api";

type Props = {
  onSolve: (token: string) => void;
  onReset?: () => void;
};

type State = "idle" | "verifying" | "done" | "error" | "blocked";

const POW_API = `${API_BASE_URL}/api/pow`;

export default function CapWidget({ onSolve, onReset }: Props) {
  const [state, setState] = useState<State>("idle");
  const [, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const behaviorScoreRef = useRef(0);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // 行为信号：统计页面级交互次数（mousemove / touchstart / keydown）
    // 不上报轨迹、坐标、时间，只上报"次数"这个数字。
    // 真人从打开页面到点验证框，必然产生至少 1 次交互。
    // 无头浏览器 / curl / 纯脚本 → 0 次。
    let count = 0;
    const bump = () => {
      count += 1;
      behaviorScoreRef.current = count;
    };
    window.addEventListener("mousemove", bump, { passive: true });
    window.addEventListener("touchstart", bump, { passive: true });
    window.addEventListener("keydown", bump);
    return () => {
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("touchstart", bump);
      window.removeEventListener("keydown", bump);
    };
  }, []);

  async function solve() {
    if (state === "verifying" || state === "done") return;
    setState("verifying");
    setProgress(0);
    setAttempts(0);

    try {
      const challengeRes = await fetch(`${POW_API}/challenge`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ behaviorScore: behaviorScoreRef.current }),
      });
      if (!challengeRes.ok) {
        // 429 = 后端临时封禁（POW_BLOCKED）或资源被保护（BUDGET_*）
        if (challengeRes.status === 429) {
          const errBody = (await challengeRes.json().catch(() => ({}))) as {
            error?: string;
          };
          if (errBody.error === "POW_BLOCKED") {
            setState("blocked");
            onReset?.();
            return;
          }
        }
        throw new Error("challenge failed");
      }
      const challenge = (await challengeRes.json()) as {
        challenge_id: string;
        salt: string;
        difficulty: number;
        expires_at: number;
        signature: string;
      };

      const worker = createPowWorker();
      workerRef.current = worker;

      const nonce = await new Promise<number>((resolve, reject) => {
        worker.onmessage = (e) => {
          const data = e.data as {
            nonce?: number;
            progress?: number;
            error?: string;
          };
          if (data.error) {
            reject(new Error(data.error));
            return;
          }
          if (typeof data.progress === "number") {
            setAttempts(data.progress);
            const maxAttempts = Math.pow(16, challenge.difficulty);
            setProgress(Math.min(95, Math.round((data.progress / maxAttempts) * 100)));
          }
          if (typeof data.nonce === "number") {
            resolve(data.nonce);
          }
        };
        worker.onerror = (e) => reject(new Error(e.message || "worker error"));
        worker.postMessage({
          salt: challenge.salt,
          difficulty: challenge.difficulty,
        });
      });

      worker.terminate();
      workerRef.current = null;

      const redeemRes = await fetch(`${POW_API}/redeem`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challenge.challenge_id,
          nonce,
          signature: challenge.signature,
        }),
      });
      const redeemData = (await redeemRes.json()) as {
        ok?: boolean;
        token?: string;
        error?: string;
      };
      if (!redeemRes.ok || !redeemData.ok || !redeemData.token) {
        throw new Error(redeemData.error || "redeem failed");
      }

      setState("done");
      setProgress(100);
      onSolve(redeemData.token);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[pow]", msg);
      setState("error");
      onReset?.();
    }
  }

  function reset() {
    setState("idle");
    setProgress(0);
    setAttempts(0);
    onReset?.();
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-md border border-neutral-200 bg-white px-4 py-3">
      <button
        type="button"
        onClick={state === "done" ? reset : solve}
        disabled={state === "verifying"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-neutral-300 bg-white disabled:cursor-wait"
        aria-label={state === "done" ? "reset" : "verify"}
      >
        {state === "done" && <span className="text-lg text-green-600">✓</span>}
        {state === "verifying" && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-500" />
        )}
        {state === "error" && <span className="text-lg text-red-500">×</span>}
        {state === "idle" && (
          <span className="h-3 w-3 rounded-full bg-neutral-200" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        {state === "idle" && (
          <span className="text-sm text-neutral-700">点击进行人机验证</span>
        )}
        {state === "verifying" && (
          <span className="text-sm text-neutral-700">
            验证中…{attempts > 0 ? ` (${attempts} 次尝试)` : ""}
          </span>
        )}
        {state === "done" && (
          <span className="text-sm text-green-700">已验证</span>
        )}
        {state === "error" && (
          <span className="text-sm text-red-600">验证失败，点击重试</span>
        )}
        {state === "blocked" && (
          <span className="text-sm text-amber-600">请求过于频繁，请稍后重试</span>
        )}
      </div>
    </div>
  );
}

function createPowWorker(): Worker {
  const code = `
    self.onmessage = async (event) => {
      const { salt, difficulty } = event.data;
      const target = "0".repeat(difficulty);
      const encoder = new TextEncoder();
      let nonce = 0;
      while (true) {
        const input = salt + ":" + nonce;
        const buf = encoder.encode(input);
        const hashBuf = await crypto.subtle.digest("SHA-256", buf);
        const bytes = new Uint8Array(hashBuf);
        let hex = "";
        for (let i = 0; i < bytes.length; i += 1) {
          hex += bytes[i].toString(16).padStart(2, "0");
        }
        if (hex.startsWith(target)) {
          self.postMessage({ nonce });
          break;
        }
        nonce += 1;
        if (nonce % 2048 === 0) {
          self.postMessage({ progress: nonce });
        }
        if (nonce > 5e7) {
          self.postMessage({ error: "too many attempts" });
          break;
        }
      }
    };
  `;
  const blob = new Blob([code], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}
