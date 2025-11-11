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

function QueryAuthController() {
  const { open, close } = useAuthModal();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useUser(); // devient non-null après sign-in

  const redirect = params.get("redirect") || "/dashboard";
  const auth = params.get("auth");

  React.useEffect(() => {
    if (auth === "open") open("signIn");
  }, [auth, open]);

  React.useEffect(() => {
    if (user) {
      close();
      navigate(redirect, { replace: true });
    }
  }, [user, redirect, navigate, close]);

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
        />
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
          <Root />
        </AuthRootProvider>
      </TooltipProviderWrapper>
    </BrowserRouter>
  </React.StrictMode>
);
