"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ProductionAndConsumptionBarGraph({ prodColor = '#fb7185', consColor = '#fde68a', borderColor = '#facc15' }) {
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/production-vs-consumption-bar-graph');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setBarData(result.data);
        } else {
          setError('Failed to load bar graph data');
        }
      } catch (err) {
        setError('Failed to load bar graph data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate percentage for each year
  const percentLabels = useMemo(() => {
    if (barData.length === 0) return [];
    return barData.map(d => {
      if (!d.total_production || !d.total_consumption) return '';
      const percent = (d.total_consumption / d.total_production) * 100;
      return `${percent.toFixed(2)}%`;
    });
  }, [barData]);

  const chartData = useMemo(() => {
    if (barData.length === 0) return null;
    return {
      labels: barData.map(d => d.year),
      datasets: [
        {
          label: 'Total CNG Production',
          data: barData.map(d => d.total_production),
          backgroundColor: prodColor,
          borderColor: borderColor,
          borderWidth: 1,
          barPercentage: 1.0,
          categoryPercentage: 0.85,
        },
        {
          label: 'Total CNG Consumption',
          data: barData.map(d => d.total_consumption),
          backgroundColor: consColor,
          borderColor: borderColor,
          borderWidth: 1,
          barPercentage: 1.0,
          categoryPercentage: 0.85,
        }
      ]
    };
  }, [barData, prodColor, consColor, borderColor]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      title: {
        display: true,
        text: ['Total CNG Production vs Total CNG Consumption (MMcf)', ''],
        align: 'start',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'MMcf'
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
    }
  }), []);

  // Custom plugin to show percentage labels in the middle of bars
  const percentagePlugin = {
    id: 'percentagePlugin',
    afterDatasetsDraw: (chart) => {
      const { ctx, data, chartArea, scales } = chart;
      if (!chartArea) return;
      
      // Get both dataset metas
      const meta0 = chart.getDatasetMeta(0); // Production
      const meta1 = chart.getDatasetMeta(1); // Consumption
      
      meta0.data.forEach((prodBar, index) => {
        const consBar = meta1.data[index];
        const percent = percentLabels[index];
        if (percent && prodBar && consBar) {
          ctx.save();
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#1e293b';
          ctx.textAlign = 'center';
          
          // Position label at the top of bars
          const topY = Math.min(prodBar.y, consBar.y);
          const centerX = (prodBar.x + consBar.x) / 2;
          
          ctx.fillText(percent, centerX, topY - 10);
          ctx.restore();
        }
      });
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Bar Graph Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
         {/* Ensure you are rendering your chart variable here */}
        {chartData ? <Bar data={chartData} options={options} /> : <p>No data.</p>}
      </div>
    </div>
  );
}
