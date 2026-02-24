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

export default function ElectricityLineChart({
  label,
  borderColor = '#2563eb',
  backgroundColor = 'rgba(37, 99, 235, 0.1)',
  title = null,
  isSummaryView = false,
  // [CHANGE 1] Added allowSourceToggle prop
  allowSourceToggle = false 
}) {
  const [allData, setAllData] = useState([]);
  const [cumminsData, setCumminsData] = useState([]); // [CHANGE 2] State for Cummins data
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState('');
  const [source, setSource] = useState('eia'); // [CHANGE 3] State for the toggle dropdown
  const [units, setUnits] = useState('');

  // Fetch data on mount and when label changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch Default EIA data
        const eiaResponse = await fetch(`/api/electricity-line-plot?label=${encodeURIComponent(label)}`);
        const eiaResult = await eiaResponse.json();

        if (eiaResult.success && Array.isArray(eiaResult.data)) {
          setAllData(eiaResult.data);
          if (eiaResult.data.length > 0 && eiaResult.data[0].Units) {
            setUnits(eiaResult.data[0].Units);
          } else {
            setUnits('');
          }
        } else {
          setError(eiaResult.error || 'Failed to load EIA data');
          setAllData([]);
          setUnits('');
        }

        // [CHANGE 4] 2. Fetch Cummins data conditionally using the new API path
        if (allowSourceToggle) {
          const cumminsResponse = await fetch(`/api/electricity-sales`); 
          const cumminsResult = await cumminsResponse.json();
          if (cumminsResult.success && Array.isArray(cumminsResult.data)) {
            setCumminsData(cumminsResult.data);
          }
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
  }, [label, allowSourceToggle]);

  const cases = useMemo(() => {
    if (!allData || allData.length === 0) return [];
    const uniqueCases = [...new Set(allData.map(row => row.Case))].filter(Boolean);
    return [...uniqueCases];
  }, [allData]);

  useEffect(() => {
    if (cases.length > 0 && !selectedCase) {
      setSelectedCase(cases[Math.floor(Math.random() * cases.length)]);
    }
  }, [cases, selectedCase]);

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

  // [CHANGE 5] Handle rendering logic based on selected 'source'
  const chartData = useMemo(() => {
    // ---- CUMMINS LOGIC ----
    if (source === 'cummins') {
      if (!cumminsData || cumminsData.length === 0) return null;
      
      const sortedData = [...cumminsData].sort((a, b) => a.year - b.year);
      return {
        labels: sortedData.map(d => d.year.toString()),
        datasets: [{
          label: 'Cummins Predicted Total (BkWh)',
          data: sortedData.map(d => d.total !== null ? d.total : null),
          borderColor: '#10b981', // Distinct green color for Cummins
          backgroundColor: '#10b981',
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          spanGaps: true
        }]
      };
    }

    // ---- EIA LOGIC (Original) ----
    if (!allData || allData.length === 0) return null;

    const allYears = Array.from({ length: 28 }, (_, i) => 2023 + i);
    
    let filteredData;
    if (!selectedCase) {
      filteredData = allData;
    } else {
      filteredData = allData.filter(row => row.Case === selectedCase);
    }
    if (filteredData.length === 0) return null;

    const datasets = [];
    filteredData.forEach((row, rowIndex) => {
      const values = allYears.map(year => {
        const key = `year_${year}`;
        return row[key] !== null && row[key] !== undefined ? row[key] : null;
      });

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

      const datasetBorderColor = caseColorMap[row.Case] || borderColor;
      const shadingColor = hexToRgba(datasetBorderColor);
      const mainLineIndex = datasets.length;

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

      if (minIndex !== -1 && maxIndex !== -1) {
        const minPointData = Array(allYears.length).fill(null);
        minPointData[minIndex] = minVal;
        const maxPointData = Array(allYears.length).fill(null);
        maxPointData[maxIndex] = maxVal;
        const maxLineData = Array(allYears.length).fill(maxVal);
        const minLineData = Array(allYears.length).fill(minVal);

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

        datasets.push({
          label: `${row.Case || row.Label} Max Fill`,
          data: maxLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColor,
          fill: mainLineIndex,
          order: 2
        });

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
  }, [allData, selectedCase, caseColorMap, borderColor, source, cumminsData]);

  const yMax = useMemo(() => {
    if (!chartData || !chartData.datasets || !chartData.datasets.length) return undefined;
    let maxVal = 0;
    chartData.datasets.forEach(ds => {
      const dsMax = Math.max(...ds.data.filter(v => typeof v === 'number' && v !== null));
      if (dsMax > maxVal) maxVal = dsMax;
    });
    if (maxVal === 0) return undefined;
    const step = maxVal > 20 ? 10 : 5;
    return Math.ceil((maxVal + step) / step) * step;
  }, [chartData]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !isSummaryView,
        // Adjust legend position based on active source
        position: source === 'cummins' || selectedCase === 'All' ? 'bottom' : 'top',
        align: source === 'cummins' || selectedCase === 'All' ? 'center' : 'end',
        labels: {
          boxWidth: 16,
          font: { size: 12 },
          padding: 12,
          filter: function(item) {
            return !item.text.includes('Fill') && !item.text.endsWith(' Max') && !item.text.endsWith(' Min');
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
  }), [selectedCase, title, label, units, yMax, isSummaryView, source]);

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
    <div style={{ 
      background: 'white', 
      padding: isSummaryView ? '0px' : '20px', 
      borderRadius: '8px',
      width: '100%',
      height: '100%',
      display: isSummaryView ? 'flex' : 'block',
      flexDirection: isSummaryView ? 'column' : 'unset',
      minHeight: 0,
      minWidth: 0
    }}>
      
      {/* [CHANGE 6] Added Conditional Dropdowns for Source vs Case */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', flexShrink: 0 }}>
        
        {/* Source Toggle */}
        {allowSourceToggle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#475569' }}>Prediction Source:</label>
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="eia">EIA Predictions</option>
              <option value="cummins">Cummins Predictions</option>
            </select>
          </div>
        )}

        {/* Original Case Select (Hide if Cummins is selected) */}
        {source === 'eia' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          </div>
        )}

        {units && (
          <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
            Units: {units}
          </div>
        )}
      </div>

      <div style={isSummaryView ? { flexGrow: 1, minHeight: 0, position: 'relative' } : { height: '500px', width: '100%', position: 'relative' }}>
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <p style={{ textAlign: 'center', padding: '20px' }}>No data available for {label}.</p>
        )}
      </div>
    </div>
  );
}