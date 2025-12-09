"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useCallback } from "react";
import MapLegendPanel from './MapLegendPanel';
import MapView from './MapView';

const libraries = ['places', 'visualization'];
import styles from './MapComponent.module.css';

export default function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [map, setMap] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [stationStatusFilter, setStationStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const onLoad = useCallback((mapInst) => {
    setMap(mapInst);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    fetch("/api/fuel-stations")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setStations(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch stations");
        }
      })
      .catch((err) => {
        console.error("Error fetching fuel stations:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isLoaded]);

  const getFuelTypeKey = (fuelType) => {
    if (!fuelType) return 'unknown';
    return fuelType.toLowerCase();
  };

  // State filtering
  const getStateMatch = (station, selectedState) => {
    if (!station.state) return false;
    if (!selectedState || selectedState === 'all') return true;
    
    const stateCode = station.state.toUpperCase();
    return stateCode === selectedState.toUpperCase();
  };

  const filteredStations = stations.filter((s) => {
    // Fuel type filter
    const fuelKey = getFuelTypeKey(s.fuel_type);
    const fuelMatch = selectedFuelType === 'all' || fuelKey === selectedFuelType;
    
    // Station status filter
    const statusMatch = stationStatusFilter === 'all' || 
      (stationStatusFilter === 'available' && s.status_code === 'E') ||
      (stationStatusFilter === 'planned' && s.status_code === 'P');
    
    // State filter
    const stateMatch = getStateMatch(s, stateFilter);
    
    // Ownership filter
    const ownershipMatch = ownershipFilter === 'all' || 
      s.access_code?.toLowerCase() === ownershipFilter.toLowerCase();
    
    return fuelMatch && statusMatch && stateMatch && ownershipMatch;
  });

  // Removed auto-zoom functionality - map stays at default US center view
  // Stations are filtered but map doesn't zoom to specific regions

  const selectFuelType = (fuelType) => {
    setSelectedFuelType(fuelType);
  };

  if (!isLoaded) return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading map…</div>
    </div>
  );
  
  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading fuel stations from BigQuery…</div>
    </div>
  );
  
  if (error) return (
    <div className={styles.container}>
      <div className={styles.error}>Error: {error}</div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Fuel Station Locator</h1>
        <p className={styles.description}>
          Find alternative fuel stations across the United States
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.mapSection}>
          <MapView 
            onLoad={onLoad}
            filteredStations={filteredStations}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
          />
        </div>

        <div className={styles.sidebar}>
          <MapLegendPanel 
            selectedFuelType={selectedFuelType}
            selectFuelType={selectFuelType}
            stationStatusFilter={stationStatusFilter}
            setStationStatusFilter={setStationStatusFilter}
            stateFilter={stateFilter}
            setStateFilter={setStateFilter}
            ownershipFilter={ownershipFilter}
            setOwnershipFilter={setOwnershipFilter}
            stationCount={filteredStations.length}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
          />
        </div>
      </div>
    </div>
  );
}