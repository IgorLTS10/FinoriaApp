// src/pages/Dashboard/Dashboard.tsx
import styles from "./Dashboard.module.css";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";

export default function Dashboard() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <h1 className={styles.h1}>Mon dashboard</h1>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Solde total</div>
              <div className={styles.cardBig}>€ 12 450</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Dépenses du mois</div>
              <div className={styles.cardBig}>€ 2 130</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Revenus du mois</div>
              <div className={styles.cardBig}>€ 3 000</div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Derniers mouvements</div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Catégorie</th>
                    <th>Libellé</th>
                    <th>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>10/11</td><td>Courses</td><td>Carrefour</td><td>-€ 42,70</td>
                  </tr>
                  <tr>
                    <td>09/11</td><td>Logement</td><td>Loyer</td><td>-€ 850,00</td>
                  </tr>
                  <tr>
                    <td>08/11</td><td>Salaire</td><td>Entreprise</td><td>+€ 1 900,00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
