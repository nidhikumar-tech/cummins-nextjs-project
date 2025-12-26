"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import MapLegendPanel from './MapLegendPanel';
import MapView from './MapView';
import MinMaxChart from './MinMaxChart';
import {
  parseVehicleCSV,
  aggregateByLocation,
  getUniqueVehicleClasses,
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
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [vehicleClassFilter, setVehicleClassFilter] = useState('6'); // Medium Duty/Heavy Duty/Bus
  const [selectedFuel, setSelectedFuel] = useState('CNG'); // 'CNG' or 'EV'
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
        console.error("Error fetching fuel stations:", err);
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
      .catch(err => console.error("Error fetching plants:", err));



    // Load vehicle data for heatmap
    const loadVehicleData = async () => {
      setVehiclesLoading(true);
      try {
        const parsedVehicles = await parseVehicleCSV();
        setVehicles(parsedVehicles);
        const classes = getUniqueVehicleClasses(parsedVehicles);
        setVehicleClasses(classes);
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      } finally {
        setVehiclesLoading(false);
      }
    };

    loadVehicleData();
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

  // Simple seeded random number generator for stable positions
  const seededRandom = useCallback((seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }, []);

  // Compute heatmap data (optimized to prevent unnecessary recalculations)
  const vehicleHeatmapData = useMemo(() => {
    if (vehicles.length === 0 || !isLoaded || showHeatmap === 'markers') {
      return [];
    }

    const stateNameToCode = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
      'District of Columbia': 'DC'
    };

    // Filter vehicles by state, fuel type, and vehicle class
    const filteredVehicles = vehicles.filter(vehicle => {
      // State filter
      const stateMatch = !stateFilter || stateFilter === 'all' || !vehicle.state ? true :
        (stateNameToCode[vehicle.state.trim()] || vehicle.state.toUpperCase()) === stateFilter.toUpperCase();
      
      // Fuel type filter
      const fuelMatch = vehicle.fuelType && vehicle.fuelType.toUpperCase() === selectedFuel.toUpperCase();
      
      // Vehicle class filter
      const classMatch = vehicle.vehicleClass && String(vehicle.vehicleClass) === String(vehicleClassFilter);
      
      return stateMatch && fuelMatch && classMatch;
    });

    const aggregated = aggregateByLocation(filteredVehicles);
    const max = Math.max(...aggregated.map(loc => loc.totalVehicles), 1);

    // Create heatmap data with point spreading for smooth blending
    const data = aggregated
      .filter(location => {
        const classKey = String(vehicleClassFilter);
        return location.byClass[classKey] && location.byClass[classKey] > 0;
      })
      .flatMap((location, locationIndex) => {
        const classKey = String(vehicleClassFilter);
        const count = location.byClass[classKey];
        const weight = getHeatmapIntensity(count, max);
        const pointCount = Math.max(1, Math.round(weight * 8));
        
        // Use stable seeded random positions based on location coordinates
        const seed = location.lat * 1000 + location.lng * 1000;
        
        return Array(pointCount).fill(0).map((_, pointIndex) => {
          const offsetSeed = seed + pointIndex * 0.1;
          return {
            location: {
              lat: location.lat + (seededRandom(offsetSeed) - 0.5) * 0.1,
              lng: location.lng + (seededRandom(offsetSeed + 0.5) - 0.5) * 0.1
            },
            weight: weight * 100,
          };
        });
      });

    return data;
  }, [vehicles, vehicleClassFilter, selectedFuel, stateFilter, isLoaded, showHeatmap, seededRandom]);

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
            vehicleClassFilter={vehicleClassFilter}
            setVehicleClassFilter={setVehicleClassFilter}
            selectedFuel={selectedFuel}
            setSelectedFuel={setSelectedFuel}
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