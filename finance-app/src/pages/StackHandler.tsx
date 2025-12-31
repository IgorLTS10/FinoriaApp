import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Page handler pour Stack Auth
 * Gère les flux comme forgot-password, email-verification, etc.
 */
export default function StackHandler() {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Récupérer le type de handler depuis l'URL
        const type = searchParams.get("type");
        const code = searchParams.get("code");

        console.log("Stack Handler - Type:", type, "Code:", code);

        // Pour l'instant, rediriger vers la page d'accueil
        // Stack Auth devrait gérer le flux automatiquement
        if (type === "forgot-password") {
            // Afficher un message ou rediriger
            console.log("Forgot password flow");
        }
    }, [searchParams]);

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
            <div className="spinner" style={{
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
            }} />
            <h2>Traitement en cours...</h2>
            <p style={{ color: "#666", maxWidth: "400px" }}>
                Veuillez patienter pendant que nous traitons votre demande.
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
