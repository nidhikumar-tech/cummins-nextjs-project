"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LogarithmicScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LogarithmicScale
);

export default function LineChart() {
  const [rawData, setRawData] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/vehicle-data-for-min-max?year=all');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setRawData(result.data);
          const uniqueStates = [...new Set(result.data.map(item => item.state))].sort();
          setStates(uniqueStates);
          if (uniqueStates.length > 0) {
            setSelectedState(uniqueStates.includes('CA') ? 'CA' : uniqueStates[0]);
          }
        }
      } catch (err) {
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (!selectedState || rawData.length === 0) return null;
    const stateData = rawData.filter(d => d.state === selectedState).sort((a, b) => a.year - b.year);
    return {
      labels: stateData.map(d => d.year),
      datasets: [
        {
          label: 'Vehicle Count',
          data: stateData.map(d => d.vehicleCount),
          borderColor: '#2563eb',
          backgroundColor: '#2563eb',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false
        }
      ]
    };
  }, [selectedState, rawData]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end'
      },
      title: {
        display: true,
        text: `VIN Counts by Year (CNG)`,
        align: 'start',
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'VIN Count'
        },
        grid: { color: '#f3f4f6' }
      },
      x: {
        title: {
          display: true,
          text: 'Year'
        },
        grid: { display: false }
      }
    }
  }), []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Chart Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="state-select" style={{ fontWeight: '600', color: '#475569' }}>Select State:</label>
        <select
          id="state-select"
          value={selectedState}
          onChange={e => setSelectedState(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          {states.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>
      <div style={{ height: '400px', width: '100%' }}>
        {chartData && <Line data={chartData} options={options} />}
        {!chartData && <p>No data available for this state.</p>}
      </div>
    </div>
  );
}