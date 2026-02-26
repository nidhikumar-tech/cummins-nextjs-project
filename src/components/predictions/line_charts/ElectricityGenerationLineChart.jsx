"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ElectricityGenerationLineChart({ isSummaryView = false }) {
  // EIA State
  const [eiaData, setEiaData] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  
  // Cummins State
  const [cumminsData, setCumminsData] = useState({ generation: [], capacity: [], demand: [] });
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  
  // Shared State
  const [source, setSource] = useState('eia'); // 'eia' or 'cummins'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eiaRes, cumminsRes] = await Promise.all([
          fetch('/api/electricity-generation-line-plot').then(res => res.json()),
          fetch('/api/electricity-statewise').then(res => res.json())
        ]);

        // Process EIA
        if (eiaRes.success && eiaRes.data) {
          setEiaData(eiaRes.data);
        }

        // Process Cummins
        if (cumminsRes.success && cumminsRes.data) {
          setCumminsData(cumminsRes.data);
          // Extract unique states from the generation array
          const uniqueStates = [...new Set(cumminsRes.data.generation.map(d => d.state))].filter(Boolean).sort();
          setStates(uniqueStates);
          if (uniqueStates.length > 0) {
            setSelectedState(uniqueStates.includes('CA') ? 'CA' : uniqueStates[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching electricity data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const cases = useMemo(() => {
    if (!eiaData.length) return [];
    return [...new Set(eiaData.map(r => r.Case))].filter(Boolean);
  }, [eiaData]);

  useEffect(() => {
    if (cases.length > 0 && !selectedCase) {
      setSelectedCase(cases[Math.floor(Math.random() * cases.length)]);
    }
  }, [cases, selectedCase]);

  const chartData = useMemo(() => {
    const allYears = Array.from({ length: 28 }, (_, i) => 2023 + i);

    // ================= CUMMINS LOGIC =================
    if (source === 'cummins') {
      if (!cumminsData.generation.length || !selectedState) return null;

      const filterByState = (dataArray) => {
        return dataArray.filter(d => d.state === selectedState).sort((a, b) => a.year - b.year);
      };

      const genStateData = filterByState(cumminsData.generation);
      const capStateData = filterByState(cumminsData.capacity);
      const demStateData = filterByState(cumminsData.demand);

      if (!genStateData.length && !capStateData.length && !demStateData.length) return null;

      // Extract values by mapping over allYears to ensure continuous timelines
      const extractData = (dataArray, key) => allYears.map(year => {
        const found = dataArray.find(d => d.year === year);
        return found && found[key] !== null ? found[key] : null;
      });

      return {
        labels: allYears.map(y => y.toString()),
        datasets: [
          // Generation
          {
            label: 'Actual Generation',
            data: extractData(genStateData, 'actual'),
            borderColor: '#3b82f6', backgroundColor: '#3b82f6', // Blue
            tension: 0.3, pointRadius: 3, spanGaps: false
          },
          {
            label: 'Predicted Generation',
            data: extractData(genStateData, 'predicted'),
            borderColor: '#3b82f6', backgroundColor: '#3b82f6',
            borderDash: [5, 5], tension: 0.3, pointRadius: 3, spanGaps: false
          },
          // Capacity
          {
            label: 'Actual Capacity',
            data: extractData(capStateData, 'actual'),
            borderColor: '#10b981', backgroundColor: '#10b981', // Green
            tension: 0.3, pointRadius: 3, spanGaps: false
          },
          {
            label: 'Predicted Capacity',
            data: extractData(capStateData, 'predicted'),
            borderColor: '#10b981', backgroundColor: '#10b981',
            borderDash: [5, 5], tension: 0.3, pointRadius: 3, spanGaps: false
          },
          // Demand
          {
            label: 'Actual Demand',
            data: extractData(demStateData, 'actual'),
            borderColor: '#f59e0b', backgroundColor: '#f59e0b', // Amber
            tension: 0.3, pointRadius: 3, spanGaps: false
          },
          {
            label: 'Predicted Demand',
            data: extractData(demStateData, 'predicted'),
            borderColor: '#f59e0b', backgroundColor: '#f59e0b',
            borderDash: [5, 5], tension: 0.3, pointRadius: 3, spanGaps: false
          }
        ]
      };
    }

    // ================= EIA LOGIC (Original) =================
    if (!eiaData.length) return null;
    const filtered = eiaData.filter(r => r.Case === selectedCase);
    if (!filtered.length) return null;

    const labels = [
      'Total Net Electricity Generation',
      'Net Available to the Grid',
      'Net Generation to the Grid',
      'Total Use From Grid'
    ];

    const colors = {
      'Total Net Electricity Generation': '#3b82f6',
      'Net Available to the Grid': '#10b981',
      'Net Generation to the Grid': '#f59e0b',
      'Total Use From Grid': '#8b5cf6'
    };

    const shadingColors = {
      'Total Net Electricity Generation': 'rgba(59, 130, 246, 0.15)',
      'Net Available to the Grid':        'rgba(16, 185, 129, 0.15)',
      'Net Generation to the Grid':       'rgba(245, 158, 11, 0.15)',
      'Total Use From Grid':              'rgba(139, 92, 246, 0.15)'
    };

    const datasets = [];
    labels.forEach((label) => {
      const rows = filtered.filter(r => r.Label === label);
      if (rows.length === 0) return;

      const values = allYears.map(year => {
        const key = `year_${year}`;
        return rows.reduce((sum, row) => sum + (row[key] || 0), 0);
      });

      let minVal = Infinity; let maxVal = -Infinity;
      let minIndex = -1; let maxIndex = -1;

      values.forEach((val, index) => {
        if (val !== null && val !== undefined && val !== 0) {
          if (val < minVal) { minVal = val; minIndex = index; }
          if (val > maxVal) { maxVal = val; maxIndex = index; }
        }
      });

      const mainLineIndex = datasets.length;

      datasets.push({
        label: label,
        data: values,
        borderColor: colors[label] || '#6b7280',
        backgroundColor: colors[label] || '#6b7280',
        tension: 0.3,
        pointRadius: 3,
        segment: { borderDash: ctx => values[ctx.p0DataIndex] === 0 ? [6, 6] : [] },
        order: 1
      });

      if (minIndex !== -1 && maxIndex !== -1) {
        const minPointData = Array(allYears.length).fill(null); minPointData[minIndex] = minVal;
        const maxPointData = Array(allYears.length).fill(null); maxPointData[maxIndex] = maxVal;
        const maxLineData = Array(allYears.length).fill(maxVal);
        const minLineData = Array(allYears.length).fill(minVal);

        datasets.push({ label: `${label} Max`, data: maxPointData, borderColor: '#16a34a', backgroundColor: '#22c55e', pointStyle: 'circle', pointRadius: 10, pointHoverRadius: 12, borderWidth: 3, showLine: false, order: 0 });
        datasets.push({ label: `${label} Min`, data: minPointData, borderColor: '#ea580c', backgroundColor: '#f97316', pointStyle: 'circle', pointRadius: 10, pointHoverRadius: 12, borderWidth: 3, showLine: false, order: 0 });
        datasets.push({ label: `${label} Max Fill`, data: maxLineData, borderColor: 'transparent', pointRadius: 0, backgroundColor: shadingColors[label] || 'rgba(99, 102, 241, 0.15)', fill: mainLineIndex, order: 2 });
        datasets.push({ label: `${label} Min Fill`, data: minLineData, borderColor: 'transparent', pointRadius: 0, backgroundColor: shadingColors[label] || 'rgba(99, 102, 241, 0.15)', fill: mainLineIndex, order: 2 });
      }
    });

    return { labels: allYears.map(y => y.toString()), datasets };
  }, [eiaData, cumminsData, selectedCase, source, selectedState]);

  const yMax = useMemo(() => {
    if (!chartData || !chartData.datasets.length) return undefined;
    const allValues = chartData.datasets.flatMap(ds => ds.data.filter(v => v !== null));
    if (allValues.length === 0) return undefined;
    const maxVal = Math.max(...allValues);
    if (maxVal === 0) return undefined;
    
    const step = Math.pow(10, Math.floor(Math.log10(maxVal)));
    return Math.ceil((maxVal + step) / step) * step;
  }, [chartData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { 
        display: true, 
        text: source === 'cummins' ? `Cummins Generation, Capacity & Demand - ${selectedState}` : 'Electricity Generation & Grid Usage (2023-2050)', 
        align: 'start', 
        font: { size: 16 }, 
        padding: { bottom: 25 } 
      },
      legend: {
        display: !isSummaryView,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 16,
          font: { size: 12 },
          padding: 12,
          filter: function(item) {
            return !item.text.includes('Fill') && !item.text.endsWith(' Max') && !item.text.endsWith(' Min');
          }
        }
      },
      tooltip: { 
        mode: 'index', 
        intersect: false,
        filter: function(tooltipItem) {
          return !tooltipItem.dataset.label.includes('Fill');
        },
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const unitString = source === 'cummins' ? 'MWh' : 'Billion KWh';
            return `${label}: ${value !== null ? value.toLocaleString() : 'N/A'} ${unitString}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Year' },
        grid: { display: false }
      },
      y: {
        title: { display: true, text: source === 'cummins' ? 'Megawatt Hours (MWh)' : 'Billion KWh' },
        suggestedMax: yMax,
        beginAtZero: true,
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

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', background: 'white', borderRadius: '8px' }}>Loading Chart Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', background: 'white', borderRadius: '8px' }}>{error}</div>;

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
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', flexShrink: 0 }}>
        
        {/* Source Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: '600', color: '#475569' }}>Prediction Source:</label>
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', cursor: 'pointer' }}
          >
            <option value="eia">EIA Predictions</option>
            <option value="cummins">Cummins Predictions</option>
          </select>
        </div>

        {/* EIA Case Dropdown */}
        {source === 'eia' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#475569' }}>Select Case:</label>
            <select
              value={selectedCase}
              onChange={e => setSelectedCase(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', cursor: 'pointer', minWidth: '150px' }}
            >
              {cases.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Cummins State Dropdown */}
        {source === 'cummins' && states.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#475569' }}>State:</label>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', cursor: 'pointer', minWidth: '100px' }}
            >
              {states.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
          </div>
        )}

        {/* Unit Helper Text */}
        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
          Units: {source === 'cummins' ? 'MWh' : 'Billion KWh'}
        </div>
      </div>

      {/* Chart */}
      <div style={isSummaryView ? { flexGrow: 1, minHeight: 0, position: 'relative' } : { height: '500px', position: 'relative' }}>
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <p style={{ textAlign: 'center', paddingTop: '20px' }}>No data available for the selected configuration.</p>
        )}
      </div>
    </div>
  );
}