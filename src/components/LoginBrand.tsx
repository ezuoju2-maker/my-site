import { useEffect, useState } from "react";

export default function LoginBrand() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm font-semibold tracking-wide text-neutral-700">
        LOGO
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        网站名称
      </h1>

      <p className="mt-2 text-sm text-neutral-500">
        欢迎回来，请登录
      </p>
    </div>
  );
}
