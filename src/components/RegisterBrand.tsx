import { useTranslation } from "../i18n/useTranslation";
import { getBase } from "../lib/url";

export default function RegisterBrand() {
  const { t } = useTranslation();

  return (
    <header className="text-center">
      <a href={getBase()} className="inline-block">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm font-semibold tracking-wide text-neutral-700">
          LOGO
        </div>
      </a>

      <h1 className="mt-5 text-xl font-semibold tracking-tight text-neutral-900">
        {t("login.site_name")}
      </h1>

      <h2 className="mt-8 text-2xl font-semibold tracking-tight text-neutral-900">
        {t("register.create_account")}
      </h2>

      <p className="mt-2 text-sm text-neutral-500">
        {t("register.create_account_subtitle")}
      </p>
    </header>
  );
}
