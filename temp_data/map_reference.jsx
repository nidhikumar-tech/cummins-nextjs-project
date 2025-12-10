"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import MapLegendPanel from './MapLegendPanel';
import MapView from './MapView';
import {
  parseVehicleCSV,
  aggregateByLocation,
  getUniqueVehicleClasses,
  getHeatmapIntensity,
} from '@/utils/csvParser';

const libraries = ['places'];
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

  const [filters, setFilters] = useState({
    elec: false,    
    cng: true,
  });

  const [stateFilter, setStateFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Heatmap state
  const [vehicles, setVehicles] = useState([]);
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [selectedVehicleClass, setSelectedVehicleClass] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const onLoad = useCallback((mapInst) => {
    setMap(mapInst);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    // Load fuel stations
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

    // Load vehicle data for heatmap
    const loadVehicleData = async () => {
      try {
        const parsedVehicles = await parseVehicleCSV();
        setVehicles(parsedVehicles);
        const classes = getUniqueVehicleClasses(parsedVehicles);
        setVehicleClasses(classes);
        setSelectedVehicleClass(classes[0] || null);
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      }
    };

    loadVehicleData();
  }, [isLoaded]);

  const getFuelTypeKey = (fuelType) => {
    if (!fuelType) return 'unknown';
    return fuelType.toLowerCase();
  };

  // State matching for filtering
  const getStateMatch = (station, selectedState) => {
    if (!selectedState || selectedState === 'all' || !station.state) return true;
    const stateCode = station.state.toUpperCase();
    return stateCode === selectedState.toUpperCase();
  };

  const filteredStations = stations.filter((s) => {
    // Fuel type filter
    const fuelKey = getFuelTypeKey(s.fuel_type);
    const fuelMatch = filters[fuelKey] !== undefined ? filters[fuelKey] : true;
    
    // State filter
    const stateMatch = getStateMatch(s, stateFilter);
    
    // Ownership filter
    const ownershipMatch = ownershipFilter === 'all' || 
      s.access_code?.toLowerCase() === ownershipFilter.toLowerCase();
    
    return fuelMatch && stateMatch && ownershipMatch;
  });

  // Removed auto-zoom functionality - map stays at default US center view
  // Stations are filtered but map doesn't zoom to specific regions

  const toggleFilter = (fuel) => {
    setFilters((prev) => ({ ...prev, [fuel]: !prev[fuel] }));
  };

  // Simple seeded random number generator for stable positions
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Compute heatmap data (optimized to prevent unnecessary recalculations)
  const { heatmapData, maxVehicleCount } = useMemo(() => {
    if (vehicles.length === 0 || !isLoaded || !showHeatmap) {
      return { heatmapData: [], maxVehicleCount: 1 };
    }

    const filteredVehicles = vehicles.filter(vehicle => {
      if (!stateFilter || stateFilter === 'all' || !vehicle.state) return true;
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
      const stateCode = stateNameToCode[vehicle.state.trim()] || vehicle.state.toUpperCase();
      return stateCode === stateFilter.toUpperCase();
    });

    const aggregated = aggregateByLocation(filteredVehicles);
    const max = Math.max(...aggregated.map(loc => loc.totalVehicles), 1);

    const data = selectedVehicleClass ? aggregated
      .filter(location => location.byClass[selectedVehicleClass] && location.byClass[selectedVehicleClass] > 0)
      .flatMap((location, locationIndex) => {
        const count = location.byClass[selectedVehicleClass];
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
      }) : [];

    return { heatmapData: data, maxVehicleCount: max };
  }, [vehicles, selectedVehicleClass, stateFilter, isLoaded, showHeatmap]);

  // Deck.gl overlay component
  function DeckGlOverlay({ mapInstance, heatmapData }) {
    const deck = useMemo(() => new GoogleMapsOverlay({ layers: [] }), []);

    useEffect(() => {
      if (!mapInstance) return;

      const timeoutId = setTimeout(() => {
        try {
          deck.setMap(mapInstance);
        } catch (error) {
          console.warn('Error attaching deck.gl overlay:', error);
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        try {
          deck.setMap(null);
        } catch (error) {
          console.warn('Error detaching deck.gl overlay:', error);
        }
      };
    }, [mapInstance, deck]);

    useEffect(() => {
      if (!mapInstance || !heatmapData || heatmapData.length === 0) {
        try {
          deck.setProps({ layers: [] });
        } catch (error) {
          console.warn('Error clearing deck.gl layers:', error);
        }
        return;
      }

      try {
        // Memoize deckData transformation to avoid recalculation
        const deckData = heatmapData.map(d => ({
          position: [d.location.lng, d.location.lat],
          weight: d.weight
        }));

        const layer = new HeatmapLayer({
          id: 'vehicle-heatmap-layer',
          data: deckData,
          getPosition: d => d.position,
          getWeight: d => d.weight,
          radiusPixels: 80,
          intensity: 1.5,
          threshold: 0.05,
          colorRange: [
            [0, 255, 128, 50],
            [0, 255, 0, 120],
            [255, 255, 0, 160],
            [255, 200, 0, 200],
            [255, 100, 0, 220],
            [255, 0, 0, 240]
          ],
          aggregation: 'SUM',
          opacity: 0.7
        });
        
        deck.setProps({ layers: [layer] });
      } catch (error) {
        console.error('Error updating deck.gl heatmap layer:', error);
      }
    }, [deck, heatmapData, mapInstance]);

    return null;
  }

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
          {map && showHeatmap && (
            <DeckGlOverlay
              mapInstance={map}
              heatmapData={heatmapData}
            />
          )}
        </div>

        <div className={styles.sidebar}>
          <MapLegendPanel 
            filters={filters}
            toggleFilter={toggleFilter}
            stateFilter={stateFilter}
            setStateFilter={setStateFilter}
            ownershipFilter={ownershipFilter}
            setOwnershipFilter={setOwnershipFilter}
            stationCount={filteredStations.length}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
            vehicleClasses={vehicleClasses}
            selectedVehicleClass={selectedVehicleClass}
            setSelectedVehicleClass={setSelectedVehicleClass}
            heatmapPointCount={heatmapData.length}
          />
        </div>
      </div>
    </div>
  );
}