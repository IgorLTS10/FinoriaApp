import { useTranslation } from "react-i18next";
import { useAuthModal } from "../state/authModal";
import { useUser } from "@stackframe/react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { i18n } = useTranslation();
  const { open } = useAuthModal();
  const user = useUser();
  const navigate = useNavigate();

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="header-glass">
      <div className="logo-mark">
        <span>💰</span>
        <span>Finoria</span>
      </div>

      <div className="header-actions">
        {/* Language switcher */}
        <div className="lang-switch">
          <button
            className={`chip ${i18n.language === "fr" ? "active" : ""}`}
            onClick={() => switchLang("fr")}
          >
            FR
          </button>
          <button
            className={`chip ${i18n.language === "en" ? "active" : ""}`}
            onClick={() => switchLang("en")}
          >
            EN
          </button>
        </div>

        {/* Auth buttons or Dashboard button */}
        {user ? (
          <button
            className="btn btn-primary small"
            onClick={() => navigate("/dashboard")}
          >
            Accéder au Dashboard
          </button>
        ) : (
          <>
            <button className="btn btn-ghost small" onClick={() => open("signIn")}>
              Se connecter
            </button>
            <button className="btn btn-primary small" onClick={() => open("signUp")}>
              S'inscrire
            </button>
          </>
        )}
      </div>
    </header>
  );
}
