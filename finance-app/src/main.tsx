// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import "./index.css";
import "modern-normalize/modern-normalize.css";
import "./i18n";
import App from "./App";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import AuthRootProvider from "./auth/StackProvider";
import AuthModal from "./components/auth/AuthModal";
import { useAuthModal } from "./state/authModal";
import TooltipProviderWrapper from "./auth/TooltipProviderWrapper";
import { useUser } from "@stackframe/react"; // ✅
import Metaux from "./pages/Dashboard/Metaux/Metaux";
import Roadmap from "./pages/Dashboard/Roadmap/Roadmap";
import Crypto from "./pages/Dashboard/Crypto/Crypto"
import Actions from "./pages/Dashboard/Actions/Actions"
import Crowdfunding from "./pages/Dashboard/Crowdfunding/Crowdfunding"
import Settings from "./pages/Dashboard/Settings/Settings";
import { PreferencesProvider } from "./state/PreferencesContext";

function QueryAuthController() {
  const { open, close } = useAuthModal();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useUser();

  const redirect = params.get("redirect");
  const auth = params.get("auth");

  // Ouvre le modal si ?auth=open
  React.useEffect(() => {
    if (auth === "open") open("signIn");
  }, [auth, open]);

  // Si on a un redirect et que user est loggé → on redirige une fois
  React.useEffect(() => {
    if (user && redirect) {
      close();
      navigate(redirect, { replace: true });

      // on enlève redirect de l'url pour ne PAS retrigger
      params.delete("redirect");
      params.delete("auth");
      setParams(params);
    }
  }, [user, redirect, navigate, close, params, setParams]);

  return null;
}


function Root() {
  const { mode, close } = useAuthModal();
  return (
    <>
      <Routes>
        <Route path="/" element={<App />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<div>Bienvenue sur votre dashboard</div>} />
          <Route path="metaux" element={<Metaux />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="crypto" element={<Crypto />} />
          <Route path="actions" element={<Actions />} />
          <Route path="crowdfunding" element={<Crowdfunding />} />
          <Route path="parametres" element={<Settings />} />
        </Route>
      </Routes>

      <QueryAuthController />
      <AuthModal mode={mode} onClose={close} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TooltipProviderWrapper>
        <AuthRootProvider>
          <PreferencesProvider>
            <Root />
          </PreferencesProvider>
        </AuthRootProvider>
      </TooltipProviderWrapper>
    </BrowserRouter>
  </React.StrictMode>
);
