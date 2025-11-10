import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import PortfolioPreview from "./components/PortfolioPreview";
import Features from "./components/Features";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Dock from "./components/Dock";
import "./index.css";

export default function App() {
  useEffect(() => {
    // petit helper pour scroll vers une section depuis le dock
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

        <section id="stats">
          <Stats />
        </section>

        <section id="portfolio">
          <PortfolioPreview />
        </section>

        <section id="features">
          <Features />
        </section>

        <section id="cta">
          <CTA />
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        <Dock />
      </AnimatePresence>
    </div>
  );
}
