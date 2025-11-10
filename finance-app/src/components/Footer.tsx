export default function Footer() {
  return (
    <footer className="footer">
      <div>© {new Date().getFullYear()} Finoria. Tous droits réservés.</div>
      <div className="footer-links">
        <a href="#features">Fonctionnalités</a>
        <a href="#portfolio">Portefeuille</a>
        <a href="#cta">Commencer</a>
      </div>
    </footer>
  );
}
