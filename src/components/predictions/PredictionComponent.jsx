"use client";

import MinMaxChartCNG from './MinMaxChartCNG';
import MinMaxChartHybrid from './MinMaxChartHybrid';

export default function PredictionComponent() {
  return (
    <div>
      <div style={{padding: '32px 24px', background: '#f8f9fa', minHeight: '60vh', maxWidth: '1600px', margin: '0 auto'}}>
        <div style={{marginBottom: '32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em'}}>Powertrain Production Forecast - CNG</h1>
        </div>
        <div style={{boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)', padding: '5px'}}>
          <MinMaxChartCNG />
        </div>
      </div>

      <div style={{padding: '32px 24px', background: '#f8f9fa', minHeight: '60vh', maxWidth: '1600px', margin: '0 auto'}}>
        <div style={{marginBottom: '32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em'}}>Powertrain Production Forecast - Electric</h1>
        </div>
        <div style={{boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)', padding: '5px'}}>
          <MinMaxChartHybrid />
        </div>
      </div>
    </div>
  );
}