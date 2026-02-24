"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function CNGCapacityLineChart() {
  const [cumminsData, setCumminsData] = useState([]);
  const [eiaData, setEiaData] = useState([]);
  const [states, setStates] = useState([]);
  
  const [source, setSource] = useState('cummins'); // 'cummins' or 'eia'
  const [selectedState, setSelectedState] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cumminsRes, eiaRes] = await Promise.all([
          fetch('/api/cng-capacity-predictions?source=cummins').then(res => res.json()),
          fetch('/api/cng-capacity-predictions?source=eia').then(res => res.json())
        ]);

        if (cumminsRes.success) {
          setCumminsData(cumminsRes.data);
          const uniqueStates = [...new Set(cumminsRes.data.map(d => d.state))].filter(Boolean).sort();
          setStates(uniqueStates);
          if (uniqueStates.length > 0) setSelectedState(uniqueStates.includes('CA') ? 'CA' : uniqueStates[0]);
        }
        if (eiaRes.success) {
          setEiaData(eiaRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch CNG Capacity data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (source === 'cummins') {
      if (!cumminsData.length || !selectedState) return null;
      const stateData = cumminsData.filter(d => d.state === selectedState).sort((a, b) => a.year - b.year);
      if (!stateData.length) return null;

      return {
        labels: stateData.map(d => d.year),
        datasets: [
          {
            label: 'Actual Capacity (TCF)',
            data: stateData.map(d => d.actual_capacity_tcf != null ? d.actual_capacity_tcf : null),
            borderColor: '#2563eb', // Blue
            backgroundColor: '#2563eb',
            tension: 0.3,
            spanGaps: false,
          },
          {
            label: 'Predicted Capacity (TCF)',
            data: stateData.map(d => d.predicted_capacity_tcf != null ? d.predicted_capacity_tcf : null),
            borderColor: '#dc2626', // Red
            backgroundColor: '#dc2626',
            borderDash: [5, 5], // Dashed
            tension: 0.3,
            spanGaps: false,
          }
        ]
      };
    } else {
      if (!eiaData.length) return null;
      const sortedData = [...eiaData].sort((a, b) => a.year - b.year);
      return {
        labels: sortedData.map(d => d.year),
        datasets: [
          {
            label: 'EIA Baseline (TCF)',
            data: sortedData.map(d => d.eia_baseline_tcf != null ? d.eia_baseline_tcf : null),
            borderColor: '#8b5cf6', // Purple
            backgroundColor: '#8b5cf6',
            tension: 0.3,
          }
        ]
      };
    }
  }, [cumminsData, eiaData, source, selectedState]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { 
        display: true, 
        text: source === 'cummins' ? `Cummins Predictions - ${selectedState}` : 'EIA Reference Baseline', 
        align: 'start', 
        font: { size: 16 } 
      },
      legend: { position: 'top', align: 'end' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { title: { display: true, text: 'Year' }, grid: { display: false } },
      y: { title: { display: true, text: 'Capacity (TCF)' }, grid: { color: '#f3f4f6' }, beginAtZero: true }
    }
  }), [source, selectedState]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', background: 'white', borderRadius: '8px' }}>Loading Chart Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red', background: 'white', borderRadius: '8px' }}>{error}</div>;

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', height: '100%' }}>
      
      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: '600', color: '#475569' }}>Prediction Source:</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
          >
            <option value="cummins">Cummins Predictions</option>
            <option value="eia">EIA Predictions</option>
          </select>
        </div>

        {source === 'cummins' && states.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#475569' }}>State:</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              {states.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: '400px', width: '100%', position: 'relative' }}>
        {chartData ? <Line data={chartData} options={options} /> : <p style={{ textAlign: 'center' }}>No data available.</p>}
      </div>
    </div>
  );
}