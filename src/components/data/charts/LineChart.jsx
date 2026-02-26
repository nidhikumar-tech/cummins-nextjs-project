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
  LogarithmicScale
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
  Filler,
  LogarithmicScale
);

// Standard US State Codes (50 States + DC)
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA',
  'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX',
  'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]);

// Helper: convert hex color to rgba with given alpha
const hexToRgba = (hex, alpha = 0.15) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(99, 102, 241, ${alpha})`;
};

/**
 * Example usage:
 *   <LineChart dataType="vehicles" showFuelTypeSelector={true} showAggregateSelector={true} />
 */
export default function LineChart({ dataType = 'vehicles', showFuelTypeSelector = true, showAggregateSelector = false, borderColor = '#2563eb', backgroundColor = '#2563eb', isSummaryView = false, defaultFuelType = 'cng' }) {
  const [electricYearwiseData, setElectricYearwiseData] = useState([]);
  const [cngYearwiseData, setCngYearwiseData] = useState([]);
  const [electricStatewiseData, setElectricStatewiseData] = useState([]);
  const [cngStatewiseData, setCngStatewiseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fuelType, setFuelType] = useState(defaultFuelType);
  const [mode, setMode] = useState('cumulative'); // 'cumulative' or 'statewise'
  const [selectedState, setSelectedState] = useState('');
  const [states, setStates] = useState([]); 
  
  

  // Fetch all datasets on mount (yearwise for line charts + statewise for min-max)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch yearwise data (from line chart APIs) and statewise data (from new dedicated statewise APIs) in parallel
        const [
          electricLineResponse,
          cngLineResponse,
          electricStatewiseResponse,
          cngStatewiseResponse
        ] = await Promise.all([
          fetch('/api/electric-vehicle-data-line-chart'),
          fetch('/api/cng-vehicle-data-line-chart'),
          fetch('/api/electric-vehicle-data-line-chart-statewise?year=all'),
          fetch('/api/cng-vehicle-data-line-chart-statewise?year=all')
        ]);

        const [
          electricLineResult,
          cngLineResult,
          electricStatewiseResult,
          cngStatewiseResult
        ] = await Promise.all([
          electricLineResponse.json(),
          cngLineResponse.json(),
          electricStatewiseResponse.json(),
          cngStatewiseResponse.json()
        ]);

        // Set yearwise data (for cumulative mode)
        if (electricLineResult.success && Array.isArray(electricLineResult.data)) {
          const filteredElectric = electricLineResult.data.filter(item => item.year <= 2025);
          setElectricYearwiseData(filteredElectric);
        }

        if (cngLineResult.success && Array.isArray(cngLineResult.data)) {
          const filteredCng = cngLineResult.data.filter(item => item.year <= 2025);
          setCngYearwiseData(filteredCng);
        }

        // Set statewise data (for statewise mode)
        if (electricStatewiseResult.success && Array.isArray(electricStatewiseResult.data)) {
          const filteredElectricStatewise = electricStatewiseResult.data.filter(item => item.year <= 2025);
          setElectricStatewiseData(filteredElectricStatewise);
          
          // Extract unique states, filter for only US states, and sort
          const uniqueStates = [...new Set(filteredElectricStatewise.map(item => item.state))]
            .filter(state => US_STATES.has(state))
            .sort();
          setStates(uniqueStates);
          if (!selectedState && uniqueStates.length > 0) {
            setSelectedState(uniqueStates.includes('CA') ? 'CA' : uniqueStates[0]);
          }
        }

        if (cngStatewiseResult.success && Array.isArray(cngStatewiseResult.data)) {
          const filteredCngStatewise = cngStatewiseResult.data.filter(item => item.year <= 2025);
          setCngStatewiseData(filteredCngStatewise);
        }
      } catch (err) {
        setError('Failed to load chart data');
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Select data based on fuel type and mode using useMemo for smooth transitions
  const chartData = useMemo(() => {
    // Select data source based on mode
    let rawData;
    if (mode === 'cumulative') {
      // Use yearwise data from line chart APIs
      rawData = fuelType === 'electric' ? electricYearwiseData : cngYearwiseData;
    } else {
      // Use statewise data from min-max APIs and filter by selected state
      const statewiseData = fuelType === 'electric' ? electricStatewiseData : cngStatewiseData;
      rawData = selectedState ? statewiseData.filter(d => d.state === selectedState) : statewiseData;
    }
    
    if (rawData.length === 0) return null;
    
    // Helper function to add min/max points and shading for a single line
    const addMinMaxForLine = (datasets, lineDataset, values, shadingColor) => {
      // Find min and max
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

      // Track the index of the main line before pushing
      const mainLineIndex = datasets.length;

      // Add main line
      datasets.push(lineDataset);

      // Add min/max points and shading if valid
      if (minIndex !== -1 && maxIndex !== -1) {
        const minPointData = Array(values.length).fill(null);
        minPointData[minIndex] = minVal;
        const maxPointData = Array(values.length).fill(null);
        maxPointData[maxIndex] = maxVal;
        const maxLineData = Array(values.length).fill(maxVal);
        const minLineData = Array(values.length).fill(minVal);

        datasets.push({
          label: `${lineDataset.label} Max`,
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
          label: `${lineDataset.label} Min`,
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
          label: `${lineDataset.label} Max Fill`,
          data: maxLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColor,
          fill: mainLineIndex,
          order: 2
        });

        datasets.push({
          label: `${lineDataset.label} Min Fill`,
          data: minLineData,
          borderColor: 'transparent',
          pointRadius: 0,
          backgroundColor: shadingColor,
          fill: mainLineIndex,
          order: 2
        });
      }
    };
    
    // Determine what data to show based on dataType prop
    if (dataType === 'price') {
      const label = fuelType === 'electric' ? 'EV Price' : 'CNG Price';
      const dataValues = rawData.map(d => fuelType === 'electric' ? d.evPrice : d.cngPrice);
      
      const datasets = [];
      addMinMaxForLine(datasets, {
        label: label,
        data: dataValues,
        borderColor,
        backgroundColor,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        spanGaps: true,
        segment: {
          borderDash: ctx => {
            return ctx.p0.skip || ctx.p1.skip ? [5, 5] : undefined;
          }
        },
        order: 1
      }, dataValues, hexToRgba(borderColor));

      return {
        labels: rawData.map(d => d.year),
        datasets: datasets
      };
    } else if (dataType === 'annual_mileage') {
      const label = fuelType === 'electric' ? 'EV Annual Mileage' : 'CNG Annual Mileage';
      const dataValues = rawData.map(d => d.annualMileage || d.annual_mileage);
      
      const datasets = [];
      addMinMaxForLine(datasets, {
        label: label,
        data: dataValues,
        borderColor,
        backgroundColor,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        spanGaps: true,
        segment: {
          borderDash: ctx => {
            return ctx.p0.skip || ctx.p1.skip ? [5, 5] : undefined;
          }
        },
        order: 1
      }, dataValues, hexToRgba(borderColor));

      return {
        labels: rawData.map(d => d.year),
        datasets: datasets
      };
    } else if (dataType === 'incentive') {
      const label = fuelType === 'electric' ? 'EV Incentives' : 'CNG Incentives';
      const dataValues = rawData.map(d => d.incentive);
      
      const datasets = [];
      addMinMaxForLine(datasets, {
        label: label,
        data: dataValues,
        borderColor,
        backgroundColor,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        spanGaps: true,
        segment: {
          borderDash: ctx => {
            return ctx.p0.skip || ctx.p1.skip ? [5, 5] : undefined;
          }
        },
        order: 1
      }, dataValues, hexToRgba(borderColor));

      return {
        labels: rawData.map(d => d.year),
        datasets: datasets
      };
    } else {
      // dataType === 'vehicles' - show both Actual Vehicles and CMI_VIN
      const actualVehiclesLabel = fuelType === 'electric' ? 'Actual EV VIN' : 'Actual CNG VIN';
      const cmiVinLabel = fuelType === 'electric' ? 'EV CMI VIN' : 'CNG CMI VIN';
      const actualVehiclesData = rawData.map(d => d.actualVehicles);
      const cmiVinData = rawData.map(d => d.cmiVin);
      
      const datasets = [];
      
      // Add first line with min/max
      addMinMaxForLine(datasets, {
        label: actualVehiclesLabel,
        data: actualVehiclesData,
        borderColor,
        backgroundColor,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        spanGaps: true,
        segment: {
          borderDash: ctx => {
            return ctx.p0.skip || ctx.p1.skip ? [5, 5] : undefined;
          }
        },
        order: 1
      }, actualVehiclesData, hexToRgba(borderColor));

      // Add second line with min/max
      addMinMaxForLine(datasets, {
        label: cmiVinLabel,
        data: cmiVinData,
        borderColor: '#8b5cf6',
        backgroundColor: '#8b5cf6',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        spanGaps: true,
        segment: {
          borderDash: ctx => {
            return ctx.p0.skip || ctx.p1.skip ? [5, 5] : undefined;
          }
        },
        order: 1
      }, cmiVinData, hexToRgba('#8b5cf6'));
      
      return {
        labels: rawData.map(d => d.year),
        datasets: datasets
      };
    }
  }, [electricYearwiseData, cngYearwiseData, electricStatewiseData, cngStatewiseData, fuelType, dataType, borderColor, backgroundColor, mode, selectedState]);

  const options = useMemo(() => {
    // Determine chart title based on dataType and mode
    let chartTitle, yAxisLabel;
    const modePrefix = mode === 'statewise' && selectedState ? `${selectedState} - ` : '';
    
    if (dataType === 'price') {
      chartTitle = `${modePrefix}${fuelType === 'electric' ? 'Electric' : 'CNG'} Price by Year`;
      yAxisLabel = 'Price ($)';
    } else if (dataType === 'annual_mileage') {
      chartTitle = `${modePrefix}${fuelType === 'electric' ? 'Electric' : 'CNG'} Annual Mileage Per Truck by Year`;
      yAxisLabel = 'Annual Mileage (miles)';
    } else if (dataType === 'incentive') {
      chartTitle = `${modePrefix}${fuelType === 'electric' ? 'Electric' : 'CNG'} Incentives by Year`;
      yAxisLabel = 'Incentive Count';
    } else {
      chartTitle = `${modePrefix}${fuelType === 'electric' ? 'Electric' : 'CNG'} Vehicle Count by Year`;
      yAxisLabel = 'Vehicle Count';
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end', 
          display: !isSummaryView
        },
        title: {
          display: true,
          text: chartTitle,
          align: 'start',
          font: { size: 16 }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          filter: function(tooltipItem) {
            // Hide tooltips for the shading layers
            return !tooltipItem.dataset.label.includes('Fill');
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: yAxisLabel
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
    };
  }, [fuelType, dataType, mode, selectedState, isSummaryView]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Chart Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

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

      {(showFuelTypeSelector || showAggregateSelector) && (
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
        
        {/* Fuel Type Selector */}
        {showFuelTypeSelector && (
          <>
            <label htmlFor="fuel-type-select" style={{ fontWeight: '600', color: '#475569' }}>Select Fuel Type:</label>
            <select
              id="fuel-type-select"
              value={fuelType}
              onChange={e => setFuelType(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '60px'
              }}
            >
              <option value="electric">Electric</option>
              <option value="cng">CNG</option>
            </select>
          </>
        )}

        {/* Aggregate/Cumulative Mode Selector */}
        {showAggregateSelector && (
          <>
            <label htmlFor="mode-select" style={{ fontWeight: '600', color: '#475569' }}>Mode:</label>
            <select
              id="mode-select"
              value={mode}
              onChange={e => setMode(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '60px'
              }}
            >
              <option value="cumulative">Cumulative</option>
              <option value="statewise">Statewise</option>
            </select>
          </>
        )}

        {/* State Filter Dropdown - Only show for statewise mode */}
        {showAggregateSelector && mode === 'statewise' && states.length > 0 && (
          <>
            <label htmlFor="state-select" style={{ fontWeight: '600', color: '#475569' }}>State:</label>
            <select
              id="state-select"
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '100px'
              }}
            >
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </>
        )}
      </div>
      )}
      
      <div style={isSummaryView ? { flexGrow: 1, minHeight: 0, position: 'relative' } : { height: '400px', width: '100%', position: 'relative' }}>
        {chartData && <Line data={chartData} options={options} />}
        {!chartData && <p>No data available.</p>}
      </div>
    </div>
  );
}