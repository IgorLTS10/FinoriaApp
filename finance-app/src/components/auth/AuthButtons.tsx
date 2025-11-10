import { useUser } from "@stackframe/react";
import { useAuthModal } from "../../state/authModal";

// --- helpers sûrs ---
type WithAddress = { address: string };

function hasAddress(v: unknown): v is WithAddress {
  return !!v && typeof v === "object" && "address" in (v as any) && typeof (v as any).address === "string";
}

export default function AuthButtons() {
  const user = useUser();
  const { open } = useAuthModal();

  if (!user) {
    return (
      <div className="auth-btns">
        <button className="btn btn-ghost small" onClick={() => open("signIn")}>Se connecter</button>
        <button className="btn btn-primary small" onClick={() => open("signUp")}>S’inscrire</button>
      </div>
    );
  }

  // — Récupère un email robuste (string | objet | array)
  const pe = (user as any).primaryEmail;
  let email: string | null = null;

  if (typeof pe === "string") {
    email = pe;
  } else if (hasAddress(pe)) {
    email = pe.address;
  } else if (Array.isArray((user as any).emails) && hasAddress((user as any).emails[0])) {
    email = (user as any).emails[0].address;
  } else if (typeof (user as any).email === "string") {
    email = (user as any).email;
  }

  const display = user.displayName ?? email ?? "toi";

  return (
    <div className="auth-btns">
      <span style={{ opacity: 0.8, marginRight: 8 }}>Bonjour, {display}</span>
      <button className="btn btn-ghost small" onClick={() => user.signOut()}>
        Se déconnecter
      </button>
    </div>
  );
}
