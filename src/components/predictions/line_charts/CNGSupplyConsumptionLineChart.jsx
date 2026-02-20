"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function CNGSupplyConsumptionLineChart({ isSummaryView = false }) {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState('');
  const [units, setUnits] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/cng-line-plot?label=Total Supply').then(r => r.json()),
      fetch('/api/cng-line-plot?label=Consumption by Sector').then(r => r.json())
    ])
      .then(([supplyRes, consRes]) => {
        const combined = [
          ...(supplyRes.success ? supplyRes.data : []),
          ...(consRes.success ? consRes.data : [])
        ];
        setAllData(combined);
        if (combined.length > 0 && combined[0].Units) setUnits(combined[0].Units);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const cases = useMemo(() => {
    if (!allData.length) return [];
    return ['All', ...[...new Set(allData.map(r => r.Case))].filter(Boolean)];
  }, [allData]);

  useEffect(() => {
    if (cases.length > 1 && !selectedCase) {
      setSelectedCase(cases[Math.floor(Math.random() * (cases.length - 1)) + 1]);
    }
  }, [cases, selectedCase]);

  const chartData = useMemo(() => {
    if (!allData.length) return null;
    const years = Array.from({ length: 28 }, (_, i) => 2023 + i);
    const filtered = selectedCase === 'All' ? allData : allData.filter(r => r.Case === selectedCase);
    if (!filtered.length) return null;

    // Group by Label (Total Supply vs Consumption by Sector)
    const supplyRows = filtered.filter(r => r.Label === 'Total Supply');
    const consRows = filtered.filter(r => r.Label === 'Consumption by Sector');

    const datasets = [];
    let datasetIndex = 0;

    // Define shading colors for the two lines
    const shadingColors = [
      'rgba(220, 38, 38, 0.1)',   // Light red for Supply
      'rgba(37, 99, 235, 0.1)',   // Light blue for Consumption
    ];

    // Total Supply line
    if (supplyRows.length > 0) {
      const supplyValues = years.map(year => {
        const key = `year_${year}`;
        return supplyRows.reduce((sum, row) => sum + (row[key] || 0), 0);
      });

      // Find min and max for supply
      let minVal = Infinity;
      let maxVal = -Infinity;
      let minIndex = -1;
      let maxIndex = -1;

      supplyValues.forEach((val, index) => {
        if (val !== null && val !== undefined && val !== 0) {
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

      // Track the index of the supply line
      const supplyLineIndex = datasets.length;

      // Main supply line
      datasets.push({
        label: 'Total Supply',
        data: supplyValues,
        borderColor: '#facc15',
        backgroundColor: '#facc15',
        tension: 0.3,
        pointRadius: 3,
        segment: {
          borderDash: ctx => supplyValues[ctx.p0DataIndex] === 0 ? [6, 6] : [],
        },
        order: 1
      });

      // Add min/max points and shading if valid
      if (minIndex !== -1 && maxIndex !== -1) {
        const minPointData = Array(years.length).fill(null);
        minPointData[minIndex] = minVal;
        const maxPointData = Array(years.length).fill(null);
        maxPointData[maxIndex] = maxVal;
        const maxLineData = Array(years.length).fill(maxVal);
        const minLineData = Array(years.length).fill(minVal);

        datasets.push({
          label: 'Total Supply Max',
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
          label: 'Total Supply Min',
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
          label: 'Total Supply Max Fill',
          data: maxLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColors[0],
          fill: supplyLineIndex,
          order: 2
        });

        datasets.push({
          label: 'Total Supply Min Fill',
          data: minLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColors[0],
          fill: supplyLineIndex,
          order: 2
        });
      }
    }

    // Consumption line
    if (consRows.length > 0) {
      const consValues = years.map(year => {
        const key = `year_${year}`;
        return consRows.reduce((sum, row) => sum + (row[key] || 0), 0);
      });

      // Find min and max for consumption
      let minVal = Infinity;
      let maxVal = -Infinity;
      let minIndex = -1;
      let maxIndex = -1;

      consValues.forEach((val, index) => {
        if (val !== null && val !== undefined && val !== 0) {
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

      // Track the index of the consumption line
      const consLineIndex = datasets.length;

      // Main consumption line
      datasets.push({
        label: 'Consumption',
        data: consValues,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.3,
        pointRadius: 3,
        segment: {
          borderDash: ctx => consValues[ctx.p0DataIndex] === 0 ? [6, 6] : [],
        },
        order: 1
      });

      // Add min/max points and shading if valid
      if (minIndex !== -1 && maxIndex !== -1) {
        const minPointData = Array(years.length).fill(null);
        minPointData[minIndex] = minVal;
        const maxPointData = Array(years.length).fill(null);
        maxPointData[maxIndex] = maxVal;
        const maxLineData = Array(years.length).fill(maxVal);
        const minLineData = Array(years.length).fill(minVal);

        datasets.push({
          label: 'Consumption Max',
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
          label: 'Consumption Min',
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
          label: 'Consumption Max Fill',
          data: maxLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColors[1],
          fill: consLineIndex,
          order: 2
        });

        datasets.push({
          label: 'Consumption Min Fill',
          data: minLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColors[1],
          fill: consLineIndex,
          order: 2
        });
      }
    }

    return { labels: years.map(y => y.toString()), datasets };
  }, [allData, selectedCase]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'CNG Total Supply vs Consumption (2023-2050)', align: 'start', font: { size: 16 }, padding: { bottom: 25 } },
      legend: {
        display: !isSummaryView,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 16,
          font: { size: 14 },
          padding: 16,
          filter: function(item) {
            // Only show main lines and min/max points, hide fill datasets
            return !item.text.includes('Fill');
          }
        }
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
      x: {
        title: { display: true, text: 'Year' },
        grid: {
          display: false,
        }
      },
      y: {
        title: { display: true, text: units || '' },
        grid: {
          color: 'rgba(0,0,0,0.05)',
          lineWidth: 1,
          display: true,
        }
      }
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    // [CHANGE 2] Toggle styles based on isSummaryView
    <div style={{ 
      background: 'white', 
      padding: isSummaryView ? '0px' : '20px', 
      borderRadius: '8px',
      height: '100%',
      display: isSummaryView ? 'flex' : 'block',
      flexDirection: isSummaryView ? 'column' : 'unset'
    }}>
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        flexWrap: 'wrap',
        flexShrink: 0 // Prevent header from squishing
      }}>
        <label style={{ fontWeight: '600', color: '#475569' }}>Select Case:</label>
        <select
          value={selectedCase}
          onChange={e => setSelectedCase(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', cursor: 'pointer', minWidth: '150px' }}
        >
          {cases.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {units && <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>Units: {units}</div>}
      </div>
      
      {/* [CHANGE 3] Toggle between flexGrow and 500px height */}
      <div style={isSummaryView ? { flexGrow: 1, minHeight: 0, position: 'relative' } : { height: '500px', position: 'relative' }}>
        {chartData ? <Line data={chartData} options={options} /> : <p style={{ textAlign: 'center' }}>No data available</p>}
      </div>
    </div>
  );
}