"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function VishnuBarChart() {
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    fetch('/api/vishnu-bar-data')
      .then(res => res.json())
      .then(result => {
        if (result.success) setChartData(result.data);
      })
      .catch(err => console.error(err));
  }, []);

  const data = useMemo(() => {
    if (!chartData) return null;
    return {
      labels: chartData.map(d => d.year),
      datasets: [{
        label: 'Total Vehicle Consumption',
        data: chartData.map(d => d.value),
        backgroundColor: '#8b5cf6', // Purple
      }]
    };
  }, [chartData]);

  const options = { responsive: true, maintainAspectRatio: false };

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', height: '400px' }}>
      <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>A Bar Chart</h3>
      {data ? <Bar data={data} options={options} /> : <p>Loading...</p>}
    </div>
  );
}