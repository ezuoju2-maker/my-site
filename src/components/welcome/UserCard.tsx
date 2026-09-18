import { IconChevronRight } from "./icons";

type Props = {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  };
};

export default function UserCard({ user }: Props) {
  const initial = (user.displayName || user.username).charAt(0).toUpperCase();
  const shortId = user.id.slice(0, 8);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/60 transition-all hover:ring-neutral-300/70"
         style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px -8px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-4 p-4">
        <div className="relative shrink-0">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 text-xl font-bold text-neutral-800 ring-2 ring-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)]">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[17px] font-bold tracking-tight text-neutral-900">
              {user.displayName || user.username}
            </span>
            {user.role === "admin" && (
              <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                ADMIN
              </span>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] tracking-wide text-neutral-400">
            ID · {shortId}
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50 text-neutral-400 transition-all group-hover:bg-neutral-100 group-hover:text-neutral-700">
          <IconChevronRight />
        </div>
      </div>
    </div>
  );
}
