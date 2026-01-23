"use client";

import React, { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Dummy data for demonstration
const data = [
  { year: 2018, vehicleCount: 120 },
  { year: 2019, vehicleCount: 180 },
  { year: 2020, vehicleCount: 250 },
  { year: 2021, vehicleCount: 320 },
  { year: 2022, vehicleCount: 400 },
  { year: 2023, vehicleCount: 470 },
  { year: 2024, vehicleCount: 530 },
  { year: 2025, vehicleCount: 600 }
];

// Dummy data for demonstration, grouped by state
const stateData = {
  CA: [
    { year: 2018, vehicleCount: 120 },
    { year: 2019, vehicleCount: 180 },
    { year: 2020, vehicleCount: 250 },
    { year: 2021, vehicleCount: 320 },
    { year: 2022, vehicleCount: 400 },
    { year: 2023, vehicleCount: 470 },
    { year: 2024, vehicleCount: 530 },
    { year: 2025, vehicleCount: 600 }
  ],
  TX: [
    { year: 2018, vehicleCount: 100 },
    { year: 2019, vehicleCount: 150 },
    { year: 2020, vehicleCount: 210 },
    { year: 2021, vehicleCount: 270 },
    { year: 2022, vehicleCount: 350 },
    { year: 2023, vehicleCount: 420 },
    { year: 2024, vehicleCount: 480 },
    { year: 2025, vehicleCount: 540 }
  ],
  NY: [
    { year: 2018, vehicleCount: 80 },
    { year: 2019, vehicleCount: 120 },
    { year: 2020, vehicleCount: 170 },
    { year: 2021, vehicleCount: 220 },
    { year: 2022, vehicleCount: 300 },
    { year: 2023, vehicleCount: 360 },
    { year: 2024, vehicleCount: 410 },
    { year: 2025, vehicleCount: 470 }
  ]
};

export default function ChartComponent() {
  const [selectedState, setSelectedState] = useState("CA");
  const data = stateData[selectedState] || [];

  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.year),
      datasets: [
        {
          label: "Vehicle Count",
          data: data.map((d) => d.vehicleCount),
          borderColor: "#2563eb",
          backgroundColor: "#2563eb",
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false
        }
      ]
    };
  }, [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end"
      },
      title: {
        display: true,
        text: "Vehicle Count by Year",
        align: "start",
        font: { size: 16 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Vehicle Count"
        },
        grid: { color: "#f3f4f6" }
      },
      x: {
        title: {
          display: true,
          text: "Year"
        },
        grid: { display: false }
      }
    }
  }), []);

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: 18, color: '#334155', marginBottom: 10, letterSpacing: 0.2 }}>
        Vehicle Count Trend by State
      </div>
      {/* State Filter Dropdown */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="state-select" style={{ fontWeight: '600', color: '#475569' }}>Select State:</label>
        <select
          id="state-select"
          value={selectedState}
          onChange={e => setSelectedState(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          {Object.keys(stateData).map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>
      {/* Chart Container */}
      <div style={{ height: '400px', width: '100%' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
