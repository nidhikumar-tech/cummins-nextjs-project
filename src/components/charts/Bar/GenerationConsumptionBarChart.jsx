"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function GenerationConsumptionBarChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/electricity-gen-cons')
      .then(res => res.json())
      .then(result => {
        if (result.success) setChartData(result.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    if (!chartData || !chartData.generation || !chartData.generation.length) return null;

    const years = chartData.generation.map(d => d.year);
    const gen = chartData.generation;
    const cons = chartData.consumption;

    // Stack IDs create the grouping effect
    const STACK_GEN = 'Stack_Generation';
    const STACK_CONS = 'Stack_Consumption';

    return {
      labels: years,
      datasets: [
        // --- GENERATION (Blue/Cool Tones) ---
        { label: 'Source: Coal', data: gen.map(d => d.coal), backgroundColor: '#1e3a8a', stack: STACK_GEN },
        { label: 'Source: Petroleum', data: gen.map(d => d.petroleum), backgroundColor: '#1d4ed8', stack: STACK_GEN },
        { label: 'Source: Natural Gas', data: gen.map(d => d.natural_gas), backgroundColor: '#3b82f6', stack: STACK_GEN },
        { label: 'Source: Other Fossil', data: gen.map(d => d.other_fossil_gas), backgroundColor: '#60a5fa', stack: STACK_GEN },
        { label: 'Source: Nuclear', data: gen.map(d => d.nuclear), backgroundColor: '#93c5fd', stack: STACK_GEN },
        { label: 'Source: Hydro', data: gen.map(d => d.hydroelectric), backgroundColor: '#0f766e', stack: STACK_GEN },
        { label: 'Source: Other', data: gen.map(d => d.other), backgroundColor: '#14b8a6', stack: STACK_GEN },

        // --- CONSUMPTION (Red/Warm Tones) ---
        { label: 'Sector: Residential', data: cons.map(d => d.residential), backgroundColor: '#7f1d1d', stack: STACK_CONS },
        { label: 'Sector: Commercial', data: cons.map(d => d.commercial), backgroundColor: '#b91c1c', stack: STACK_CONS },
        { label: 'Sector: Industrial', data: cons.map(d => d.industrial), backgroundColor: '#ef4444', stack: STACK_CONS },
        { label: 'Sector: Transportation', data: cons.map(d => d.transportation), backgroundColor: '#fb923c', stack: STACK_CONS },
        { label: 'Direct Use', data: cons.map(d => d.direct_use), backgroundColor: '#be123c', stack: STACK_CONS },
      ]
    };
  }, [chartData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Electric Generation (by source) vs Consumption (by sector)', align: 'start', font: { size: 16, weight: 'bold' }, padding: { bottom: 15 } },
      
      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 10 } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { stacked: true, title: { display: true, text: 'Year' }, grid: { display: false } },
      y: { stacked: true, title: { display: true, text: 'Megawatt-Hours' } }
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Gen/Cons Data...</div>;

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