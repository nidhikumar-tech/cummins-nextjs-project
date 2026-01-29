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

const POLLUTANTS = [
  'Carbon Dioxide',
  'Nitrogen Oxides',
  'Particulate Matter'
];

// Standard US State Codes (50 States + DC)
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA',
  'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX',
  'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function EmissionBarGraph() {
  const [mode, setMode] = useState('cumulative');
  const [state, setState] = useState('');
  const [states, setStates] = useState([]);
  const [selectedPollutant, setSelectedPollutant] = useState('All');
  const [cumulativeData, setCumulativeData] = useState([]);
  const [statewiseData, setStatewiseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch both datasets on mount for smooth transitions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch both cumulative and statewise data in parallel
        const [cumulativeResponse, statewiseResponse] = await Promise.all([
          fetch('/api/emission-bar-graph'),
          fetch('/api/emission-bar-graph-statewise')
        ]);

        const [cumulativeResult, statewiseResult] = await Promise.all([
          cumulativeResponse.json(),
          statewiseResponse.json()
        ]);

        if (cumulativeResult.success && Array.isArray(cumulativeResult.data)) {
          setCumulativeData(cumulativeResult.data);
        }

        if (statewiseResult.success && Array.isArray(statewiseResult.data)) {
          setStatewiseData(statewiseResult.data);
          // Extract unique valid US states for dropdown
          const uniqueStates = [...new Set(statewiseResult.data.map(d => (d.State || d.state)))].filter(s => US_STATES.includes(s)).sort();
          setStates(uniqueStates);
          if (!state && uniqueStates.length > 0) setState(uniqueStates.includes('CA') ? 'CA' : uniqueStates[0]);
        }
      } catch (err) {
        setError('Failed to load emission data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare chart data using useMemo for smooth transitions
  const chartData = useMemo(() => {
    // Select data based on mode and state
    let dataToUse;
    if (mode === 'cumulative') {
      dataToUse = cumulativeData;
    } else {
      // Filter statewise data by selected state
      dataToUse = state ? statewiseData.filter(d => (d.State || d.state) === state) : statewiseData;
    }
    
    if (!dataToUse || dataToUse.length === 0) return null;
    
    const yearMap = {};
    dataToUse.forEach(row => {
      const year = row.Model_Year || row.model_year || row.year;
      const pollutant = (row.Pollutant_Name || row.pollutant_name || '').toLowerCase();
      if (!yearMap[year]) yearMap[year] = {};
      if (pollutant.includes('carbon')) yearMap[year]['Carbon Dioxide'] = Number(row.Emission_Cert_Status || row.emission_cert_status || 0);
      else if (pollutant.includes('nitrogen')) yearMap[year]['Nitrogen Oxides'] = Number(row.Emission_Cert_Status || row.emission_cert_status || 0);
      else if (pollutant.includes('particulate')) yearMap[year]['Particulate Matter'] = Number(row.Emission_Cert_Status || row.emission_cert_status || 0);
    });
    const years = Object.keys(yearMap).sort();
    
    // Filter pollutants based on selection
    const pollutantsToShow = selectedPollutant === 'All' ? POLLUTANTS : [selectedPollutant];
    
    return {
      labels: years,
      datasets: pollutantsToShow.map((pollutant) => {
        const idx = POLLUTANTS.indexOf(pollutant);
        return {
          label: pollutant,
          data: years.map(y => yearMap[y][pollutant] ?? 0),
          backgroundColor: [
            '#fb7185',
            '#22c55e',
            '#6366f1'
          ][idx],
          borderColor: '#facc15',
          borderWidth: 1,
          barPercentage: 1.0,
          categoryPercentage: 0.85,
        };
      })
    };
  }, [cumulativeData, statewiseData, mode, state, selectedPollutant]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      title: {
        display: true,
        text: 'Emissions by Year and Pollutant',
        align: 'start',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value?.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Emission Cert Status'
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
  }), []);

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: '600', color: '#475569' }}>Mode:</label>
        <select
          value={mode}
          onChange={e => setMode(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <option value="cumulative">Cumulative</option>
          <option value="statewise">Statewise</option>
        </select>
        {mode === 'statewise' && states.length > 0 && (
          <>
            <label style={{ fontWeight: '600', color: '#475569' }}>State:</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '100px'
              }}
            >
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        )}
        <label style={{ fontWeight: '600', color: '#475569' }}>Pollutant:</label>
        <select
          value={selectedPollutant}
          onChange={e => setSelectedPollutant(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <option value="All">All Pollutants</option>
          <option value="Carbon Dioxide">Carbon Dioxide</option>
          <option value="Nitrogen Oxides">Nitrogen Oxides</option>
          <option value="Particulate Matter">Particulate Matter</option>
        </select>
      </div>
      <div style={{ height: '400px', width: '100%' }}>
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading Emission Data...</div>}
        {error && <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>}
        {chartData && !loading && !error && <Bar data={chartData} options={options} />}
        {!chartData && !loading && !error && <p>No data available.</p>}
      </div>
    </div>
  );
}
