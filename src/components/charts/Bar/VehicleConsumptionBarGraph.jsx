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

export default function VehicleConsumptionBarGraph({ borderColor = '#facc15', backgroundColor = '#fde68a' }) {
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/vehicle-consumption-bar-graph');
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

  const chartData = useMemo(() => {
    if (barData.length === 0) return null;
    return {
      labels: barData.map(d => d.year),
      datasets: [
        {
          label: 'Vehicle CNG Fuel Consumption',
          data: barData.map(d => d.total_vehicle_consumption),
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 1,
          barPercentage: 0.7,
          categoryPercentage: 0.7,
        }
      ]
    };
  }, [barData, borderColor, backgroundColor]);

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
        text: 'Vehicle CNG Fuel Consumption (MMcf)',
        align: 'start',
        font: { size: 16 }
      },
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

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Bar Graph Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
      <div style={{ height: '400px', width: '100%' }}>

        {chartData && <Bar data={chartData} options={options} />}
        {!chartData && <p>No data available.</p>}
      </div>
    </div>
  );
}
