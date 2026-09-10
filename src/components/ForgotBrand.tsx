import { useTranslation } from "../i18n/useTranslation";

export default function ForgotBrand() {
  const { t } = useTranslation();

  return (
    <div className="mb-8 text-center">
      <h1 className="text-2xl font-semibold">{t("forgot.title")}</h1>
      <p className="mt-2 text-sm opacity-70">{t("forgot.subtitle")}</p>
    </div>
  );
}
