import styles from "./Dashboard.module.css";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import { Outlet } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className={styles.shell}>
      <Sidebar />

      <div className={styles.main}>
        <Topbar />

        <div className={styles.content}>
          {/* 🔥 Ici s’affiche la page enfant */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
