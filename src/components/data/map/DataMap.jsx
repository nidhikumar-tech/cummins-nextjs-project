"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import MapLegendPanel from './MapLegendPanel';
import MapView from './MapView';
import {
  parseVehicleCSV,
  aggregateByState,
} from '@/utils/csvParser';

const libraries = ['places', 'visualization'];

export default function MapComponent() {

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });


  // Important States: useState declarations

  const [map, setMap] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //New state to track which specific fuel types are currently fetching
  const [loadingTypes, setLoadingTypes] = useState([]);
  // Filters
  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [stationStatusFilter, setStationStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Heatmap State
  const [vehicles, setVehicles] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all'); // Year filter: 'all', '2020', '2021', etc.
  const [vehicleFuelTypeFilter, setVehicleFuelTypeFilter] = useState('all'); // 'all', 'cng', 'hybrid'
  const [showHeatmap, setShowHeatmap] = useState('both'); // 'markers', 'heatmap', or 'both'. Only setting heatmap for now 
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4);
  const [mapBounds, setMapBounds] = useState(null);

  // Production Plant State
  const [productionPlants, setProductionPlants] = useState([]);
  const [showProductionPlants, setShowProductionPlants] = useState(false);
  const [ppFilters, setPpFilters] = useState({
    cng: true,
    electric: true
  });

  // Logical helper functions

  const getFuelTypeKey = (fuelType) => {
    if (!fuelType) return 'unknown';
    return fuelType.toLowerCase();
  };

  const getStateMatch = (item, selectedState) => {
    if (!item.state) return false;
    if (!selectedState || selectedState === 'all') return true;

    const itemState = item.state.toUpperCase();
    const filterState = selectedState.toUpperCase();

    // Direct match
    if (itemState === filterState) return true;

    // Lookup table for Full Name -> Code
    const stateNameToCode = {
      'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
      'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
      'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
      'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
      'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS', 'MISSOURI': 'MO',
      'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
      'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
      'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
      'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT',
      'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY',
      'DISTRICT OF COLUMBIA': 'DC'
    };

    return stateNameToCode[itemState] === filterState;
  };

  const selectFuelType = (fuelType) => {
    setSelectedFuelType(fuelType);
  };

  // Simple seeded random number generator for stable positions
  const seededRandom = useCallback((seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }, []);

  const onLoad = useCallback((mapInst) => {
    setMap(mapInst);

    const updateMapState = () => {
      const newZoom = mapInst.getZoom();
      const bounds = mapInst.getBounds();
      setCurrentZoom(newZoom);
      if (bounds) {
        setMapBounds({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        });
      }
    };

    mapInst.addListener('zoom_changed', updateMapState);
    mapInst.addListener('bounds_changed', updateMapState);

    // Initial bounds
    updateMapState();
  }, []);

  const isLoadingActiveFilter = useMemo(() => {
    if (loadingTypes.length === 0) return false;
    if (selectedFuelType === 'all') return false;

    // Check specific types
    if (selectedFuelType === 'elec') {
      return loadingTypes.some(t => t.includes('ELEC'));
    }
    if (selectedFuelType === 'cng') return loadingTypes.includes('CNG');

    return false;
  }, [selectedFuelType, loadingTypes]);

 

  // Load fuel stations and production plants once on mount
  useEffect(() => {
    // If user switches back to "All States", force uncheck the plants
    if (stateFilter === 'all') {
      setShowProductionPlants(false);
    }
  }, [stateFilter]);

  // Filter Production Plants
  const filteredProductionPlants = useMemo(() => {
    // 1. Basic check: is checkbox checked?
    if (!showProductionPlants) return [];

    // 2. SECURITY CHECK: If no specific state is selected, return nothing.
    // This enforces the "State has to be selected" rule.
    if (stateFilter === 'all') return [];

    // 3. Apply filters (state + fuel type checkboxes)
    const filtered = productionPlants.filter(plant => {
      const stateMatch = getStateMatch(plant, stateFilter);
      const fuelMatch = ppFilters[plant.fuel_type];
      return stateMatch && fuelMatch;
    });

    // 4. Apply zoom-based filtering (same logic as fuel stations)
    const zoomLevel = Math.floor(currentZoom);
    const isLargeDataset = filtered.length > 1; // Production plants threshold

    // At high zoom (10+), filter by viewport bounds and show ALL markers within bounds
    if (zoomLevel >= 10 && mapBounds) {
      const inBounds = filtered.filter(plant =>
        plant.lat >= mapBounds.south &&
        plant.lat <= mapBounds.north &&
        plant.lng >= mapBounds.west &&
        plant.lng <= mapBounds.east
      );
      return inBounds;
    }

    // Don't render markers when zoomed out too far with large datasets
    // if (isLargeDataset && zoomLevel < 4) {
    //   return [];
    // }

    // For lower zoom levels, use sampling to prevent performance issues
    const maxMarkersMap = isLargeDataset
      ? { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 20, 7: 200, 8: 300, 9: 1000 }
      : { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 20, 7: 200, 8: 300, 9: 300 };

    const maxMarkers = maxMarkersMap[zoomLevel];

    if (filtered.length <= maxMarkers) {
      return filtered;
    }

    // Evenly sample plants for lower zoom levels
    const step = filtered.length / maxMarkers;
    const sampled = [];
    for (let i = 0; i < maxMarkers; i++) {
      const index = Math.floor(i * step);
      if (index < filtered.length) {
        sampled.push(filtered[index]);
      }
    }
    return sampled;
  }, [productionPlants, showProductionPlants, ppFilters, stateFilter, currentZoom, mapBounds]);
  // ========================================================================

  // Load stations and production plants once when map loads
  useEffect(() => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);
    const fetchConfigs = [
      { type: 'CNG', status: null, label: 'CNG' },
      { type: 'ELEC', status: 'P', label: 'ELEC-Planned' },   // <-- Fast load
      { type: 'ELEC', status: 'E', label: 'ELEC-Available' }, // <-- Slow load
    ];

    setLoadingTypes(fetchConfigs.map(c => c.label));

    // Fetch function that appends data progressively
    const fetchFuelType = async (config) => {
      const { type, status, label } = config;
      try {
        let url = `/api/fuel-stations?type=${type}`;
        if (status) url += `&status=${status}`;

        const res = await fetch(url, {
          next: { revalidate: 3600 }
        });
        
        if (!res.ok) throw new Error(`Failed to load ${label}`);
        
        const json = await res.json();
        
        if (json.success) {
          // Append data immediately as it arrives
          setStations(prevStations => [...prevStations, ...json.data]);
        }
      } catch (err) {
        console.error(`Error loading ${label}:`, err);
      } finally {
        setLoadingTypes(prev => prev.filter(t => t !== label));
      }
    };

    //Fire all requests in parallel
    fetchConfigs.forEach(config => {
      fetchFuelType(config);
    });

    // 2. New fetch for Production Plants
    fetch("/api/production-plants")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProductionPlants(data.data);
        }
      })
      .catch(err => { });
    setLoading(false);
  }, [isLoaded]); // Only run once when map loads

  // Separate effect for vehicle data - only refetch when year or fuel type changes
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

  const filteredStations = useMemo(() => {
    const filtered = stations.filter((s) => {
      // Fuel type filter
      const fuelKey = getFuelTypeKey(s.fuel_type);
      const fuelMatch = selectedFuelType === 'all' ||
        fuelKey === selectedFuelType;

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

    // --- Sampling and zoom-based limiting logic is commented out to show all markers at all zoom levels ---

    //REMOVING ZOOM 
    //const zoomLevel = Math.floor(currentZoom);
    //const isLargeDataset = filtered.length > 10000;

    // At high zoom (10+), filter by viewport bounds and show ALL markers within bounds
    //if (zoomLevel >= 10 && mapBounds) {
    //  const inBounds = filtered.filter(station =>
    //    station.lat >= mapBounds.south &&
    //    station.lat <= mapBounds.north &&
    //    station.lng >= mapBounds.west &&
    //    station.lng <= mapBounds.east
    //  );
      // At max zoom, show all markers within viewport (no limit)
    //  return inBounds;
    //}

    // Don't render markers when zoomed out too far with large datasets
    //if (isLargeDataset && zoomLevel < 4) {
    //  return [];
    //}

    // For lower zoom levels, use sampling to prevent performance issues
    //const maxMarkersMap = isLargeDataset
    //  ? { 1: 200, 2: 200, 3: 200, 4: 200, 5: 200, 6: 400, 7: 800, 8: 1500, 9: 2500 }
    //  : { 1: 100, 2: 100, 3: 150, 4: 250, 5: 350, 6: 500, 7: 750, 8: 1000, 9: 2000 };

    //const maxMarkers = maxMarkersMap[zoomLevel] || 2500;

    //if (filtered.length <= maxMarkers) {
    //  return filtered;
    //}

    // Evenly sample stations for lower zoom levels
    //const step = filtered.length / maxMarkers;
    //const sampled = [];
    //for (let i = 0; i < maxMarkers; i++) {
     // const index = Math.floor(i * step);
      //if (index < filtered.length) {
      //  sampled.push(filtered[index]);
     // }
    //}
    //return sampled;
    // Uncomment the below line to disable sampling and show all filtered stations at all zoom levels (not recommended for performance)
     return filtered;
  }, [stations, selectedFuelType, stationStatusFilter, stateFilter, ownershipFilter, currentZoom, mapBounds]);

  // Calculate total filtered count (before sampling) for display
  const totalFilteredCount = useMemo(() => {
    return stations.filter((s) => {
      const fuelKey = getFuelTypeKey(s.fuel_type);
      const fuelMatch = selectedFuelType === 'all' ||
        fuelKey === selectedFuelType;
      const statusMatch = stationStatusFilter === 'all' ||
        (stationStatusFilter === 'available' && s.status_code === 'E') ||
        (stationStatusFilter === 'planned' && s.status_code === 'P');
      const stateMatch = getStateMatch(s, stateFilter);
      const ownershipMatch = ownershipFilter === 'all' ||
        s.access_code?.toLowerCase() === ownershipFilter.toLowerCase();
      return fuelMatch && statusMatch && stateMatch && ownershipMatch;
    }).length;
  }, [stations, selectedFuelType, stationStatusFilter, stateFilter, ownershipFilter]);

  // Removed auto-zoom functionality - map stays at default US center view
  // Stations are filtered but map doesn't zoom to specific regions

  // Compute heatmap data (optimized to prevent unnecessary recalculations)
  // Compute Heatmap Data
  const vehicleHeatmapData = useMemo(() => {
    if (vehicles.length === 0 || !isLoaded || showHeatmap === 'markers') {
      return [];
    }

    // Filter vehicles by state and fuel type (data already filtered by year from API)
    const filteredVehicles = vehicles.filter(vehicle => {
      // State filter
      const stateMatch = !stateFilter || stateFilter === 'all' ||
        vehicle.state === stateFilter || vehicle.state?.toUpperCase() === stateFilter.toUpperCase();

      // Fuel type filter
      const fuelTypeMatch = vehicleFuelTypeFilter === 'all' ||
        vehicle.fuel_type?.toLowerCase() === vehicleFuelTypeFilter.toLowerCase();

      return stateMatch && fuelTypeMatch;
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
  }, [vehicles, stateFilter, isLoaded, showHeatmap, selectedYear, vehicleFuelTypeFilter]);

  // --- 5. EARLY RETURNS (AFTER ALL HOOKS) ---

  if (!isLoaded) return (
    <div style={{padding: '32px 24px', background: '#f8f9fa', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', fontSize: '1.125rem'}}>Loading map…</div>
    </div>
  );

  // Remove blocking loading screen - show map immediately with loading indicator
  // if (loading) return (
  //   <div className={styles.container}>
  //     <div className={styles.loading}>Loading data from BigQuery…</div>
  //   </div>
  // );

  if (error) return (
    <div style={{padding: '32px 24px', background: '#f8f9fa', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', fontSize: '1.125rem'}}>Error: {error}</div>
    </div>
  );

  return (
    <div>
      <div style={{padding: '32px 24px', background: '#f8f9fa', minHeight: '80vh', maxWidth: '1600px', margin: '0 auto'}}>
        <div style={{ marginBottom: '20px',   textAlign: 'center' }}>
          <h1 style={{  fontSize: '2rem',  fontWeight: '700',  color: '#0f172a',  margin: '0 0 8px 0',  letterSpacing: '-0.025em'}}>Fuel Adoption Rate Heatmap</h1>
          {loadingTypes.length > 0 && (
            <div style={{
              fontSize: '12px',
              color: '#666',
              display: 'flex',
              gap: '10px',
              marginTop: '5px',
              alignItems: 'center'
            }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '2px solid #ccc',
                borderTop: '2px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></span>
              <span>Loading data...</span>
              {loadingTypes.map(t => (
                <span key={t} style={{
                  background: '#f0f0f0',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        <div style={{display: 'grid',  gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start'}}>
          <div style={{background: 'white', border: '3px solid black', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)', overflow: 'hidden', position: 'relative'}}>
            {/* [UPDATE] Smart Alert: Only shows if user is filtering for something not yet loaded */}
            {isLoadingActiveFilter && (
              <div style={{position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex',alignItems: 'center',gap: '10px',fontSize: '14px',fontWeight: '600',color: '#333',border: '1px solid #eee'}}>
                <div style={{width: '16px',height: '16px',border: '2px solid #f3f3f3',borderTop: '2px solid #3498db',borderRadius: '50%',animation: 'spin 1s linear infinite'}} />
                <span>Fetching {selectedFuelType.toUpperCase()} stations...</span>
              </div>
            )}
            <MapView
              onLoad={onLoad}
              filteredStations={filteredStations}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              showHeatmap={showHeatmap}
              vehicleHeatmapData={vehicleHeatmapData}
              mapInstance={map}
              // NEW PROPS
              productionPlants={filteredProductionPlants}
              showProductionPlants={showProductionPlants}
            />
          </div>

          <div style={{display: 'flex',  flexDirection: 'column',  gap: '16px',  height: '100%',  overflowY: 'auto'}}>
            <MapLegendPanel
              selectedFuelType={selectedFuelType}
              selectFuelType={selectFuelType}
              stationStatusFilter={stationStatusFilter}
              setStationStatusFilter={setStationStatusFilter}
              stateFilter={stateFilter}
              setStateFilter={setStateFilter}
              ownershipFilter={ownershipFilter}
              setOwnershipFilter={setOwnershipFilter}
              stationCount={totalFilteredCount}
              isFilterOpen={isFilterOpen}
              setIsFilterOpen={setIsFilterOpen}
              showHeatmap={showHeatmap}
              setShowHeatmap={setShowHeatmap}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              vehicleFuelTypeFilter={vehicleFuelTypeFilter}
              setVehicleFuelTypeFilter={setVehicleFuelTypeFilter}
              heatmapPointCount={vehicleHeatmapData.length}
              vehiclesLoading={vehiclesLoading}
              // NEW PROPS
              showProductionPlants={showProductionPlants}
              setShowProductionPlants={setShowProductionPlants}
              ppFilters={ppFilters}
              setPpFilters={setPpFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}