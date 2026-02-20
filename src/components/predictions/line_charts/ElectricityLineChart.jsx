"use client";

import React, { useState, useEffect, useMemo } from 'react';
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

export default function ElectricityLineChart({
  label,
  borderColor = '#2563eb',
  backgroundColor = 'rgba(37, 99, 235, 0.1)',
  title = null
}) {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState('');
  const [units, setUnits] = useState('');

  // Fetch data on mount and when label changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/electricity-line-plot?label=${encodeURIComponent(label)}`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setAllData(result.data);
          // Extract units from first row if available
          if (result.data.length > 0 && result.data[0].Units) {
            setUnits(result.data[0].Units);
          } else {
            setUnits('');
          }
        } else {
          setError(result.error || 'Failed to load data');
          setAllData([]);
          setUnits('');
        }
      } catch (err) {
        console.error('Error fetching electricity line plot data:', err);
        setError('Failed to load electricity line plot data');
        setAllData([]);
        setUnits('');
      } finally {
        setLoading(false);
      }
    };

    if (label) {
      fetchData();
    }
  }, [label]);

  // Get unique cases from data and create color mapping
  const cases = useMemo(() => {
    if (!allData || allData.length === 0) return [];
    const uniqueCases = [...new Set(allData.map(row => row.Case))].filter(Boolean);
    return ['All', ...uniqueCases];
  }, [allData]);

  // Set default selectedCase randomly (not 'All') if not set
  useEffect(() => {
    if (cases.length > 1 && !selectedCase) {
      // Exclude 'All' from random selection
      const randomIndex = Math.floor(Math.random() * (cases.length - 1)) + 1;
      setSelectedCase(cases[randomIndex]);
    }
  }, [cases, selectedCase]);

  // Define color mapping for cases (consistent colors)
  const caseColorMap = useMemo(() => {
    if (!allData || allData.length === 0) return {};
    const uniqueCases = [...new Set(allData.map(row => row.Case))].filter(Boolean);
    const colors = ['#2563eb', '#f59e0b', '#10b981', '#fb7185', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
    const colorMap = {};
    uniqueCases.forEach((caseName, index) => {
      colorMap[caseName] = colors[index % colors.length];
    });
    return colorMap;
  }, [allData]);

  // Process data for chart (filter by selected case)
  const chartData = useMemo(() => {
    if (!allData || allData.length === 0) return null;

    // Years from 2023 to 2050
    const allYears = Array.from({ length: 28 }, (_, i) => 2023 + i);
    
    // Filter data by selected case
    let filteredData;
    if (selectedCase === 'All' || !selectedCase) {
      filteredData = allData;
    } else {
      filteredData = allData.filter(row => row.Case === selectedCase);
    }
    if (filteredData.length === 0) return null;

    // Define shading colors for multiple lines
    const shadingColors = [
      'rgba(220, 38, 38, 0.1)',   // Light red
      'rgba(37, 99, 235, 0.1)',   // Light blue
      'rgba(16, 185, 129, 0.1)',  // Light green
      'rgba(251, 113, 133, 0.1)', // Light pink
      'rgba(139, 92, 246, 0.1)',  // Light purple
      'rgba(6, 182, 212, 0.1)',   // Light cyan
    ];

    // Extract data from rows and calculate min/max for each line
    const datasets = [];
    filteredData.forEach((row, rowIndex) => {
      const values = allYears.map(year => {
        const key = `year_${year}`;
        return row[key] !== null && row[key] !== undefined ? row[key] : null;
      });

      // Find min and max across entire dataset
      let minVal = Infinity;
      let maxVal = -Infinity;
      let minIndex = -1;
      let maxIndex = -1;

      values.forEach((val, index) => {
        if (val !== null && val !== undefined) {
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

      // Use consistent colors from color map
      const datasetBorderColor = caseColorMap[row.Case] || borderColor;
      const shadingColor = shadingColors[rowIndex % shadingColors.length];

      // Track the index of the main line before pushing
      const mainLineIndex = datasets.length;

      // Main line dataset
      datasets.push({
        label: row.Case || row.Label,
        data: values,
        borderColor: datasetBorderColor,
        backgroundColor: datasetBorderColor,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: true,
        segment: {
          borderDash: ctx => values[ctx.p0DataIndex] === 0 ? [6, 6] : [],
        },
        order: 1
      });

      // Min/Max points and shading (only if valid min/max found)
      if (minIndex !== -1 && maxIndex !== -1) {
        // Create sparse arrays for min and max points
        const minPointData = Array(allYears.length).fill(null);
        minPointData[minIndex] = minVal;

        const maxPointData = Array(allYears.length).fill(null);
        maxPointData[maxIndex] = maxVal;

        // Create constant arrays for shading
        const maxLineData = Array(allYears.length).fill(maxVal);
        const minLineData = Array(allYears.length).fill(minVal);

        // Max point
        datasets.push({
          label: `${row.Case || row.Label} Max`,
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

        // Min point
        datasets.push({
          label: `${row.Case || row.Label} Min`,
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

        // Shading - fill between max and the main line
        datasets.push({
          label: `${row.Case || row.Label} Max Fill`,
          data: maxLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColor,
          fill: mainLineIndex,
          order: 2
        });

        // Shading - fill between min and the main line
        datasets.push({
          label: `${row.Case || row.Label} Min Fill`,
          data: minLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColor,
          fill: mainLineIndex,
          order: 2
        });
      }
    });

    return {
      labels: allYears.map(y => y.toString()),
      datasets: datasets,
    };
  }, [allData, selectedCase, caseColorMap, borderColor]);

  // Calculate y-axis max for padding
  const yMax = useMemo(() => {
    if (!chartData || !chartData.datasets || !chartData.datasets.length) return undefined;
    let maxVal = 0;
    chartData.datasets.forEach(ds => {
      const dsMax = Math.max(...ds.data.filter(v => typeof v === 'number' && v !== null));
      if (dsMax > maxVal) maxVal = dsMax;
    });
    if (maxVal === 0) return undefined;
    // Round up to nearest 5 or 10
    const step = maxVal > 20 ? 10 : 5;
    return Math.ceil((maxVal + step) / step) * step;
  }, [chartData]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: selectedCase === 'All' ? 'bottom' : 'top',
        align: selectedCase === 'All' ? 'center' : 'end',
        labels: {
          boxWidth: 16,
          font: { size: 12 },
          padding: 12,
          filter: function(item) {
            // Only show main lines and min/max points, hide fill datasets
            return !item.text.includes('Fill');
          }
        }
      },
      title: {
        display: true,
        text: title || `${label} - Commercial Sector (2023-2050)`,
        align: 'start',
        font: { size: 16 },
        padding: { bottom: 25 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        filter: function(tooltipItem) {
          // Hide tooltips for the shading layers
          return !tooltipItem.dataset.label.includes('Fill');
        },
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value !== null ? value.toLocaleString() : 'N/A'} ${units}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year'
        },
        grid: {
          display: false
        }
      },
      y: {
        title: {
          display: true,
          text: units || ''
        },
        grid: {
          color: 'rgba(0,0,0,0.05)',
          lineWidth: 1,
          display: true,
        },
        suggestedMax: yMax,
        ticks: {
          callback: function (value) {
            return value.toLocaleString();
          }
        }
      }
    }
  }), [selectedCase, title, label, units, yMax]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        background: 'white',
        borderRadius: '8px',
        padding: '20px'
      }}>
        Loading Chart Data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        color: '#ef4444'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <label htmlFor="case-select" style={{ fontWeight: '600', color: '#475569' }}>Select Case:</label>
        <select
          id="case-select"
          value={selectedCase}
          onChange={e => setSelectedCase(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '200px'
          }}
        >
          {cases.map(caseOption => (
            <option key={caseOption} value={caseOption}>{caseOption}</option>
          ))}
        </select>
        {units && (
          <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
            Units: {units}
          </div>
        )}
      </div>

      <div style={{ height: '500px', width: '100%' }}>
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <p style={{ textAlign: 'center', padding: '20px' }}>No data available for {label}.</p>
        )}
      </div>
    </div>
  );
}
