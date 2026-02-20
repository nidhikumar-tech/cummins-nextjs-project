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

// Helper: convert hex color to rgba with given alpha
const hexToRgba = (hex, alpha = 0.15) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(99, 102, 241, ${alpha})`;
};

export default function CNGLineChart({
  label,
  borderColor = '#10b981',
  backgroundColor = 'rgba(16, 185, 129, 0.1)',
  title = null,
  isSummaryView = false
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
        const response = await fetch(`/api/cng-line-plot?label=${encodeURIComponent(label)}`);
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
        console.error('Error fetching CNG line plot data:', err);
        setError('Failed to load CNG line plot data');
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
    return [...uniqueCases];
  }, [allData]);

  // Set default selectedCase randomly if not set
  useEffect(() => {
    if (cases.length > 0 && !selectedCase) {
      setSelectedCase(cases[Math.floor(Math.random() * cases.length)]);
    }
  }, [cases, selectedCase]);

  // Define color mapping for cases (consistent colors)
  const caseColorMap = useMemo(() => {
    if (!allData || allData.length === 0) return {};
    const uniqueCases = [...new Set(allData.map(row => row.Case))].filter(Boolean);
    const colors = ['#10b981', '#f59e0b', '#2563eb', '#fb7185', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
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
    if (!selectedCase) {
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

      // Find min and max across entire dataset (not just a portion)
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
      const shadingColor = hexToRgba(datasetBorderColor);

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
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: true,
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

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !isSummaryView,
        position: 'top',
        align: 'end',
        labels: {
          filter: function(item) {
            // Hide fill datasets and min/max legend labels (bubbles stay on chart)
            return !item.text.includes('Fill') && !item.text.endsWith(' Max') && !item.text.endsWith(' Min');
          }
        }
      },
      title: {
        display: true,
        text: title || label,
        align: 'start',
        font: { size: 16 }
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
            return `${label}: ${value !== null ? value.toLocaleString() : 'N/A'}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: units || ''
        },
        ticks: {
          callback: function (value) {
            return value.toLocaleString();
          }
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
  }), [title, label, units, selectedCase]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      padding: isSummaryView ? '0px' : '20px', 
      background: 'white', 
      borderRadius: '8px',
      display: isSummaryView ? 'flex' : 'block',
      flexDirection: isSummaryView ? 'column' : 'unset'
    }}>
      {/* Case Filter */}
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
            minWidth: '150px'
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

      {/* Chart */}
      <div style={isSummaryView ? { flexGrow: 1, width: '100%', minHeight: 0, position: 'relative' } : { height: '500px', width: '100%', position: 'relative' }}>
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading Chart Data...</div>}
        {error && <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>}
        {chartData && !loading && !error && <Line data={chartData} options={options} />}
        {!chartData && !loading && !error && <p style={{ textAlign: 'center', padding: '20px' }}>No data available.</p>}
      </div>
    </div>
  );
}