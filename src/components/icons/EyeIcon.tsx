export function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.8 4 10 8-.5 1.6-1.5 3-2.8 4.2" />
      <path d="M6.2 6.2C4.6 6.2 3.4 9 2 12c1.2 4 4.8 8 10 8 1.4 0 2.7-.3 3.8-.8" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
