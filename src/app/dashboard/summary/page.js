"use client";

import React from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Reusable Placeholder component with highly visible styling
const Placeholder = ({ label }) => (
  <div style={{
    backgroundColor: '#f1f5f9', // Light grey background
    border: '2px dashed #3b82f6', // Highly visible blue dashed border
    borderRadius: '8px',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#475569',
    fontWeight: '600',
    fontSize: '0.875rem',
    padding: '8px',
    boxSizing: 'border-box'
  }}>
    {label}
  </div>
);

export default function SummaryPage() {
  
  // Reusable inline styles to keep the JSX clean
  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: '80px', // Large gap between CNG and Electric sections
      padding: '24px',
      maxWidth: '2000px',
      margin: '0 auto',
    },
    section: {
      // Force each section to be exactly the height of the screen minus the header
      height: 'calc(100vh - 100px)', 
      minHeight: '800px', // Prevent it from getting too small
      display: 'flex',
      flexDirection: 'column',
    },
    sectionHeader: {
      marginBottom: '20px',
      paddingBottom: '10px',
      borderBottom: '2px solid #e2e8f0',
      flexShrink: 0,
    },
    quadrantGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr', // 2 Columns
      gridTemplateRows: '1fr 1fr',    // 2 Rows
      gap: '24px',
      flexGrow: 1, // Fills remaining space in the section
      minHeight: 0,
    },
    quadrant: {
      background: 'white',
      border: '3px solid #94a3b8', // THICK visible border for the quadrant outline
      borderRadius: '16px',
      padding: '16px',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
    },
    innerGrid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      width: '100%',
      height: '100%',
    },
    innerGrid4: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      width: '100%',
      height: '100%',
    },
    innerGrid5: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '12px',
      width: '100%',
      height: '100%',
    }
  };

  return (
    <DashboardLayout>
      <div style={styles.wrapper}>
        
        {/* ========================================== */}
        {/* SECTION 1: CNG SUMMARY                     */}
        {/* ========================================== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              CNG Summary
            </h1>
          </div>
          
          <div style={styles.quadrantGrid}>
            {/* Top Left: 1 Big Placeholder */}
            <div style={styles.quadrant}>
              <Placeholder label="Map Placeholder (Top Left)" />
            </div>

            {/* Top Right: 1 Big Placeholder */}
            <div style={styles.quadrant}>
              <Placeholder label="Powertrain Predictions Chart (Top Right)" />
            </div>

            {/* Bottom Left: 3 Equal Placeholders */}
            <div style={styles.quadrant}>
              <div style={styles.innerGrid3}>
                <Placeholder label="Chart 1" />
                <Placeholder label="Chart 2" />
                <Placeholder label="Chart 3" />
              </div>
            </div>

            {/* Bottom Right: 5 Equal Placeholders */}
            <div style={styles.quadrant}>
              <div style={styles.innerGrid5}>
                <Placeholder label="Chart 1" />
                <Placeholder label="Chart 2" />
                <Placeholder label="Chart 3" />
                <Placeholder label="Chart 4" />
                <Placeholder label="Chart 5" />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* SECTION 2: ELECTRIC SUMMARY                */}
        {/* ========================================== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Electric Summary
            </h1>
          </div>
          
          <div style={styles.quadrantGrid}>
            {/* Top Left: 1 Big Placeholder */}
            <div style={styles.quadrant}>
              <Placeholder label="Map Placeholder (Top Left)" />
            </div>

            {/* Top Right: 1 Big Placeholder */}
            <div style={styles.quadrant}>
              <Placeholder label="Powertrain Predictions Chart (Top Right)" />
            </div>

            {/* Bottom Left: 4 Equal Placeholders (Difference from CNG) */}
            <div style={styles.quadrant}>
              <div style={styles.innerGrid4}>
                <Placeholder label="Chart 1" />
                <Placeholder label="Chart 2" />
                <Placeholder label="Chart 3" />
                <Placeholder label="Chart 4" />
              </div>
            </div>

            {/* Bottom Right: 5 Equal Placeholders */}
            <div style={styles.quadrant}>
              <div style={styles.innerGrid5}>
                <Placeholder label="Chart 1" />
                <Placeholder label="Chart 2" />
                <Placeholder label="Chart 3" />
                <Placeholder label="Chart 4" />
                <Placeholder label="Chart 5" />
              </div>
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}