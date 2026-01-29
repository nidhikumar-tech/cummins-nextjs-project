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

export default function LineChart({ dataType = 'vehicles', showFuelTypeSelector = true, borderColor = '#2563eb', backgroundColor = '#2563eb' }) {
  const [electricData, setElectricData] = useState([]);
  const [cngData, setCngData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fuelType, setFuelType] = useState('cng'); // 'electric' or 'cng'

  // Fetch both datasets on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch both electric and CNG data in parallel
        const [electricResponse, cngResponse] = await Promise.all([
          fetch('/api/electric-vehicle-data-line-chart'),
          fetch('/api/cng-vehicle-data-line-chart')
        ]);

        const [electricResult, cngResult] = await Promise.all([
          electricResponse.json(),
          cngResponse.json()
        ]);

        if (electricResult.success && Array.isArray(electricResult.data)) {
          const filteredElectric = electricResult.data.filter(item => item.year <= 2025);
          setElectricData(filteredElectric);
        }

        if (cngResult.success && Array.isArray(cngResult.data)) {
          const filteredCng = cngResult.data.filter(item => item.year <= 2025);
          setCngData(filteredCng);
        }
      } catch (err) {
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Select data based on fuel type using useMemo for smooth transitions
  const chartData = useMemo(() => {
    const rawData = fuelType === 'electric' ? electricData : cngData;
    if (rawData.length === 0) return null;
    
    // Determine what data to show based on dataType prop
    if (dataType === 'price') {
      const label = fuelType === 'electric' ? 'EV Price' : 'CNG Price';
      const dataValues = rawData.map(d => fuelType === 'electric' ? d.evPrice : d.cngPrice);
      return {
        labels: rawData.map(d => d.year),
        datasets: [
          {
            label: label,
            data: dataValues,
            borderColor,
            backgroundColor,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
          }
        ]
      };
    } else if (dataType === 'annual_mileage') {
      const label = fuelType === 'electric' ? 'EV Annual Mileage' : 'CNG Annual Mileage';
      const dataValues = rawData.map(d => d.annualMileage || d.annual_mileage);
      return {
        labels: rawData.map(d => d.year),
        datasets: [
          {
            label: label,
            data: dataValues,
            borderColor,
            backgroundColor,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
          }
        ]
      };
    } else if (dataType === 'incentive') {
      const label = fuelType === 'electric' ? 'EV Incentives' : 'CNG Incentives';
      const dataValues = rawData.map(d => d.incentive);
      return {
        labels: rawData.map(d => d.year),
        datasets: [
          {
            label: label,
            data: dataValues,
            borderColor,
            backgroundColor,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
          }
        ]
      };
    } else {
      // dataType === 'vehicles' - show both Actual Vehicles and CMI_VIN
      const actualVehiclesLabel = fuelType === 'electric' ? 'Actual EV Vehicles' : 'Actual CNG Vehicles';
      const cmiVinLabel = fuelType === 'electric' ? 'EV CMI VIN' : 'CNG CMI VIN';
      const actualVehiclesData = rawData.map(d => d.actualVehicles);
      const cmiVinData = rawData.map(d => d.cmiVin);
      
      return {
        labels: rawData.map(d => d.year),
        datasets: [
          {
            label: actualVehiclesLabel,
            data: actualVehiclesData,
            borderColor,
            backgroundColor,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
          },
          {
            label: cmiVinLabel,
            data: cmiVinData,
            borderColor: '#8b5cf6', // Purple color for CMI_VIN
            backgroundColor: '#8b5cf6',
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
          }
        ]
      };
    }
  }, [electricData, cngData, fuelType, dataType, borderColor, backgroundColor]);

  const options = useMemo(() => {
    // Determine chart title based on dataType
    let chartTitle, yAxisLabel;
    if (dataType === 'price') {
      chartTitle = `${fuelType === 'electric' ? 'Electric' : 'CNG'} Price by Year`;
      yAxisLabel = 'Price ($)';
    } else if (dataType === 'annual_mileage') {
      chartTitle = `${fuelType === 'electric' ? 'Electric' : 'CNG'} Annual Mileage by Year`;
      yAxisLabel = 'Annual Mileage (miles)';
    } else if (dataType === 'incentive') {
      chartTitle = `${fuelType === 'electric' ? 'Electric' : 'CNG'} Incentives by Year`;
      yAxisLabel = 'Incentive Count';
    } else {
      chartTitle = `${fuelType === 'electric' ? 'Electric' : 'CNG'} Vehicle Count by Year`;
      yAxisLabel = 'Vehicle Count';
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end'
        },
        title: {
          display: true,
          text: chartTitle,
          align: 'start',
          font: { size: 16 }
        },
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
  }, [fuelType, dataType]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Chart Data...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', background: 'white', borderRadius: '8px' }}>
      {showFuelTypeSelector && (
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="fuel-type-select" style={{ fontWeight: '600', color: '#475569' }}>Select Fuel Type:</label>
          <select
            id="fuel-type-select"
            value={fuelType}
            onChange={e => setFuelType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="electric">Electric</option>
            <option value="cng">CNG</option>
          </select>
        </div>
      )}
      <div style={{ height: '400px', width: '100%' }}>
        {chartData && <Line data={chartData} options={options} />}
        {!chartData && <p>No data available.</p>}
      </div>
    </div>
  );
}