import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "modern-normalize/modern-normalize.css";
import "./i18n";
import App from "./App";
import AuthRootProvider from "./auth/StackProvider";
import AuthModal from "./components/auth/AuthModal";
import { useAuthModal } from "./state/authModal";
import TooltipProviderWrapper from "./auth/TooltipProviderWrapper";

function Root() {
  const { mode, close } = useAuthModal();
  return (
    <>
      <App />
      <AuthModal mode={mode} onClose={close} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 🧩 notre TooltipProvider custom */}
      <TooltipProviderWrapper>
        <AuthRootProvider>
          <Root />
        </AuthRootProvider>
      </TooltipProviderWrapper>
    </BrowserRouter>
  </React.StrictMode>
);
