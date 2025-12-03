import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Currency = "EUR" | "USD" | "PLN";
type Language = "fr" | "en" | "pl";

interface PreferencesContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    language: Language;
    setLanguage: (language: Language) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const { i18n } = useTranslation();

    // Initialize state from localStorage or defaults
    const [currency, setCurrencyState] = useState<Currency>(() => {
        return (localStorage.getItem("finoria_currency") as Currency) || "EUR";
    });

    const [language, setLanguageState] = useState<Language>(() => {
        return (localStorage.getItem("finoria_language") as Language) || "fr";
    });

    // Update localStorage and i18n when language changes
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("finoria_language", lang);
        i18n.changeLanguage(lang);
    };

    // Update localStorage when currency changes
    const setCurrency = (curr: Currency) => {
        setCurrencyState(curr);
        localStorage.setItem("finoria_currency", curr);
    };

    // Sync i18n with initial state
    useEffect(() => {
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);

    return (
        <PreferencesContext.Provider value={{ currency, setCurrency, language, setLanguage }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error("usePreferences must be used within a PreferencesProvider");
    }
    return context;
}
