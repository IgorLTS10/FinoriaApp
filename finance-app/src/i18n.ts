import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: { translation: { hello: "Bonjour", portfolio: "Mes investissements" } },
  en: { translation: { hello: "Hello", portfolio: "My investments" } },
  pl: { translation: { hello: "Cześć", portfolio: "Moje inwestycje" } },
};

i18n.use(initReactI18next).init({
  resources,
  // lng: "fr", // Removed to allow dynamic setting via PreferencesContext
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
