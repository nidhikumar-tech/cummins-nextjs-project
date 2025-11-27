"use client";

import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.dashboardContainer}>
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  );
}
