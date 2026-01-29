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
  Filler
);

export default function IncentivesLineChart() {
  const [incentiveData, setIncentiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fuelType, setFuelType] = useState('electric'); // 'electric' or 'naturalGas'

  // Fetch incentive data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/incentives-vehicle-data');
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setIncentiveData(result.data);
        }
      } catch (err) {
        setError('Failed to load incentive chart data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare chart data based on selected fuel type
  const chartData = useMemo(() => {
    if (incentiveData.length === 0) return null;
    
    const dataValues = fuelType === 'electric' 
      ? incentiveData.map(d => d.electricVehicles)
      : incentiveData.map(d => d.naturalGas);
    
    return {
      labels: incentiveData.map(d => d.year),
      datasets: [
        {
          label: fuelType === 'electric' ? 'Electric Incentives' : 'CNG Incentives',
          data: dataValues,
          borderColor: "#2563eb",
          backgroundColor: "#2563eb",
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false
        }
      ]
    };
  }, [incentiveData, fuelType]);

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
        text: `${fuelType === 'electric' ? 'Electric' : 'CNG'} Vehicle Incentive by Year`,
        align: 'start',
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Incentive Count'
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
  }), [fuelType]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Incentive Chart Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="incentive-fuel-type-select" style={{ fontWeight: '600', color: '#475569' }}>Select Fuel Type:</label>
        <select
          id="incentive-fuel-type-select"
          value={fuelType}
          onChange={e => setFuelType(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <option value="electric">Electric</option>
          <option value="naturalGas">CNG</option>
        </select>
      </div>
      <div style={{ height: '400px', width: '100%' }}>
        {chartData && <Line data={chartData} options={options} />}
        {!chartData && <p>No data available.</p>}
      </div>
    </div>
  );
}
