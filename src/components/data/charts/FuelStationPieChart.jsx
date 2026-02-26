"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Standard US State Codes (50 States + DC)
const US_STATES = [
  'ALL', // Add 'All States' option
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA',
  'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX',
  'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Default color scheme for different concentration types (6 distinct colors)
const DEFAULT_CONCENTRATION_COLORS = {
  'Highly Concentrated Locally truck': '#facc15',      // Yellow
  'Highly Concentrated Locally bus': '#fb7185',        // Pink/Red
  'Substantially Locally Focused truck': '#60a5fa',    // Blue
  'Substantially Locally Focused bus': '#5220e9',      // Purple
  'National truck': '#34d399',                         // Green
  'National bus': '#f97316',                           // Orange
};

const DEFAULT_COLOR = '#94a3b8'; // Gray for unknown types

export default function FuelStationPieChart({ colors = DEFAULT_CONCENTRATION_COLORS, isSummaryView = false, defaultFuelType = 'cng' }) {
  const [fuelType, setFuelType] = useState(defaultFuelType);
  const [state, setState] = useState('ALL');
  const [year, setYear] = useState('2022');
  const [allData, setAllData] = useState([]); // Store all states data
  const [stationCounts, setStationCounts] = useState([]); // Fuel station counts per state/year
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use provided colors or default colors
  const CONCENTRATION_COLORS = { ...DEFAULT_CONCENTRATION_COLORS, ...colors };

  // Generate years from 2010 to 2025
  const years = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => (2010 + i).toString());
  }, []);

  // Fetch ALL data once per fuelType (all years, all states)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch concentration data and station counts in parallel
        const [concResponse, countResponse] = await Promise.all([
          fetch(`/api/fuel-station-concentration?year=all&state=ALL&fuelType=${fuelType}`),
          fetch(`/api/fuel-station-concentration/count?fuelType=${fuelType}`)
        ]);
        const [concResult, countResult] = await Promise.all([
          concResponse.json(),
          countResponse.json()
        ]);

        if (concResult.success && Array.isArray(concResult.data)) {
          setAllData(concResult.data);
        } else {
          setError(concResult.error || 'Failed to load data');
          setAllData([]);
        }

        if (countResult.success && Array.isArray(countResult.data)) {
          setStationCounts(countResult.data);
        } else {
          setStationCounts([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load fuel station concentration data');
        setAllData([]);
        setStationCounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fuelType]);

  const filteredData = useMemo(() => {
    if (!allData || allData.length === 0) return [];
    
    const yearFiltered = allData.filter(item => String(item.year) === String(year));
    
    if (state === 'ALL') {
      const aggregated = {};
      yearFiltered.forEach(item => {
        const key = item.concentrationVehicleType;
        if (!aggregated[key]) {
          aggregated[key] = {
            year: item.year,
            state: 'ALL',
            fuelType: item.fuelType,
            concentrationVehicleType: key,
            totalVin: 0,
            fuelStationCount: 0
          };
        }
        aggregated[key].totalVin += item.totalVin || 0;
        aggregated[key].fuelStationCount += item.fuelStationCount || 0;
      });
      return Object.values(aggregated);
    }
    
    const stateData = yearFiltered.filter(item => item.state?.toUpperCase() === state.toUpperCase());
    return stateData;
  }, [allData, state, year]);

  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    const labels = filteredData.map(d => d.concentrationVehicleType);
    const values = filteredData.map(d => d.totalVin);
    const colors = filteredData.map(d => CONCENTRATION_COLORS[d.concentrationVehicleType] || DEFAULT_COLOR);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Number of Vehicles',
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(c => c),
          borderWidth: 2,
        }
      ]
    };
  }, [filteredData, CONCENTRATION_COLORS]);

  // Calculate fuel station count from the separate count API data
  const totalStations = useMemo(() => {
    if (!stationCounts || stationCounts.length === 0) return 0;
    // Filter counts for the selected year
    const yearCounts = stationCounts.filter(item => String(item.year) === String(year));
    if (state === 'ALL') {
      // Sum across all states for the selected year
      return yearCounts.reduce((sum, item) => sum + (item.totalFuelStationCount || 0), 0);
    }
    // Find count for the specific state
    const match = yearCounts.find(item => item.state?.toUpperCase() === state.toUpperCase());
    return match ? match.totalFuelStationCount : 0;
  }, [stationCounts, year, state]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !isSummaryView,
        position: 'right',
        labels: {
          font: { size: 12 },
          padding: 15,
          boxWidth: 15,
        }
      },
      title: {
        display: true,
        text: `Fuel Station Count: ${totalStations.toLocaleString()}`,
        align: 'end',
        font: { size: 16, weight: 'bold' },
        padding: { bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  }), [totalStations, isSummaryView]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      padding: isSummaryView ? '0px' : '20px', 
      background: 'white', 
      borderRadius: '8px',
      display: isSummaryView ? 'flex' : 'block',
      flexDirection: isSummaryView ? 'column' : 'unset',
      minHeight: 0,
      minWidth: 0
    }}>
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
        
        {!isSummaryView && (
          <>
            <label style={{ fontWeight: '600', color: '#475569' }}>Fuel Type:</label>
            <select
              value={fuelType}
              onChange={e => setFuelType(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', cursor: 'pointer', minWidth: '150px' }}
            >
              <option value="cng">CNG</option>
              <option value="electric">Electric</option>
            </select>
          </>
        )}

        <label style={{ fontWeight: '600', color: '#475569' }}>State:</label>
        <select
          value={state}
          onChange={e => setState(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', cursor: 'pointer', minWidth: '100px' }}
        >
          {US_STATES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All States' : s}</option>)}
        </select>

        <label style={{ fontWeight: '600', color: '#475569' }}>Year:</label>
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', cursor: 'pointer', minWidth: '80px' }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={
        isSummaryView 
        ? { flexGrow: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' } 
        : { height: '450px', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }>
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading Fuel Station Data...</div>}
        {error && <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>}
        {chartData && !loading && !error && totalStations > 0 && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Pie data={chartData} options={options} />
          </div>
        )}
        {!loading && !error && totalStations === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            No data available for the selected filters.
          </div>
        )}
      </div>

      {!isSummaryView && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f9fafb', borderRadius: '6px', fontSize: '14px', color: '#6b7280' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Concentration Types:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: CONCENTRATION_COLORS['Highly Concentrated Locally truck'], borderRadius: '2px' }}></div>
              <span>Highly Concentrated Locally Truck</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: CONCENTRATION_COLORS['Highly Concentrated Locally bus'], borderRadius: '2px' }}></div>
              <span>Highly Concentrated Locally Bus</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: CONCENTRATION_COLORS['Substantially Locally Focused truck'], borderRadius: '2px' }}></div>
              <span>Substantially Locally Focused Truck</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: CONCENTRATION_COLORS['Substantially Locally Focused bus'], borderRadius: '2px' }}></div>
              <span>Substantially Locally Focused Bus</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: CONCENTRATION_COLORS['National truck'], borderRadius: '2px' }}></div>
              <span>National Truck</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: CONCENTRATION_COLORS['National bus'], borderRadius: '2px' }}></div>
              <span>National Bus</span>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px' }}>
            <b>Note:</b> This chart shows the distribution of fuel stations by vehicle concentration type for the selected state, year, and fuel type.
          </div>
        </div>
      )}
    </div>
  );
}