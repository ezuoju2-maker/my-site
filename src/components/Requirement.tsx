export function Requirement({
  valid,
  children,
}: {
  valid: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-1.5 ${
        valid ? "text-neutral-700" : "text-neutral-400"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center text-xs font-semibold ${
          valid ? "text-green-600" : "text-neutral-400"
        }`}
        aria-hidden="true"
      >
        {valid ? "✓" : "✕"}
      </span>

      <span className="truncate">{children}</span>
    </div>
  );
}
