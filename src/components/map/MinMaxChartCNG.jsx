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
} from 'chart.js';
import { Line } from 'react-chartjs-2';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Standard US State Codes (50 States + DC)
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA',
  'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX',
  'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]);

export default function MinMaxChartCNG() {
  const [rawData, setRawData] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reuse existing API that queries the correct BigQuery table
        const response = await fetch('/api/vehicle-data?year=all');
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setRawData(result.data);

          // Extract unique states, FILTER for only US states, and sort them
          const uniqueStates = [...new Set(result.data.map(item => item.state))]
            .filter(state => US_STATES.has(state)) // <--- Only allow valid US states
            .sort();
          
          setStates(uniqueStates);
          
          // Default to first state if available, prioritize 'TX' if it exists
          if (uniqueStates.length > 0) {
            setSelectedState(uniqueStates.includes('TX') ? 'TX' : uniqueStates[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Prepare Chart Data based on selected State
  const chartData = useMemo(() => {
    if (!selectedState || rawData.length === 0) return null;

    // Filter by selected state and Sort by Year
    const stateData = rawData
      .filter(d => d.state === selectedState)
      .sort((a, b) => a.year - b.year);


    const labels = stateData.map(d => d.year);
    // Calculate current year dynamically
    const currentYear = new Date().getFullYear();
    // If the data year is greater than current year, return null to stop drawing the line
    const actuals = stateData.map(d => d.year > currentYear ? null : d.actualVehicles);
    const forecasts = stateData.map(d => d.vehicleCount);


    return {
      labels,
      datasets: [
        {
          label: 'ACTUAL DATA',
          data: actuals,
          borderColor: '#2563eb', // Blue
          backgroundColor: '#2563eb',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          spanGaps: false, // Ensures the line stops exactly at null, doesn't jump gaps
        },
        {
          label: 'FORECASTED DATA',
          data: forecasts,
          borderColor: '#dc2626', // Red
          backgroundColor: '#dc2626',
          borderDash: [5, 5], // Dashed line for forecast distinction
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [selectedState, rawData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
      title: {
        display: true,
        text: `CNG Vehicle Adoption Trend - ${selectedState}`,
        align: 'start',
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Vehicles'
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
    },
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Chart Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  
  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
      
      {/* State Filter Dropdown */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="state-select" style={{ fontWeight: '600', color: '#475569' }}>Select State:</label>
        <select
          id="state-select"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
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

      {/* Chart Container */}
      <div style={{ height: '400px', width: '100%' }}>
        {chartData && <Line data={chartData} options={options} />}
        {!chartData && <p>No data available for this state.</p>}
      </div>
    </div>
  );
}