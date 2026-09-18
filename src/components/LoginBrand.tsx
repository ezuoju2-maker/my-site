import { useEffect, useState } from "react";
import { useTranslation } from "../i18n/useTranslation";

export default function LoginBrand() {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <div className="mb-6 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm font-semibold tracking-wide text-neutral-700">
        LOGO
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
        {t("login.site_name")}
      </h1>

      <p className="mt-1 text-xs text-neutral-500">
        {t("login.welcome")}
      </p>
    </div>
  );
}
