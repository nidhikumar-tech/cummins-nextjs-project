"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CapacityBarChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/electricity-capacity')
      .then(res => res.json())
      .then(result => {
        if (result.success) setChartData(result.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    if (!chartData || !chartData.length) return null;
    
    return {
      labels: chartData.map(d => d.year),
      datasets: [
        { label: 'Coal', data: chartData.map(d => d.coal), backgroundColor: '#ffb6c1' },      
        { label: 'Petroleum', data: chartData.map(d => d.petroleum), backgroundColor: '#ff69b4' }, 
        { label: 'Natural Gas', data: chartData.map(d => d.natural_gas), backgroundColor: '#fe2c54' }, 
        { label: 'Other Fossil', data: chartData.map(d => d.other_fossil_gas), backgroundColor: '#0891b2' }, 
        { label: 'Nuclear', data: chartData.map(d => d.nuclear), backgroundColor: '#7c3aed' }, 
        { label: 'Hydro', data: chartData.map(d => d.hydroelectric), backgroundColor: '#2563eb' }, 
        { label: 'Other', data: chartData.map(d => d.other), backgroundColor: '#da1884' }, 
      ]
    };
  }, [chartData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Electric Capacity (by source)', align: 'start', font: { size: 16, weight: 'bold' }, padding: { bottom: 15 } },
      legend: { position: 'bottom', 
                labels: { boxWidth: 10, font: { size: 10 }, padding: 10 }
       },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, title: { display: true, text: 'Megawatts' }, grid: { color: '#f3f4f6' } }
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Capacity Data...</div>;

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: 'white', 
      padding: '16px', 
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ flexGrow: 1, position: 'relative', width: '100%' }}>
        {data ? <Bar data={data} options={options} /> : <p className="text-center text-gray-400 mt-10">No data available</p>}
      </div>
    </div>
  );
}