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

export default function LineChart({ dataType = 'vehicles', showFuelTypeSelector = true, borderColor = '#2563eb', backgroundColor = '#2563eb' }) {
  const [electricData, setElectricData] = useState([]);
  const [cngData, setCngData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fuelType, setFuelType] = useState('electric'); // 'electric' or 'cng'

  // Fetch both datasets on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch both electric and CNG data in parallel
        const [electricResponse, cngResponse] = await Promise.all([
          fetch('/api/electric-vehicle-data-line-chart'),
          fetch('/api/cng-vehicle-data-line-chart')
        ]);

        const [electricResult, cngResult] = await Promise.all([
          electricResponse.json(),
          cngResponse.json()
        ]);

        if (electricResult.success && Array.isArray(electricResult.data)) {
          const filteredElectric = electricResult.data.filter(item => item.year <= 2025);
          setElectricData(filteredElectric);
        }

        if (cngResult.success && Array.isArray(cngResult.data)) {
          const filteredCng = cngResult.data.filter(item => item.year <= 2025);
          setCngData(filteredCng);
        }
      } catch (err) {
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Select data based on fuel type using useMemo for smooth transitions
  const chartData = useMemo(() => {
    const rawData = fuelType === 'electric' ? electricData : cngData;
    if (rawData.length === 0) return null;
    
    // Determine what data to show based on dataType prop
    let label, dataValues;
    if (dataType === 'price') {
      label = fuelType === 'electric' ? 'EV Price' : 'CNG Price';
      dataValues = rawData.map(d => fuelType === 'electric' ? d.evPrice : d.cngPrice);
    } else {
      label = fuelType === 'electric' ? 'Actual EV Vehicles' : 'Actual CNG Vehicles';
      dataValues = rawData.map(d => d.actualVehicles);
    }
    
    // Data is already sorted by year from the API
    return {
      labels: rawData.map(d => d.year),
      datasets: [
        {
          label: label,
          data: dataValues,
          borderColor,
          backgroundColor,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false
        }
      ]
    };
  }, [electricData, cngData, fuelType, dataType]);

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
        text: dataType === 'price' 
          ? `${fuelType === 'electric' ? 'Electric' : 'CNG'} Price by Year`
          : `${fuelType === 'electric' ? 'Electric' : 'CNG'} Vehicle Count by Year`,
        align: 'start',
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: dataType === 'price' ? 'Price ($)' : 'Vehicle Count'
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
  }), [fuelType, dataType]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Chart Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
      {showFuelTypeSelector && (
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="fuel-type-select" style={{ fontWeight: '600', color: '#475569' }}>Select Fuel Type:</label>
          <select
            id="fuel-type-select"
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
      )}
      <div style={{ height: '400px', width: '100%' }}>
        {chartData && <Line data={chartData} options={options} />}
        {!chartData && <p>No data available.</p>}
      </div>
    </div>
  );
}