import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@stackframe/react";

/**
 * Page de callback OAuth pour Google/GitHub
 * Stack Auth redirige ici après l'authentification
 */
export default function OAuthCallback() {
    const navigate = useNavigate();
    const user = useUser();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [hasRedirected, setHasRedirected] = useState(false);

    useEffect(() => {
        // Log pour debugging
        console.log("OAuth Callback - User:", user);
        console.log("OAuth Callback - Params:", {
            code: searchParams.get("code"),
            state: searchParams.get("state"),
            error: searchParams.get("error")
        });

        // Vérifier si il y a une erreur dans les paramètres OAuth
        const oauthError = searchParams.get("error");
        if (oauthError) {
            setError(`Erreur OAuth: ${oauthError}`);
            return;
        }

        // Si l'utilisateur est connecté, rediriger vers le dashboard
        if (user && !hasRedirected) {
            console.log("OAuth Callback - Redirecting to dashboard");
            setHasRedirected(true);
            navigate("/dashboard", { replace: true });
        }
    }, [user, navigate, searchParams, hasRedirected]);

    // Timeout après 10 secondes si pas de redirection
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!user && !error) {
                console.error("OAuth Callback - Timeout: Authentication took too long");
                setError("La connexion prend trop de temps. Veuillez réessayer.");
            }
        }, 10000);

        return () => clearTimeout(timeout);
    }, [user, error]);

    if (error) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                flexDirection: "column",
                gap: "1rem",
                padding: "2rem",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "3rem" }}>❌</div>
                <h2 style={{ color: "#e74c3c", margin: 0 }}>Erreur de connexion</h2>
                <p style={{ color: "#666", maxWidth: "400px" }}>{error}</p>
                <button
                    onClick={() => navigate("/", { replace: true })}
                    style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#3498db",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "500"
                    }}
                >
                    Retour à l'accueil
                </button>
            </div>
        );
    }

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
            <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Veuillez patienter pendant que nous finalisons votre connexion
            </p>
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
