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

export default function CNGNetImportBarChart() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState('');
  const [units, setUnits] = useState('');

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Try multiple possible label names
      const possibleLabels = ['Net Import', 'Net Imports', 'Import', 'Imports'];
      
      for (const labelName of possibleLabels) {
        try {
          const response = await fetch(`/api/cng-bar-graph?label=${encodeURIComponent(labelName)}`);
          const result = await response.json();

          console.log(`Trying label "${labelName}":`, result);
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            console.log('Net Import Data found with label:', labelName, result.data);
            const subLabels = [...new Set(result.data.map(row => row.Sub_Label))];
            console.log('Net Import Sub-Labels:', subLabels);
            setAllData(result.data);
            if (result.data.length > 0 && result.data[0].Units) {
              setUnits(result.data[0].Units);
            }
            setLoading(false);
            return; // Found data, exit
          }
        } catch (err) {
          console.error(`Error fetching with label "${labelName}":`, err);
        }
      }
      
      // If we get here, no label worked
      console.error('No data found for any Net Import label variations');
      setError('No data found for Net Import');
      setAllData([]);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Get unique cases from data
  const cases = useMemo(() => {
    if (!allData || allData.length === 0) return [];
    const uniqueCases = [...new Set(allData.map(row => row.Case))].filter(Boolean);
    return ['All', ...uniqueCases];
  }, [allData]);

  // Set default selectedCase randomly (not 'All')
  useEffect(() => {
    if (cases.length > 1 && !selectedCase) {
      const randomIndex = Math.floor(Math.random() * (cases.length - 1)) + 1;
      setSelectedCase(cases[randomIndex]);
    }
  }, [cases, selectedCase]);

  // Process data for chart
  const chartData = useMemo(() => {
    if (!allData || allData.length === 0) return null;

    const allYears = Array.from({ length: 28 }, (_, i) => 2023 + i);
    
    let filteredData;
    if (selectedCase === 'All' || !selectedCase) {
      filteredData = allData;
    } else {
      filteredData = allData.filter(row => row.Case === selectedCase);
    }
    
    if (filteredData.length === 0) return null;

    // Group by Sub_Label
    const subLabelGroups = {};
    filteredData.forEach(row => {
      const subLabel = row.Sub_Label;
      if (!subLabelGroups[subLabel]) {
        subLabelGroups[subLabel] = [];
      }
      subLabelGroups[subLabel].push(row);
    });

    // Define vibrant colors for each Sub_Label (year)
    const vibrantColors = [
      '#f59e0b', // amber
      '#f97316', // orange
      '#84cc16', // lime
      '#e11d48', // pink
      '#6366f1', // indigo
      '#10b981', // green
      '#3b82f6', // blue
      '#a21caf', // purple
      '#d97706', // yellow
      '#dc2626', // red
      '#0ea5e9', // sky
      '#f43f5e', // rose
      '#14b8a6', // teal
      '#eab308', // gold
      '#fb7185', // light pink
      '#7c3aed', // violet
      '#22d3ee', // cyan
      '#facc15', // light yellow
      '#a3e635', // light lime
      '#f87171', // light red
      '#38bdf8', // light blue
      '#c026d3', // fuchsia
      '#fbbf24', // light amber
      '#fda4af', // light rose
      '#fef08a', // pale yellow
      '#bbf7d0', // mint
      '#fcd34d', // gold
      '#fde68a', // pale gold
    ];

    const datasets = Object.keys(subLabelGroups).map(subLabel => {
      const rows = subLabelGroups[subLabel];
      
      const values = allYears.map(year => {
        const key = `year_${year}`;
        const sum = rows.reduce((acc, row) => {
          const value = row[key];
          return acc + (value !== null && value !== undefined ? value : 0);
        }, 0);
        return sum;
      });

      // Assign a distinct vibrant color for each subLabel (if multiple subLabels)
      const colorIdx = Object.keys(subLabelGroups).indexOf(subLabel) % vibrantColors.length;
      return {
        label: subLabel,
        data: values,
        backgroundColor: vibrantColors[colorIdx],
        borderColor: vibrantColors[colorIdx],
        borderWidth: 1,
      };
    });

    return {
      labels: allYears.map(y => y.toString()),
      datasets: datasets,
    };
  }, [allData, selectedCase]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'CNG Net Import (2023-2050)',
        align: 'start',
        font: { size: 16 },
        padding: { bottom: 25 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Year'
        },
        grid: { display: false }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: units || ''
        },
        ticks: {
          callback: function (value) {
            return value.toLocaleString();
          }
        }
      }
    }
  }), [units]);

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
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

      <div style={{ height: '500px', width: '100%' }}>
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading Chart Data...</div>}
        {error && <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>}
        {chartData && !loading && !error && <Bar data={chartData} options={options} />}
        {!chartData && !loading && !error && <p style={{ textAlign: 'center', padding: '20px' }}>No data available.</p>}
      </div>
    </div>
  );
}
