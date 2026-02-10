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

export default function ProductionByYearByStateCNG() {
  const [rawData, setRawData] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [selectedState, setSelectedState] = useState('cumulative');
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cng-production-by-state');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          setRawData(result.data);
          
          // Extract column names that are not 'date'
          // We assume the first row has all keys
          const keys = Object.keys(result.data[0]).filter(k => k !== 'date');
          
          // Sort keys alphabetically, but keep 'cumulative' at the top if desired
          const sortedKeys = keys.sort((a, b) => {
            if (a === 'cumulative') return -1;
            if (b === 'cumulative') return 1;
            return a.localeCompare(b);
          });
          
          setAvailableStates(sortedKeys);
        }
      } catch (err) {
        console.error("Failed to load state production data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Prepare Chart Data based on selection
  const chartData = useMemo(() => {
    if (rawData.length === 0) return null;

    return {
      labels: rawData.map(row => row.date), // Years 2010-2024
      datasets: [
        {
          label: selectedState === 'cumulative' ? 'Total US Production' : `${selectedState} Production`,
          data: rawData.map(row => row[selectedState]), // Dynamic key access
          borderColor: '#2563eb', // Blue
          backgroundColor: '#3b82f6',
          tension: 0.3, // Curve the line slightly
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [rawData, selectedState]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since title/dropdown explains it
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        title: { display: true, text: 'Volume (MMcf)' }
      },
      x: {
        grid: { display: false }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: 'white', 
      borderRadius: '12px', 
      padding: '16px', 
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Header with Title and Dropdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#666666' }}>
          Production by State
        </h3>
        
        <select 
          value={selectedState} 
          onChange={(e) => setSelectedState(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.875rem',
            color: '#334155',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {availableStates.map(state => (
            <option key={state} value={state}>
              {state === 'cumulative' ? 'All US (Cumulative)' : state}
            </option>
          ))}
        </select>
      </div>

      {/* Chart Area */}
      <div style={{ flexGrow: 1, position: 'relative', width: '100%' }}>
        {chartData && <Line data={chartData} options={options} />}
      </div>
    </div>
  );
}