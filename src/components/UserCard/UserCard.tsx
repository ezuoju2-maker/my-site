import { useState } from "react";
import { Copy, Check, ChevronRight, Eye, EyeOff } from "lucide-react";
import type { User } from "../../types/home";
import "./UserCard.css";

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="av-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef2f4" />
          <stop offset="100%" stopColor="#fce7ec" />
        </linearGradient>
        <linearGradient id="av-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde8d3" />
          <stop offset="100%" stopColor="#f5d2b4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#av-bg)" />
      <path d="M18 100 Q50 76 82 100 Z" fill="#1e293b" />
      <rect x="42" y="70" width="16" height="14" fill="url(#av-skin)" />
      <ellipse cx="50" cy="55" rx="20" ry="23" fill="url(#av-skin)" />
      <path d="M28 48 Q30 24 50 22 Q70 24 72 48 Q68 40 62 38 L58 46 L54 36 L48 44 L44 34 L36 42 L32 36 Q30 42 28 48 Z" fill="#1f2937" />
      <path d="M28 48 Q26 60 28 70 L34 68 Q33 58 34 50 Z" fill="#1f2937" />
      <path d="M72 48 Q74 60 72 70 L66 68 Q67 58 66 50 Z" fill="#1f2937" />
      <ellipse cx="43" cy="58" rx="2.8" ry="3.3" fill="#0f172a" />
      <ellipse cx="57" cy="58" rx="2.8" ry="3.3" fill="#0f172a" />
      <circle cx="44" cy="57" r="0.9" fill="#fff" />
      <circle cx="58" cy="57" r="0.9" fill="#fff" />
      <path d="M47 72 Q50 73.5 53 72" stroke="#b08060" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function UserCard({ user }: { user: User }) {
  const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(false);
  const shortId = user.id.slice(0, 8);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <section className="q8-user-card">
      <div className="q8-user-head">
        <div className="q8-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <DefaultAvatar />
          )}
        </div>

        <div className="q8-user-info">
          <div className="q8-user-name-row">
            <span className="q8-user-name">{user.displayName || user.username}</span>
            <span className="q8-vip">
              <svg viewBox="0 0 12 12" width="8" height="8" fill="#6b4a00" aria-hidden="true">
                <path d="M1 9 L1.5 3.5 L3.5 5.5 L5 1.5 L6.5 5.5 L8.5 3.5 L9 9 Z" />
              </svg>
              VIP {user.vipLevel}
            </span>
          </div>
          <button type="button" className="q8-user-id" onClick={copyId}>
            ID: {shortId}...
            {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
          </button>
        </div>

        <ChevronRight size={18} strokeWidth={1.8} className="q8-user-arrow" />
      </div>

      <div className="q8-wallet">
        <div className="q8-wallet-label">钱包余额</div>
        <div className="q8-wallet-amount">
          <span className="q8-wallet-num">
            {hidden ? "¥ ****" : `¥ ${user.balance.toFixed(2)}`}
          </span>
          <button
            type="button"
            className="q8-wallet-eye"
            aria-label={hidden ? "显示余额" : "隐藏余额"}
            onClick={() => setHidden((v) => !v)}
          >
            {hidden ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        </div>

        <div className="q8-wallet-actions">
          <button type="button" className="q8-action-btn">查看流水</button>
          <button type="button" className="q8-action-btn">提现</button>
          <button type="button" className="q8-action-btn accent">充值</button>
        </div>
      </div>
    </section>
  );
}
