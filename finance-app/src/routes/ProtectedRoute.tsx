// src/routes/ProtectedRoute.tsx
import { type ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@stackframe/react"; // ✅ hook dispo côté React

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useUser(); // null si non connecté
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (user === null) {
      navigate(`/?auth=open&redirect=${encodeURIComponent(loc.pathname)}`, { replace: true });
    }
  }, [user, loc.pathname, navigate]);

  if (user === null) return null; // ou un petit loader
  return <>{children}</>;
}
