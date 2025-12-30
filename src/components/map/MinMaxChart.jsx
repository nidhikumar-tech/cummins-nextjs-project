"use client";

import React from 'react';
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

// Register the components
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

export default function MinMax() {
  
  // 1. Define the Labels
  const labels = ['2015', '2020', '2025', '2030', '2035', '2040'];

  // 2. Mock Data Construction
  // First 6 months: All lines share these values
  const history = [6.25, 18.75, 15.62,];

  // Last 6 months: Divergence
  const maxForecast = [43.75, 53.12, 100.0]; // Goes High
  const avgForecast = [40.62, 43.75, 56.25]; // Stays Middle
  const minForecast = [31.25, 25.0, 0.0];  // Goes Low

  const data = {
    labels,
    datasets: [
      {
        label: 'Max Projection',
        // Combine history + forecast
        data: [...history, ...maxForecast],
        borderColor: '#94a3b8', // Gray (Slate-400)
        backgroundColor: '#ff7f7f', // red fill
        
        // MAGIC LINE: Fill the space between this line (Index 0) and the Avg line (Index 1)
        fill: 1, 
        
        tension: 0.4, // Makes lines smooth/curved
        pointRadius: 0, // Hides dots for a cleaner look
        pointHoverRadius: 6,
      },
      {
        label: 'Avg Projection',
        data: [...history, ...avgForecast],
        borderColor: '#64748b', // Darker Gray (Slate-500)
        backgroundColor: '#90D5FF', // Blue fill
        
        // MAGIC LINE: Fill the space between this line (Index 1) and the Min line (Index 2)
        fill: 2,
        
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: 'Min Projection',
        data: [...history, ...minForecast],
        borderColor: '#94a3b8', // Gray (Slate-400)
        backgroundColor: 'transparent', // No fill below the bottom line
        
        fill: false, // Stop filling here
        
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6', // Light gray grid lines
        }
      },
      x: {
        grid: {
          display: false, // Clean look (remove vertical grid lines)
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div>
      <h3 style={{ 
        margin: '0 0 20px 0', 
        color: '#1e293b', 
        fontSize: '1.25rem', 
        fontWeight: 600,
        textAlign: 'center' }}>
        Adoption Chart
      </h3>
      <div style={{ position: 'relative', height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}