import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@stackframe/react";

/**
 * Page de callback OAuth pour Google/GitHub
 * Stack Auth redirige ici après l'authentification
 */
export default function OAuthCallback() {
    const navigate = useNavigate();
    const user = useUser();

    useEffect(() => {
        // Attendre que l'utilisateur soit chargé
        if (user) {
            // Rediriger vers le dashboard après connexion réussie
            navigate("/dashboard", { replace: true });
        }
    }, [user, navigate]);

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "1rem"
        }}>
            <div className="spinner" style={{
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
            }} />
            <p>Connexion en cours...</p>
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
