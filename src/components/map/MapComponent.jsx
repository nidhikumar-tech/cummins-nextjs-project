"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useCallback } from "react";
import MapLegendPanel from './MapLegendPanel';
import MapView from './MapView';
import styles from './MapComponent.module.css';

export default function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ["places", "visualization"],
  });

  const [map, setMap] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    elec: false,    
    cng: true,
  });

  const [regionFilter, setRegionFilter] = useState('');
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

  // State name mapping for better matching
  const getStateMatch = (station, searchTerm) => {
    if (!searchTerm || !station.state) return true;
    
    const search = searchTerm.toLowerCase().trim();
    const stateCode = station.state.toLowerCase();
    const city = station.city?.toLowerCase() || '';
    
    // Direct matches
    if (stateCode === search || city.includes(search)) return true;
    
    // State name to code mapping
    const stateNames = {
      'texas': 'tx', 'california': 'ca', 'florida': 'fl', 'new york': 'ny',
      'illinois': 'il', 'pennsylvania': 'pa', 'ohio': 'oh', 'georgia': 'ga',
      'north carolina': 'nc', 'michigan': 'mi', 'virginia': 'va', 'washington': 'wa',
      'massachusetts': 'ma', 'indiana': 'in', 'arizona': 'az', 'tennessee': 'tn',
      'missouri': 'mo', 'maryland': 'md', 'wisconsin': 'wi', 'colorado': 'co',
      'minnesota': 'mn', 'louisiana': 'la', 'alabama': 'al', 'kentucky': 'ky',
      'oregon': 'or', 'oklahoma': 'ok', 'connecticut': 'ct', 'iowa': 'ia',
      'mississippi': 'ms', 'arkansas': 'ar', 'kansas': 'ks', 'utah': 'ut',
      'nevada': 'nv', 'new mexico': 'nm', 'west virginia': 'wv', 'nebraska': 'ne',
      'idaho': 'id', 'hawaii': 'hi', 'new hampshire': 'nh', 'maine': 'me',
      'montana': 'mt', 'rhode island': 'ri', 'delaware': 'de', 'south dakota': 'sd',
      'north dakota': 'nd', 'alaska': 'ak', 'vermont': 'vt', 'wyoming': 'wy'
    };
    
    // Check if search term is a state name that maps to current state code
    if (stateNames[search] === stateCode) return true;
    
    // Partial matching for state names
    for (const [fullName, code] of Object.entries(stateNames)) {
      if (fullName.includes(search) && code === stateCode) return true;
    }
    
    return false;
  };

  const filteredStations = stations.filter((s) => {
    // Fuel type filter
    const fuelKey = getFuelTypeKey(s.fuel_type);
    const fuelMatch = filters[fuelKey] !== undefined ? filters[fuelKey] : true;
    
    // Region filter (improved state and city matching)
    const regionMatch = getStateMatch(s, regionFilter);
    
    // Ownership filter
    const ownershipMatch = ownershipFilter === 'all' || 
      s.access_code?.toLowerCase() === ownershipFilter.toLowerCase();
    
    return fuelMatch && regionMatch && ownershipMatch;
  });

  // Removed auto-zoom functionality - map stays at default US center view
  // Stations are filtered but map doesn't zoom to specific regions

  const toggleFilter = (fuel) => {
    setFilters((prev) => ({ ...prev, [fuel]: !prev[fuel] }));
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
            filters={filters}
            toggleFilter={toggleFilter}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
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