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
  Filler
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

// Standard US State Codes (50 States + DC)
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA',
  'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX',
  'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]);

export default function MinMaxChartHybrid() {
  const [rawData, setRawData] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // CHANGE 1: Point to the new Hybrid API
        const response = await fetch('/api/hybrid-data?year=all');
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setRawData(result.data);

          const uniqueStates = [...new Set(result.data.map(item => item.state))]
            .filter(state => US_STATES.has(state))
            .sort();
          
          setStates(uniqueStates);
          
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

    const stateData = rawData
      .filter(d => d.state === selectedState)
      .sort((a, b) => a.year - b.year);

    const labels = stateData.map(d => d.year);
    const currentYear = new Date().getFullYear();
    const actuals = stateData.map(d => d.year > currentYear ? null : d.actualVehicles);
    const forecasts = stateData.map(d => d.vehicleCount);

    let minVal = Infinity;
    let maxVal = -Infinity;
    let minIndex = -1;
    let maxIndex = -1;

    stateData.forEach((d, index) => {
        if (d.year >= currentYear) {
            const val = d.vehicleCount;
            if (val < minVal) {
                minVal = val;
                minIndex = index;
            }
            if (val > maxVal) {
                maxVal = val;
                maxIndex = index;
            }
        }
    });

    const minPointData = Array(labels.length).fill(null);
    if (minIndex !== -1) minPointData[minIndex] = minVal;

    const maxPointData = Array(labels.length).fill(null);
    if (maxIndex !== -1) maxPointData[maxIndex] = maxVal;
    
    const maxLineData = stateData.map(d => d.year >= currentYear ? maxVal : null);
    const minLineData = stateData.map(d => d.year >= currentYear ? minVal : null);

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
          spanGaps: false,
          order: 1
        },
        {
          label: 'FORECASTED DATA',
          data: forecasts,
          borderColor: '#dc2626', // Red
          backgroundColor: '#dc2626',
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          order: 1
        },
        {
            label: 'Forecast Max',
            data: maxPointData,
            borderColor: '#16a34a',
            backgroundColor: '#22c55e',
            pointStyle: 'circle',
            pointRadius: 10,
            pointHoverRadius: 12,
            borderWidth: 3,
            showLine: false,
            order: 0
        },
        {
            label: 'Forecast Min',
            data: minPointData,
            borderColor: '#ea580c',
            backgroundColor: '#f97316',
            pointStyle: 'circle',
            pointRadius: 10,
            pointHoverRadius: 12,
            borderWidth: 3,
            showLine: false,
            order: 0
        },
        {
            label: 'Max Fill',
            data: maxLineData,
            borderColor: 'transparent',
            pointRadius: 0,
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            fill: 1, 
            order: 2
        },
        {
            label: 'Min Fill',
            data: minLineData,
            borderColor: 'transparent',
            pointRadius: 0,
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            fill: 1,
            order: 2
        }
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
        labels: {
            filter: function(item, chart) {
                return item.text === 'ACTUAL DATA' || 
                       item.text === 'FORECASTED DATA' ||
                       item.text === 'Forecast Max' || 
                       item.text === 'Forecast Min';
            },
            sort: (a, b) => a.datasetIndex - b.datasetIndex
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        filter: function(tooltipItem) {
            return tooltipItem.dataset.label !== 'Max Fill' && 
                   tooltipItem.dataset.label !== 'Min Fill';
        }
      },
      title: {
        display: true,
        // CHANGE 2: Updated Title
        text: `Hybrid Vehicle Adoption Trend`,
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
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="state-select-hybrid" style={{ fontWeight: '600', color: '#475569' }}>Select State:</label>
        <select
          id="state-select-hybrid"
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

      <div style={{ height: '400px', width: '100%' }}>
        {chartData && <Line data={chartData} options={options} />}
        {!chartData && <p>No data available for this state.</p>}
      </div>
    </div>
  );
}