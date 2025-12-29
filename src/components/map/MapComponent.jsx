"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import MapLegendPanel from './MapLegendPanel';
import MapView from './MapView';
import MinMaxChart from './MinMaxChart';
import {
  parseVehicleCSV,
  aggregateByState,
  getHeatmapIntensity,
} from '@/utils/csvParser';

{/* Defines which Google Maps libraries to load */}
const libraries = ['places', 'visualization'];
import styles from './MapComponent.module.css';

export default function MapComponent() {
  {/* Asynchronously loads Google Maps Javascript script from servers */}
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [map, setMap] = useState(null); {/* map stores the actual Google Map object so we can control it programmatically */}
  const [stations, setStations] = useState([]); {/*stations is raw list of all fuel stations fetched from the API*/}
  const [selectedStation, setSelectedStation] = useState(null); {/*Tracks which pin the user clicked on*/}
  const [loading, setLoading] = useState(true); {/*UI states for the API fetch*/}
  const [error, setError] = useState(null); {/*UI states for the API fetch*/}

  const [productionPlants, setProductionPlants] = useState([]); {/*New state for production plants*/}
  const [showProductionPlants, setShowProductionPlants] = useState(false); // Default unchecked

  const [selectedFuelType, setSelectedFuelType] = useState('all'); {/*for filter*/}
  const [stationStatusFilter, setStationStatusFilter] = useState('all'); {/*for filter*/}
  const [stateFilter, setStateFilter] = useState('all'); {/*for filter*/}
  const [ownershipFilter, setOwnershipFilter] = useState('all'); {/*for filter*/}
  const [isFilterOpen, setIsFilterOpen] = useState(false); {/*for filter*/}

  // Heatmap state
  const [vehicles, setVehicles] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all'); // Year filter: 'all', '2020', '2021', etc.
  const [showHeatmap, setShowHeatmap] = useState('both'); // 'markers', 'heatmap', or 'both'. Only setting heatmap for now 
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4); // Track map zoom level

  const onLoad = useCallback((mapInst) => {
    setMap(mapInst);
    
    // Listen to zoom changes
    mapInst.addListener('zoom_changed', () => {
      const newZoom = mapInst.getZoom();
      setCurrentZoom(newZoom);
    });
  }, []);

  // Load fuel stations and production plants once on mount
  useEffect(() => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    fetch("/api/fuel-stations", {
      next: { revalidate: 3600 } // Cache for 1 hour
    })
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
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });

      // 2. New fetch for Production Plants
    fetch("/api/production-plants")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProductionPlants(data.data);
        }
      })
      .catch(err => {});
  }, [isLoaded]); // Only run once when map loads

  // Separate effect for vehicle data - only refetch when year changes
  useEffect(() => {
    if (!isLoaded) return;

    const loadVehicleData = async () => {
      setVehiclesLoading(true);
      try {
        const parsedVehicles = await parseVehicleCSV(selectedYear);
        setVehicles(parsedVehicles);
      } catch (error) {
      } finally {
        setVehiclesLoading(false);
      }
    };

    loadVehicleData();
  }, [isLoaded, selectedYear]); // Only refetch vehicle data when year changes

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

  const filteredStations = useMemo(() => {
    const filtered = stations.filter((s) => {
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

    // Limit markers based on zoom level to prevent crowding
    // Zoom 4 (default): Show ~250 stations
    // Zoom 6+: Show ~500 stations
    // Zoom 8+: Show all stations
    const maxMarkersMap = {
      1: 100,
      2: 100,
      3: 150,
      4: 250,  // default zoom
      5: 350,
      6: 500,
      7: 750,
      8: Infinity, // Show all at high zoom
    };

    const zoomLevel = Math.floor(currentZoom);
    const maxMarkers = maxMarkersMap[zoomLevel] || maxMarkersMap[8];

    if (filtered.length <= maxMarkers) {
      return filtered;
    }

    // Evenly sample stations to show representative distribution
    const step = filtered.length / maxMarkers;
    const sampled = [];
    for (let i = 0; i < maxMarkers; i++) {
      const index = Math.floor(i * step);
      if (index < filtered.length) {
        sampled.push(filtered[index]);
      }
    }

    return sampled;
  }, [stations, selectedFuelType, stationStatusFilter, stateFilter, ownershipFilter, currentZoom]);

  // Removed auto-zoom functionality - map stays at default US center view
  // Stations are filtered but map doesn't zoom to specific regions

  const selectFuelType = (fuelType) => {
    setSelectedFuelType(fuelType);
  };

  // Compute heatmap data (optimized to prevent unnecessary recalculations)
  const vehicleHeatmapData = useMemo(() => {
    if (vehicles.length === 0 || !isLoaded || showHeatmap === 'markers') {
      return [];
    }

    // Filter vehicles by state only (data already filtered by year from API)
    const filteredVehicles = vehicles.filter(vehicle => {
      // State filter
      const stateMatch = !stateFilter || stateFilter === 'all' || 
        vehicle.state === stateFilter || vehicle.state?.toUpperCase() === stateFilter.toUpperCase();
      
      return stateMatch;
    });

    // Aggregate by state (no cities, no classes)
    const aggregated = aggregateByState(filteredVehicles);
    
    const max = Math.max(...aggregated.map(state => state.totalVehicles), 1);
    const min = Math.min(...aggregated.map(state => state.totalVehicles), 1);

    // Create heatmap data with logarithmic scaling for better visual balance
    const data = aggregated.map((stateData) => {
      // Use logarithmic scaling to compress the range
      const logValue = Math.log10(stateData.totalVehicles + 1);
      const logMax = Math.log10(max + 1);
      const logMin = Math.log10(min + 1);
      
      // Normalize between 0.3 and 1.0 (avoid values too close to 0)
      const normalizedWeight = 0.3 + (0.7 * (logValue - logMin) / (logMax - logMin));
      
      return {
        location: {
          lat: stateData.lat,
          lng: stateData.lng
        },
        weight: normalizedWeight * 100,
      };
    });

    return data;
  }, [vehicles, stateFilter, isLoaded, showHeatmap, selectedYear]);

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
    <div>
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Fuel Adoption Rate Heatmap</h1>
        {/*}
        <p className={styles.description}>
          Find alternative fuel stations across the United States
        </p>
        */}
      </div>

      <div className={styles.content}>
        <div className={styles.mapSection}>
          <MapView 
            onLoad={onLoad}
            filteredStations={filteredStations}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            showHeatmap={showHeatmap}
            vehicleHeatmapData={vehicleHeatmapData}
            mapInstance={map}

            productionPlants={productionPlants}
            showProductionPlants={showProductionPlants}
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
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            heatmapPointCount={vehicleHeatmapData.length}
            vehiclesLoading={vehiclesLoading}

            showProductionPlants={showProductionPlants}
            setShowProductionPlants={setShowProductionPlants}
          />
        </div>
      </div>
    </div>

    {/* Div for Min-Max Chart */}
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Min-Max Charts</h1>
      </div>
      <div className={`${styles.chartContent} ${styles.chartBase}`}>
        <MinMaxChart />

      </div>
    </div>
    </div>
  );
}