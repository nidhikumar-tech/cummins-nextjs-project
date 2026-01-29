"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function VinCountBarGraph({ prodColor = '#22c55e', consColor = '#a7f3d0', borderColor = '#16a34a' }) {
  const [electricData, setElectricData] = useState([]);
  const [cngData, setCngData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fuelType, setFuelType] = useState('electric'); // 'electric' or 'cng'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [electricResponse, cngResponse] = await Promise.all([
          fetch('/api/electric-vehicle-data-line-chart'),
          fetch('/api/cng-vehicle-data-line-chart')
        ]);
        const [electricResult, cngResult] = await Promise.all([
          electricResponse.json(),
          cngResponse.json()
        ]);
        if (electricResult.success && Array.isArray(electricResult.data)) {
          setElectricData(electricResult.data);
        }
        if (cngResult.success && Array.isArray(cngResult.data)) {
          setCngData(cngResult.data);
        }
      } catch (err) {
        setError('Failed to load VIN chart data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare chart data based on selected fuel type
  const chartData = useMemo(() => {
    const rawData = fuelType === 'electric' ? electricData : cngData;
    if (rawData.length === 0) return null;
    return {
      labels: rawData.map(d => d.year),
      datasets: [
        {
          label: 'total Count of VIN',
          data: rawData.map(d => d.actualVehicles),
          backgroundColor: prodColor,
          borderColor: borderColor,
          borderWidth: 1,
          barPercentage: 1.0,
          categoryPercentage: 0.85,
        },
        {
          label: 'total Count of CMI VIN',
          data: rawData.map(d => d.cmiVin),
          backgroundColor: consColor,
          borderColor: borderColor,
          borderWidth: 1,
          barPercentage: 1.0,
          categoryPercentage: 0.85,
        }
      ]
    };
  }, [electricData, cngData, fuelType, prodColor, consColor, borderColor]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      title: {
        display: true,
        text: 'VIN Counts by Year',
        align: 'center',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value?.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
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

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading VIN Chart Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="vin-fuel-type-select" style={{ fontWeight: '600', color: '#475569' }}>Select Fuel Type:</label>
        <select
          id="vin-fuel-type-select"
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
          <option value="cng">CNG</option>
        </select>
      </div>
      <div style={{ height: '400px', width: '100%' }}>
        {chartData && <Bar data={chartData} options={options} />}
        {!chartData && <p>No data available.</p>}
      </div>
    </div>
  );
}
