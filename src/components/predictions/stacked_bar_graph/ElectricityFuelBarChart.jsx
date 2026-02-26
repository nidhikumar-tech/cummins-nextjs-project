"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// [CHANGE 1] Added isSummaryView prop
export default function ElectricityFuelBarChart({ isSummaryView = false }) {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState('');
  const [units, setUnits] = useState('');

  useEffect(() => {
    fetch('/api/electricity-fuel-bar-graph')
      .then(res => res.json())
      .then(data => {
        console.log('Electricity Fuel Bar Data:', data.length);
        setAllData(data);
        if (data.length > 0 && data[0].Units) setUnits(data[0].Units);
      })
      .catch(err => console.error('Error fetching electricity fuel data:', err))
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

  const data = useMemo(() => {
    if (!allData.length) return null;

    const years = Array.from({ length: 28 }, (_, i) => 2023 + i);
    const filtered = selectedCase === 'All' ? allData : allData.filter(r => r.Case === selectedCase);
    if (!filtered.length) return null;

    // Group by Fuel
    const fuelTypes = [...new Set(filtered.map(r => r.Fuel))].sort();
    
    // Vibrant distinct colors for each fuel type
    const fuelColors = {
      'Coal': '#1e293b',                    // Dark slate
      'Petroleum': '#f59e0b',               // Amber
      'Natural Gas': '#3b82f6',             // Blue
      'Nuclear Power': '#8b5cf6',           // Purple
      'Renewable Sources': '#10b981',       // Green
      'Hydrogen': '#06b6d4',                // Cyan
      'Other': '#ef4444'                    // Red
    };

    const datasets = fuelTypes.map(fuel => {
      const rows = filtered.filter(r => r.Fuel === fuel);
      const values = years.map(year => {
        const key = `year_${year}`;
        return rows.reduce((sum, row) => sum + (row[key] || 0), 0);
      });
      
      return {
        label: fuel,
        data: values,
        backgroundColor: fuelColors[fuel] || '#6b7280',
        stack: 'electricity'
      };
    });

    return { labels: years.map(y => y.toString()), datasets };
  }, [allData, selectedCase]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { 
        display: true, 
        text: 'Total Net Electricity Generation by Fuel (2023-2050)', 
        align: 'start', 
        font: { size: 16 }, 
        padding: { bottom: 25 } 
      },
      legend: { 
        // [CHANGE 2] Hide legend in summary view
        display: !isSummaryView,
        position: 'bottom', 
        labels: { boxWidth: 12, font: { size: 11 }, padding: 10 },
        align: 'center'
      },
      tooltip: { 
        mode: 'index', 
        intersect: false,
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
        stacked: true, 
        title: { display: true, text: 'Year' }, 
        grid: { display: false }
      },
      y: { 
        stacked: true, 
        title: { display: true, text: units || 'Billion Kilowatthours' },
        grid: {
          color: ctx => ctx.tick.value === 0 ? '#000' : 'rgba(0,0,0,0.1)',
          lineWidth: ctx => ctx.tick.value === 0 ? 2 : 1,
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
    // [CHANGE 3] Dynamic wrapper styling for summary view
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
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
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
      {/* [CHANGE 4] Dynamic chart container styling */}
      <div style={isSummaryView ? { flexGrow: 1, minHeight: 0, position: 'relative' } : { height: '600px', position: 'relative' }}>
        {data ? (
          <Bar data={data} options={options} />
        ) : (
          <p style={{ textAlign: 'center' }}>No data available</p>
        )}
      </div>
    </div>
  );
}