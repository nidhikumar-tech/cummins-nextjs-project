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
  Filler
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

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA',
  'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX',
  'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function ElectricCapacityPredictionChart() {
  const [apiData, setApiData] = useState([]);
  const [selectedState, setSelectedState] = useState('CA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/electric-capacity-predictions?state=${selectedState}`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const cleanData = result.data.map(item => ({
            year: Number(item.year),
            actual: item.actual_capacity_mwh ? Number(item.actual_capacity_mwh) : null,
            predicted: item.predicted_capacity_mwh ? Number(item.predicted_capacity_mwh) : null,
            min: item.min_predicted_capacity_mwh ? Number(item.min_predicted_capacity_mwh) : null,
            max: item.max_predicted_capacity_mwh ? Number(item.max_predicted_capacity_mwh) : null,
          })).sort((a, b) => a.year - b.year);

          setApiData(cleanData);
        } else {
          setApiData([]);
        }
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedState]);


  const chartData = useMemo(() => {
    if (!apiData || apiData.length === 0) return null;

    const labels = apiData.map(d => d.year);
    const actuals = apiData.map(d => d.actual);
    const predicted = apiData.map(d => d.predicted);
    const minValues = apiData.map(d => d.min);
    const maxValues = apiData.map(d => d.max);

    return {
      labels,
      datasets: [
        //Min Bound (Bottom of the shadow)
        {
          label: 'Min Bound',
          data: minValues,
          borderColor: '#fca5a5', 
          backgroundColor: 'transparent',
          borderWidth: 1,         
          pointRadius: 0,
          tension: 0.3,
          spanGaps: true,
          fill: false,
          order: 3
        },
        //Max Bound (Top of the shadow + Fill)
        {
          label: 'Max Bound',
          data: maxValues,
          borderColor: '#fca5a5', 
          borderWidth: 1,         
          pointRadius: 0,
          tension: 0.3,
          spanGaps: true,
          fill: '-1', // Fill to Min Bound
          backgroundColor: 'rgba(252, 165, 165, 0.2)', 
          order: 3
        },
        //Predicted Capacity
        {
          label: 'Predicted Capacity',
          data: predicted,
          borderColor: '#dc2626', 
          backgroundColor: '#dc2626',
          borderDash: [5, 5], 
          tension: 0.3,
          pointRadius: 0, 
          pointHoverRadius: 5,
          spanGaps: true,
          fill: false,
          order: 2
        },
        //Actual Capacity
        {
          label: 'Actual Capacity',
          data: actuals,
          borderColor: '#2563eb', 
          backgroundColor: '#2563eb',
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
          spanGaps: true,
          fill: false,
          order: 1
        }
      ]
    };
  }, [apiData]);

  //Configure Options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750, 
      easing: 'easeOutQuart'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12 },
          filter: function(item) {
             return !item.text.includes('Bound');
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { 
                maximumFractionDigits: 0 
              }).format(context.parsed.y) + ' MWh';
            }
            return label;
          }
        }
      },
      title: {
        display: true,
        text: `Electric Capacity Forecast - ${selectedState}`,
        align: 'start',
        font: { size: 16, weight: 'bold' },
        color: '#1e293b',
        padding: { bottom: 20 }
      },
    },
    scales: {
      y: {
        type: 'linear', 
        beginAtZero: false,
        title: {
          display: true,
          text: 'Capacity (MWh)',
          color: '#64748b',
          font: { size: 12, weight: 600 }
        },
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          callback: function(value) {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
            return value;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Year',
          color: '#64748b',
          font: { size: 12, weight: 600 }
        },
        grid: { display: false },
        ticks: { color: '#64748b' }
      }
    },
  }), [selectedState]);

  return (
    <div style={{ width: '100%', height: '500px', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
      
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px' }}>
        
        {/* Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="state-select" style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>State:</label>
          <select
            id="state-select"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              backgroundColor: '#f8fafc',
              color: '#334155',
              cursor: 'pointer',
              minWidth: '80px',
              outline: 'none'
            }}
          >
            {US_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* Loading Indicator Second (Appears to the right of dropdown) */}
        {loading && apiData.length > 0 && (
          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
            Updating...
          </span>
        )}
      </div>

      {/* Chart Canvas */}
      <div style={{ height: '400px', width: '100%', position: 'relative' }}>
        {loading && apiData.length === 0 ? (
           <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
             Loading Forecast Data...
           </div>
        ) : error ? (
           <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
             {error}
           </div>
        ) : chartData ? (
           <Line data={chartData} options={options} /> 
        ) : (
           <div style={{textAlign: 'center', marginTop: '100px', color: '#94a3b8'}}>
             No data available
           </div>
        )}
      </div>
    </div>
  );
}