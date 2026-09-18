import { useTranslation } from "../i18n/useTranslation";
import { getBase } from "../lib/url";

export default function RegisterBrand() {
  const { t } = useTranslation();

  return (
    <header className="text-center">
      <a href={getBase()} className="inline-block">
        <img src="/q8-logo.svg" alt="Q8" className="mx-auto h-14 w-14 text-neutral-900" />
      </a>

      <h1 className="mt-3 text-lg font-semibold tracking-tight text-neutral-900">
        {t("login.site_name")}
      </h1>

      <h2 className="mt-4 text-xl font-semibold tracking-tight text-neutral-900">
        {t("register.create_account")}
      </h2>

      <p className="mt-1 text-xs text-neutral-500">
        {t("register.create_account_subtitle")}
      </p>
    </header>
  );
}
