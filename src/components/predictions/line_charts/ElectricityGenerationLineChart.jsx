"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ElectricityGenerationLineChart() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState('');
  const [units, setUnits] = useState('');

  useEffect(() => {
    fetch('/api/electricity-generation-line-plot')
      .then(res => res.json())
      .then(response => {
        if (response.success && response.data) {
          console.log('Electricity Generation Line Data:', response.data.length);
          setAllData(response.data);
          if (response.data.length > 0 && response.data[0].Units) {
            setUnits(response.data[0].Units);
          }
        }
      })
      .catch(err => console.error('Error fetching electricity generation data:', err))
      .finally(() => setLoading(false));
  }, []);

  const cases = useMemo(() => {
    if (!allData.length) return [];
    return [...new Set(allData.map(r => r.Case))].filter(Boolean);
  }, [allData]);

  useEffect(() => {
    if (cases.length > 0 && !selectedCase) {
      setSelectedCase(cases[Math.floor(Math.random() * cases.length)]);
    }
  }, [cases, selectedCase]);

  const chartData = useMemo(() => {
    if (!allData.length) return null;
    const years = Array.from({ length: 28 }, (_, i) => 2023 + i);
    const filtered = allData.filter(r => r.Case === selectedCase);
    if (!filtered.length) return null;

    // Define the 4 lines we need
    const labels = [
      'Total Net Electricity Generation',
      'Net Available to the Grid',
      'Net Generation to the Grid',
      'Total Use From Grid'
    ];

    // Define distinct vibrant colors for each line
    const colors = {
      'Total Net Electricity Generation': '#3b82f6',  // Blue
      'Net Available to the Grid': '#10b981',          // Green
      'Net Generation to the Grid': '#f59e0b',         // Amber
      'Total Use From Grid': '#8b5cf6'                 // Purple
    };

    // Define shading colors matching each line's color
    const shadingColors = {
      'Total Net Electricity Generation': 'rgba(59, 130, 246, 0.15)',  // from #3b82f6
      'Net Available to the Grid':        'rgba(16, 185, 129, 0.15)', // from #10b981
      'Net Generation to the Grid':       'rgba(245, 158, 11, 0.15)', // from #f59e0b
      'Total Use From Grid':              'rgba(139, 92, 246, 0.15)'  // from #8b5cf6
    };

    const datasets = [];

    labels.forEach((label, lineIndex) => {
      const rows = filtered.filter(r => r.Label === label);
      if (rows.length === 0) return;

      const values = years.map(year => {
        const key = `year_${year}`;
        return rows.reduce((sum, row) => sum + (row[key] || 0), 0);
      });

      // Find min and max
      let minVal = Infinity;
      let maxVal = -Infinity;
      let minIndex = -1;
      let maxIndex = -1;

      values.forEach((val, index) => {
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

      // Track the index of the main line
      const mainLineIndex = datasets.length;

      // Main line
      datasets.push({
        label: label,
        data: values,
        borderColor: colors[label] || '#6b7280',
        backgroundColor: colors[label] || '#6b7280',
        tension: 0.3,
        pointRadius: 3,
        segment: {
          borderDash: ctx => values[ctx.p0DataIndex] === 0 ? [6, 6] : [],
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
          label: `${label} Max`,
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
          label: `${label} Min`,
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
          label: `${label} Max Fill`,
          data: maxLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColors[label] || 'rgba(99, 102, 241, 0.15)',
          fill: mainLineIndex,
          order: 2
        });

        datasets.push({
          label: `${label} Min Fill`,
          data: minLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColors[label] || 'rgba(99, 102, 241, 0.15)',
          fill: mainLineIndex,
          order: 2
        });
      }
    });

    return { labels: years.map(y => y.toString()), datasets };
  }, [allData, selectedCase]);

  // Calculate y-axis max with padding
  const yMax = useMemo(() => {
    if (!chartData || !chartData.datasets.length) return undefined;
    
    const allValues = chartData.datasets.flatMap(ds => ds.data);
    const maxVal = Math.max(...allValues);
    
    // Add padding: round up to next multiple of nice step
    const step = Math.pow(10, Math.floor(Math.log10(maxVal)));
    return Math.ceil((maxVal + step) / step) * step;
  }, [chartData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { 
        display: true, 
        text: 'Electricity Generation & Grid Usage (2023-2050)', 
        align: 'start', 
        font: { size: 16 }, 
        padding: { bottom: 25 } 
      },
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 16,
          font: { size: 12 },
          padding: 12,
          filter: function(item) {
            // Hide fill datasets and min/max legend labels (bubbles stay on chart)
            return !item.text.includes('Fill') && !item.text.endsWith(' Max') && !item.text.endsWith(' Min');
          }
        }
      },
      tooltip: { 
        mode: 'index', 
        intersect: false,
        filter: function(tooltipItem) {
          // Hide tooltips for the shading layers
          return !tooltipItem.dataset.label.includes('Fill');
        },
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
      x: {
        title: { display: true, text: 'Year' },
        grid: {
          display: false,
        }
      },
      y: {
        title: { display: true, text: units || 'Billion Kilowatthours' },
        suggestedMax: yMax,
        grid: {
          color: 'rgba(0,0,0,0.05)',
          lineWidth: 1,
          display: true,
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: '600', color: '#475569' }}>Select Case:</label>
        <select
          value={selectedCase}
          onChange={e => setSelectedCase(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: '6px', 
            border: '1px solid #cbd5e1', 
            fontSize: '14px', 
            cursor: 'pointer', 
            minWidth: '150px' 
          }}
        >
          {cases.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {units && (
          <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
            Units: {units}
          </div>
        )}
      </div>
      <div style={{ height: '500px' }}>
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <p style={{ textAlign: 'center' }}>No data available</p>
        )}
      </div>
    </div>
  );
}
