"use client";

// [CHANGE 1] Imported useState to track the active view
import React, { useState } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CNGSummaryMap from "@/components/maps/CNGSummaryMap";
import ElectricSummaryMap from "@/components/maps/ElectricSummaryMap";
import dynamic from 'next/dynamic';
import EnergyInsightsAgent from "@/components/predictions/EnergyInsightsAgent";

// Reusable Placeholder component 
const Placeholder = ({ label }) => (
  <div style={{
    backgroundColor: '#f1f5f9',
    border: '2px dashed #3b82f6',
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

// Dynamically import the MinMax Charts
const MinMaxChartCNG = dynamic(() => import('@/components/predictions/MinMaxChartCNG'), { ssr: false, loading: () => <Placeholder label="Loading Chart..." /> });
const MinMaxChartHybrid = dynamic(() => import('@/components/predictions/MinMaxChartHybrid'), { ssr: false, loading: () => <Placeholder label="Loading Chart..." /> });

// Dynamically import the CNG Line/Bar Charts
const CNGSupplyConsumptionLineChart = dynamic(() => import('@/components/predictions/line_charts/CNGSupplyConsumptionLineChart'), { ssr: false });
const CNGCombinedBarChart = dynamic(() => import('@/components/predictions/stacked_bar_graph/CNGCombinedBarChart'), { ssr: false });
const CNGLineChart = dynamic(() => import('@/components/predictions/line_charts/CNGLineChart'), { ssr: false });

// Dynamically import the Electric Line/Bar Charts
const ElectricityGenerationLineChart = dynamic(() => import('@/components/predictions/line_charts/ElectricityGenerationLineChart'), { ssr: false });
const ElectricityFuelBarChart = dynamic(() => import('@/components/predictions/stacked_bar_graph/ElectricityFuelBarChart'), { ssr: false });
const ElectricityLineChart = dynamic(() => import('@/components/predictions/line_charts/ElectricityLineChart'), { ssr: false });

// Dynamically import Data Components for Bottom Right (Reused for both CNG and Electric)
const LineChart = dynamic(() => import('@/components/data/charts/LineChart'), { ssr: false, loading: () => <Placeholder label="Loading Chart..." /> });
const FuelStationPieChart = dynamic(() => import('@/components/data/charts/FuelStationPieChart'), { ssr: false, loading: () => <Placeholder label="Loading Chart..." /> });

export default function SummaryPage() {
  
  // [CHANGE 2] Added state to toggle between CNG and Electric, defaulting to CNG
  const [activeView, setActiveView] = useState('CNG');

  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px', // Reduced gap since we only show one section at a time now
      padding: '24px',
      maxWidth: '2000px',
      margin: '0 auto',
    },
    // [CHANGE 3] Updated section header to flex layout for the dropdown
    sectionHeader: {
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '2px solid #e2e8f0',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    dropdown: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: '#0f172a',
      backgroundColor: '#f8fafc',
      border: '2px solid #cbd5e1',
      borderRadius: '8px',
      padding: '10px 16px',
      cursor: 'pointer',
      outline: 'none',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      fontFamily: 'inherit'
    },
    quadrant: {
      background: 'white',
      border: '3px solid #94a3b8', 
      borderRadius: '16px',
      padding: '16px',
      height: '100%',
      minHeight: 0,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Prevents any inner charts from bleeding past the border
    },
    // The 3 and 4 grid columns for the bottom-left quadrants
    innerGrid3: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', width: '100%', height: '100%', minHeight: 0, minWidth: 0 },
    innerGrid4: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', width: '100%', height: '100%', minHeight: 0, minWidth: 0 },
  };

  return (
    <DashboardLayout>
      {/* --- RESPONSIVE CSS INJECTION --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Default: Large Monitor View (> 1440px) */
        .responsive-section {
          height: calc(100vh - 120px);
          min-height: 550px;
          display: flex;
          flex-direction: column;
        }
        
        .quadrant-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          grid-template-rows: 1fr 1fr;
          gap: 24px;
          flex-grow: 1;
          min-height: 0;
        }

        .bottom-panel {
          grid-column: auto; /* Standard 1 column span */
        }

        .inner-grid-5 {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          grid-template-rows: repeat(2, 1fr);
          gap: 12px;
          width: 100%;
          height: 100%;
          min-height: 0;
          min-width: 0;
        }

        .grid-5-item-top {
          grid-column: span 3;
          min-height: 0;
          min-width: 0;
        }

        .grid-5-item-bottom {
          grid-column: span 2;
          min-height: 0;
          min-width: 0;
        }

        /* Laptop View (<= 1440px) */
        @media (max-width: 1440px) {
          .responsive-section {
            height: auto;
            min-height: 100vh;
          }

          .quadrant-grid {
            /* Top row is standard height, next two rows are 50vh each */
            grid-template-rows: minmax(500px, calc(100vh - 120px)) minmax(400px, calc(50vh - 20px)) minmax(400px, calc(50vh - 20px));
          }

          .bottom-panel {
            grid-column: 1 / 3; /* Force bottom quadrants to span entire width */
          }

          .inner-grid-5 {
            grid-template-columns: repeat(5, minmax(0, 1fr)); /* 5 columns side-by-side */
            grid-template-rows: 1fr; /* 1 single row */
          }

          .grid-5-item-top, .grid-5-item-bottom {
            grid-column: span 1; /* Reset spans so they just fill 1 column each */
          }
        }
      `}} />

      <div style={styles.wrapper}>
        
        {/* [CHANGE 4] Unified Header with Dropdown Switcher */}
        <div style={styles.sectionHeader}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Summary:
          </h1>
          <select 
            value={activeView} 
            onChange={(e) => setActiveView(e.target.value)}
            style={styles.dropdown}
          >
            <option value="CNG">CNG</option>
            <option value="ELECTRIC">Electric</option>
          </select>
        </div>

        {/* ========================================== */}
        {/* CONDITIONAL RENDER: CNG SUMMARY            */}
        {/* ========================================== */}
        {activeView === 'CNG' && (
          <section className="responsive-section">
            <div className="quadrant-grid">
              {/* Top Left: Map Component */}
              <div style={{...styles.quadrant, padding: 0}}>
               <CNGSummaryMap />
              </div>

              {/* Top Right: Powertrain Predictions Chart */}
              <div style={styles.quadrant}>
                <MinMaxChartCNG isSummaryView={true} />
              </div>

              {/* Bottom Left: Responsive Panel */}
              <div style={styles.quadrant} className="bottom-panel">
                <div style={styles.innerGrid3}>
                  <CNGSupplyConsumptionLineChart isSummaryView={true} />
                  <CNGCombinedBarChart isSummaryView={true} />
                  <CNGLineChart 
                    label="Natural Gas Spot Price at Henry Hub" 
                    title="Natural Gas Price (2023-2050)" 
                    borderColor="#fb7185" 
                    isSummaryView={true} 
                  />
                </div>
              </div>

              {/* Bottom Right: Responsive Panel with 5 Data Charts */}
              <div style={styles.quadrant} className="bottom-panel">
                <div className="inner-grid-5">
                  {/* Top Row on Monitors / Col 1-2 on Laptops */}
                  <div className="grid-5-item-top">
                    <LineChart dataType="vehicles" showFuelTypeSelector={false} showAggregateSelector={false} borderColor='#10b981' backgroundColor='#10b981' isSummaryView={true} />
                  </div>
                  <div className="grid-5-item-top">
                    <LineChart dataType="price" showFuelTypeSelector={false} showAggregateSelector={false} borderColor='#f59e0b' backgroundColor='#f59e0b' isSummaryView={true} />
                  </div>

                  {/* Bottom Row on Monitors / Col 3-5 on Laptops */}
                  <div className="grid-5-item-bottom">
                    <LineChart dataType="incentive" showFuelTypeSelector={false} showAggregateSelector={false} borderColor='#2563eb' backgroundColor='#2563eb' isSummaryView={true} />
                  </div>
                  <div className="grid-5-item-bottom">
                    <LineChart dataType="annual_mileage" showFuelTypeSelector={false} showAggregateSelector={false} borderColor='#fb7185' backgroundColor='#fb7185' isSummaryView={true} />
                  </div>
                  <div className="grid-5-item-bottom">
                    <FuelStationPieChart isSummaryView={true} colors={{
                      'Highly Concentrated Locally truck': '#10b981',
                      'Highly Concentrated Locally bus': '#f59e0b',
                      'Substantially Locally Focused truck': '#fb7185',
                      'Substantially Locally Focused bus': '#2563eb',
                      'National truck': '#facc15',
                      'National bus': '#069aad' 
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================== */}
        {/* CONDITIONAL RENDER: ELECTRIC SUMMARY       */}
        {/* ========================================== */}
        {activeView === 'ELECTRIC' && (
          <section className="responsive-section">
            <div className="quadrant-grid">
              {/* Top Left: Map Component */}
              <div style={{...styles.quadrant, padding: 0}}>
                <ElectricSummaryMap />
              </div>

              {/* Top Right */}
              <div style={styles.quadrant}>
                <MinMaxChartHybrid isSummaryView={true} />
              </div>

              {/* Bottom Left: Responsive Panel */}
              <div style={styles.quadrant} className="bottom-panel">
                <div style={styles.innerGrid4}>
                  <ElectricityGenerationLineChart isSummaryView={true} />
                  <ElectricityFuelBarChart isSummaryView={true} />
                  <ElectricityLineChart 
                    label="Electricity Sales by Sector" 
                    title="Electricity Sales (BkWh)" 
                    isSummaryView={true} 
                  />
                  <ElectricityLineChart 
                    label="Electricity Prices by Sector" 
                    title="Electricity Prices (cents/kWh)" 
                    isSummaryView={true} 
                  />
                </div>
              </div>

              {/* Bottom Right: Responsive Panel */}
              <div style={styles.quadrant} className="bottom-panel">
                <div className="inner-grid-5">
                  {/* Top Row on Monitors / Col 1-2 on Laptops */}
                  <div className="grid-5-item-top">
                    <LineChart 
                      dataType="vehicles" 
                      defaultFuelType="electric" 
                      showFuelTypeSelector={false} 
                      showAggregateSelector={false} 
                      borderColor='#10b981' 
                      backgroundColor='#10b981' 
                      isSummaryView={true} 
                    />
                  </div>
                  <div className="grid-5-item-top">
                    <LineChart 
                      dataType="price" 
                      defaultFuelType="electric" 
                      showFuelTypeSelector={false} 
                      showAggregateSelector={false} 
                      borderColor='#f59e0b' 
                      backgroundColor='#f59e0b' 
                      isSummaryView={true} 
                    />
                  </div>

                  {/* Bottom Row on Monitors / Col 3-5 on Laptops */}
                  <div className="grid-5-item-bottom">
                    <LineChart 
                      dataType="incentive" 
                      defaultFuelType="electric" 
                      showFuelTypeSelector={false} 
                      showAggregateSelector={false} 
                      borderColor='#2563eb' 
                      backgroundColor='#2563eb' 
                      isSummaryView={true} 
                    />
                  </div>
                  <div className="grid-5-item-bottom">
                    <LineChart 
                      dataType="annual_mileage" 
                      defaultFuelType="electric" 
                      showFuelTypeSelector={false} 
                      showAggregateSelector={false} 
                      borderColor='#fb7185' 
                      backgroundColor='#fb7185' 
                      isSummaryView={true} 
                    />
                  </div>
                  <div className="grid-5-item-bottom">
                    <FuelStationPieChart 
                      defaultFuelType="electric" 
                      isSummaryView={true} 
                      colors={{
                        'Highly Concentrated Locally truck': '#10b981',
                        'Highly Concentrated Locally bus': '#f59e0b',
                        'Substantially Locally Focused truck': '#fb7185',
                        'Substantially Locally Focused bus': '#2563eb',
                        'National truck': '#facc15',
                        'National bus': '#069aad' 
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ========================================== */}
      {/* ENERGY INSIGHTS AGENT — floating bubble    */}
      {/* Only visible on the Summary page           */}
      {/* ========================================== */}
      <EnergyInsightsAgent />

    </DashboardLayout>
  );
}