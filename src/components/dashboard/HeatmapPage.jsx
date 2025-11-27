"use client";

import styles from "./ContentPage.module.css";

export default function HeatmapPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Heatmap View</h1>
        <p className={styles.description}>
          Visualize fuel station distribution patterns across regions with interactive heat mapping
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.placeholder}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p className={styles.placeholderText}>Heatmap Visualization</p>
          <p className={styles.placeholderSubtext}>
            Your interactive fuel station heatmap will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}
