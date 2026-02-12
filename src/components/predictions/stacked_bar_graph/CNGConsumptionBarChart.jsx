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

export default function CNGConsumptionBarChart() {
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

      try {
        const response = await fetch(`/api/cng-bar-graph?label=${encodeURIComponent('Consumption by Sector')}`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          console.log('Consumption Data:', result.data);
          const subLabels = [...new Set(result.data.map(row => row.Sub_Label))];
          console.log('Consumption Sub-Labels:', subLabels);
          console.log('Consumption Sub-Label names:', subLabels);
          setAllData(result.data);
          if (result.data.length > 0 && result.data[0].Units) {
            setUnits(result.data[0].Units);
          }
        } else {
          setError(result.error || 'Failed to load data');
          setAllData([]);
        }
      } catch (err) {
        console.error('Error fetching CNG consumption data:', err);
        setError('Failed to load CNG consumption data');
        setAllData([]);
      } finally {
        setLoading(false);
      }
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

    // Define colors for consumption sectors (based on reference images)
    const colorMap = {
      'Residential': '#fe2c54',
      'Commercial': '#0891b2',
      'Industrial': '#7c3aed',
      'Transportation': '#2563eb',
      'Electric Power': '#da1884',
    };

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

      return {
        label: subLabel,
        data: values,
        backgroundColor: colorMap[subLabel] || '#64748b',
        borderColor: colorMap[subLabel] || '#64748b',
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
        text: 'CNG Consumption by Sector (2023-2050)',
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
