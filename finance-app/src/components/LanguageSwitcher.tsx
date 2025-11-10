import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div className="lang-switch">
      {["fr", "en", "pl"].map((lng) => (
        <button
          key={lng}
          className={`chip ${i18n.language === lng ? "active" : ""}`}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
