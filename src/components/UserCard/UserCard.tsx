import { useState } from "react";
import { Copy, Check, ChevronRight, Eye, EyeOff } from "lucide-react";
import type { User } from "../../types/home";
import "./UserCard.css";

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="av-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>
        <linearGradient id="av-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="av-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde8d3" />
          <stop offset="100%" stopColor="#f5d2b4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#av-bg)" />
      <path d="M18 100 Q50 76 82 100 Z" fill="#1e293b" />
      <path d="M42 90 L50 100 L58 90 L54 86 L50 92 L46 86 Z" fill="#0f172a" />
      <rect x="42" y="70" width="16" height="14" fill="url(#av-skin)" />
      <ellipse cx="50" cy="55" rx="20" ry="23" fill="url(#av-skin)" />
      <path d="M28 48 Q30 24 50 22 Q70 24 72 48 Q68 40 62 38 L58 46 L54 36 L48 44 L44 34 L36 42 L32 36 Q30 42 28 48 Z" fill="url(#av-hair)" />
      <path d="M28 48 Q26 60 28 70 L34 68 Q33 58 34 50 Z" fill="url(#av-hair)" />
      <path d="M72 48 Q74 60 72 70 L66 68 Q67 58 66 50 Z" fill="url(#av-hair)" />
      <path d="M40 52 Q44 50 47 52" stroke="#1f2937" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M53 52 Q56 50 60 52" stroke="#1f2937" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <ellipse cx="43" cy="58" rx="3" ry="3.5" fill="#0f172a" />
      <ellipse cx="57" cy="58" rx="3" ry="3.5" fill="#0f172a" />
      <circle cx="44" cy="57" r="1" fill="#fff" />
      <circle cx="58" cy="57" r="1" fill="#fff" />
      <path d="M46 72 Q50 74 54 72" stroke="#b08060" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Crown() {
  return (
    <svg viewBox="0 0 140 110" aria-hidden="true">
      <defs>
        <linearGradient id="cr-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="50%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="cr-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#d4a24a" />
          <stop offset="100%" stopColor="#8a5f1f" />
        </linearGradient>
        <linearGradient id="cr-gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <path
        d="M14 82 L18 34 L36 52 L52 16 L70 52 L88 20 L104 52 L122 34 L126 82 Z"
        fill="url(#cr-body)"
        stroke="url(#cr-line)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <rect x="14" y="82" width="112" height="14" rx="4" fill="url(#cr-body)" stroke="url(#cr-line)" strokeWidth="2.2" />
      <line x1="18" y1="89" x2="122" y2="89" stroke="url(#cr-line)" strokeWidth="1" opacity="0.7" />
      <circle cx="18" cy="34" r="4" fill="url(#cr-gem)" stroke="url(#cr-line)" strokeWidth="1" />
      <circle cx="52" cy="16" r="4" fill="url(#cr-gem)" stroke="url(#cr-line)" strokeWidth="1" />
      <circle cx="88" cy="20" r="4" fill="url(#cr-gem)" stroke="url(#cr-line)" strokeWidth="1" />
      <circle cx="122" cy="34" r="4" fill="url(#cr-gem)" stroke="url(#cr-line)" strokeWidth="1" />
      <circle cx="70" cy="52" r="3.5" fill="#3b82f6" stroke="url(#cr-line)" strokeWidth="1" />
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
      <div className="q8-crown"><Crown /></div>

      <div className="q8-user-top">
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
              <svg viewBox="0 0 12 12" width="9" height="9" fill="#8a682b" aria-hidden="true">
                <path d="M1 9 L1.5 3.5 L3.5 5.5 L5 1.5 L6.5 5.5 L8.5 3.5 L9 9 Z" />
              </svg>
              VIP {user.vipLevel}
            </span>
          </div>

          <button type="button" className="q8-user-id" onClick={copyId}>
            ID: {shortId}...
            {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
          </button>
        </div>

        <ChevronRight size={18} strokeWidth={2} className="q8-user-arrow" />
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
            {hidden ? <EyeOff size={20} strokeWidth={1.8} /> : <Eye size={20} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      <div className="q8-wallet-actions">
        <button type="button" className="q8-action-btn q8-tap">查看流水</button>
        <button type="button" className="q8-action-btn q8-tap">提现</button>
        <button type="button" className="q8-action-btn q8-tap gold">充值</button>
      </div>
    </section>
  );
}
