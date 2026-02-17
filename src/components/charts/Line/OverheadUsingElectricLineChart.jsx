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

export default function OverheadUsingElectricLineChart() {
  const [rawData, setRawData] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  // Default to 'US' or the first available state if US isn't present
  const [selectedState, setSelectedState] = useState(''); 
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/overhead-using-electric');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          setRawData(result.data);
          
          // Extract unique states
          const uniqueStates = [...new Set(result.data.map(item => item.state))].sort();
          setAvailableStates(uniqueStates);
          
          // Set default state (US if available, else first one)
          if (uniqueStates.includes('US')) {
            setSelectedState('US');
          } else if (uniqueStates.length > 0) {
            setSelectedState(uniqueStates[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load overhead electric data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Filter Data based on selected state
  const chartData = useMemo(() => {
    if (!selectedState || rawData.length === 0) return null;

    // Filter rows for the selected state
    const stateData = rawData.filter(d => d.state === selectedState);

    return {
      labels: stateData.map(d => d.year),
      datasets: [
        {
          label: 'Gross Generation',
          data: stateData.map(d => d.gross_generation),
          borderColor: '#16a34a', // Green
          backgroundColor: '#16a34a',
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'Net Generation',
          data: stateData.map(d => d.net_generation),
          borderColor: '#2563eb', // Blue
          backgroundColor: '#2563eb',
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'Overhead to Grid',
          data: stateData.map(d => d.overhead_to_grid),
          borderColor: '#9333ea', // Purple
          backgroundColor: '#9333ea',
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'Using from Grid',
          data: stateData.map(d => d.using_from_grid),
          borderColor: '#dc2626', // Red
          backgroundColor: '#dc2626',
          tension: 0.3,
          pointRadius: 2,
        }
      ],
    };
  }, [rawData, selectedState]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: { boxWidth: 10, font: { size: 10 }, padding: 10 } 
      },
      title: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        title: { display: true, text: 'MWh' }
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

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Loading Data...</div>;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#666666' }}>
          Grid Interaction
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
            cursor: 'pointer',
            maxWidth: '120px'
          }}
        >
          {availableStates.map(state => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* Chart Area */}
      <div style={{ flexGrow: 1, position: 'relative', width: '100%' }}>
        {chartData ? <Line data={chartData} options={options} /> : <p className="text-center text-gray-400 mt-10">No data for selected state</p>}
      </div>
    </div>
  );
}