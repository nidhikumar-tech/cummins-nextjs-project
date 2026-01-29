"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function VishnuLineChart() {
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    fetch('/api/vishnu-line-data')
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
        label: 'Electric Vehicles',
        data: chartData.map(d => d.value),
        borderColor: '#06b6d4', // Cyan
        backgroundColor: '#06b6d4',
        tension: 0.3
      }]
    };
  }, [chartData]);

  const options = { responsive: true, maintainAspectRatio: false };

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', height: '400px' }}>
      <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>A Line Chart</h3>
      {data ? <Line data={data} options={options} /> : <p>Loading...</p>}
    </div>
  );
}