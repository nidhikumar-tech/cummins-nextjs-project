"use client";

import CNGLineChart from './line_charts/CNGLineChart';
import CNGProductionBarChart from './stacked_bar_graph/CNGProductionBarChart';
import CNGNetImportBarChart from './stacked_bar_graph/CNGNetImportBarChart';
import CNGConsumptionBarChart from './stacked_bar_graph/CNGConsumptionBarChart';
import MinMaxChartCNG from './MinMaxChartCNG';
import MinMaxChartHybrid from './MinMaxChartHybrid';

export default function PredictionComponent() {
  return (
    <div>
      <div style={{ padding: '32px 24px', background: '#f8f9fa', minHeight: '60vh', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em' }}>Powertrain Production Forecast - CNG</h1>
        </div>
        <div style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)', padding: '5px' }}>
          <MinMaxChartCNG />
        </div>
      </div>
      <div style={{ padding: '32px 24px', background: '#f8f9fa', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <CNGLineChart label="Total Supply" borderColor="#facc15" backgroundColor="rgba(16, 185, 129, 0.1)" title="CNG Total Supply (2023-2050)"/>  
          <CNGLineChart label="Consumption by Sector" borderColor="#10b981" backgroundColor="rgba(16, 185, 129, 0.1)" title="Consumption by Commercial Sector (2023-2050)"/>  
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <CNGLineChart label="Natural Gas Spot Price at Henry Hub" borderColor="#fb7185" backgroundColor="rgba(16, 185, 129, 0.1)" title="Natural Gas Price (2023-2050)"/>  
          <CNGProductionBarChart />
        </div>
      </div>

      <div style={{ padding: '32px 24px', background: '#f8f9fa', minHeight: '80vh', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <CNGNetImportBarChart />
          <CNGConsumptionBarChart />
        </div>
      </div>

      <div style={{ padding: '32px 24px', background: '#f8f9fa', minHeight: '60vh', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em' }}>Powertrain Production Forecast - Electric</h1>
        </div>
        <div style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)', padding: '5px' }}>
          <MinMaxChartHybrid />
        </div>
      </div>
    </div>
  );
}