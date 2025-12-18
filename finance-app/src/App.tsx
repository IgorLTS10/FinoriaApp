import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import { useUser } from "@stackframe/react";
import "./index.css";

export default function App() {
  const navigate = useNavigate();
  const user = useUser();

  // Auto-redirect to dashboard if user is logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    // petit helper pour scroll vers une section
    const handler = (e: any) => {
      if (e.detail?.targetId) {
        const el = document.getElementById(e.detail.targetId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("finoria:navigate", handler as EventListener);
    return () => window.removeEventListener("finoria:navigate", handler as EventListener);
  }, []);

  return (
    <div className="page">
      {/* décor de fond */}
      <div className="bg-warp" aria-hidden />
      <div className="bg-grid" aria-hidden />

      <Header />

      <main>
        <section id="home">
          <Hero />
        </section>

        <section id="features">
          <Features />
        </section>

        <section id="cta">
          <CTA />
        </section>
      </main>

      <Footer />
    </div>
  );
}
