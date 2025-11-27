"use client";

import Link from "next/link";
import styles from "./DashboardHome.module.css";

export default function DashboardHome() {
  const sections = [
    {
      title: "Heatmap",
      description: "Visualize fuel station distribution patterns across regions",
      icon: "📍",
      href: "/dashboard/heatmap",
      color: "gradient-red",
    },
    {
      title: "Graph",
      description: "Interactive graphs showing fuel station density and metrics",
      icon: "📊",
      href: "/dashboard/graph",
      color: "gradient-blue",
    },
    {
      title: "Chart",
      description: "Comprehensive charts and analytics of fuel station data",
      icon: "📈",
      href: "/dashboard/chart",
      color: "gradient-green",
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <h1 className={styles.title}>Cummins Fuel Station Analytics</h1>
        <p className={styles.subtitle}>
          Explore comprehensive fuel station data with interactive visualizations
        </p>
      </div>

      {/* Cards Grid */}
      <div className={styles.grid}>
        {sections.map((section) => (
          <Link key={section.title} href={section.href} className={styles.cardLink}>
            <div className={`${styles.card} ${styles[section.color]}`}>
              <div className={styles.cardIcon}>{section.icon}</div>
              <h2 className={styles.cardTitle}>{section.title}</h2>
              <p className={styles.cardDescription}>{section.description}</p>
              <div className={styles.cardFooter}>
                <span className={styles.arrowIcon}>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Section */}
      <div className={styles.statsSection}>
        <h2 className={styles.statsTitle}>Quick Stats</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>1,250+</div>
            <div className={styles.statLabel}>Fuel Stations</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>45</div>
            <div className={styles.statLabel}>Regions Covered</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>98%</div>
            <div className={styles.statLabel}>Uptime</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>Real-time</div>
            <div className={styles.statLabel}>Data Updates</div>
          </div>
        </div>
      </div>
    </div>
  );
}
