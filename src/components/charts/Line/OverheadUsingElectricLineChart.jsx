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

    // Define shading colors for the 4 lines
    const shadingColors = [
      'rgba(220, 38, 38, 0.1)',   // Light red
      'rgba(37, 99, 235, 0.1)',   // Light blue
      'rgba(139, 92, 246, 0.1)',  // Light purple
      'rgba(239, 68, 68, 0.1)',   // Light red-orange
    ];

    const lineConfigs = [
      { label: 'Gross Generation', data: stateData.map(d => d.gross_generation), color: '#16a34a', shadingColor: shadingColors[0] },
      { label: 'Net Generation', data: stateData.map(d => d.net_generation), color: '#2563eb', shadingColor: shadingColors[1] },
      { label: 'Overhead to Grid', data: stateData.map(d => d.overhead_to_grid), color: '#9333ea', shadingColor: shadingColors[2] },
      { label: 'Using from Grid', data: stateData.map(d => d.using_from_grid), color: '#dc2626', shadingColor: shadingColors[3] }
    ];

    const datasets = [];

    lineConfigs.forEach((config, lineIndex) => {
      const values = config.data;

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

      // Track the index of the main line
      const mainLineIndex = datasets.length;

      // Main line
      datasets.push({
        label: config.label,
        data: values,
        borderColor: config.color,
        backgroundColor: config.color,
        tension: 0.3,
        pointRadius: 2,
        order: 1
      });

      // Add min/max points and shading if valid
      if (minIndex !== -1 && maxIndex !== -1) {
        const minPointData = Array(values.length).fill(null);
        minPointData[minIndex] = minVal;
        const maxPointData = Array(values.length).fill(null);
        maxPointData[maxIndex] = maxVal;
        const maxLineData = Array(values.length).fill(maxVal);
        const minLineData = Array(values.length).fill(minVal);

        datasets.push({
          label: `${config.label} Max`,
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
          label: `${config.label} Min`,
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
          label: `${config.label} Max Fill`,
          data: maxLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: config.shadingColor,
          fill: mainLineIndex,
          order: 2
        });

        datasets.push({
          label: `${config.label} Min Fill`,
          data: minLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: config.shadingColor,
          fill: mainLineIndex,
          order: 2
        });
      }
    });

    return {
      labels: stateData.map(d => d.year),
      datasets: datasets,
    };
  }, [rawData, selectedState]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: { 
          boxWidth: 10, 
          font: { size: 10 }, 
          padding: 10,
          filter: function(item) {
            // Only show main lines and min/max points, hide fill datasets
            return !item.text.includes('Fill');
          }
        } 
      },
      title: { display: false },
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