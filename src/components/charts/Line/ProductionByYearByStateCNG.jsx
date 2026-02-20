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

    const values = rawData.map(row => row[selectedState]);

    // Find min and max
    let minVal = Infinity;
    let maxVal = -Infinity;
    let minIndex = -1;
    let maxIndex = -1;

    values.forEach((val, index) => {
      if (val !== null && val !== undefined) {
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

    const datasets = [
      {
        label: selectedState === 'cumulative' ? 'Total US Production' : `${selectedState} Production`,
        data: values,
        borderColor: '#2563eb', // Blue
        backgroundColor: '#3b82f6',
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
        order: 1
      }
    ];

    // Add min/max points and shading if valid
    if (minIndex !== -1 && maxIndex !== -1) {
      const minPointData = Array(values.length).fill(null);
      minPointData[minIndex] = minVal;
      const maxPointData = Array(values.length).fill(null);
      maxPointData[maxIndex] = maxVal;
      const maxLineData = Array(values.length).fill(maxVal);
      const minLineData = Array(values.length).fill(minVal);

      datasets.push({
        label: 'Max',
        data: maxPointData,
        borderColor: '#16a34a',
        backgroundColor: '#22c55e',
        pointStyle: 'circle',
        pointRadius: 10,
        pointHoverRadius: 12,
        borderWidth: 3,
        showLine: false,
        order: 0
      });

      datasets.push({
        label: 'Min',
        data: minPointData,
        borderColor: '#ea580c',
        backgroundColor: '#f97316',
        pointStyle: 'circle',
        pointRadius: 10,
        pointHoverRadius: 12,
        borderWidth: 3,
        showLine: false,
        order: 0
      });

      datasets.push({
        label: 'Max Fill',
        data: maxLineData,
        borderColor: 'transparent',
        pointRadius: 0,
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: 0,
        order: 2
      });

      datasets.push({
        label: 'Min Fill',
        data: minLineData,
        borderColor: 'transparent',
        pointRadius: 0,
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: 0,
        order: 2
      });
    }

    return {
      labels: rawData.map(row => row.date), // Years 2010-2024
      datasets: datasets,
    };
  }, [rawData, selectedState]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          filter: function(item) {
            // Only show main line and min/max points, hide fill datasets
            return !item.text.includes('Fill');
          }
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        filter: function(tooltipItem) {
          // Hide tooltips for the shading layers
          return !tooltipItem.dataset.label.includes('Fill');
        }
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