"use client";

import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const US_CENTER = {
  lat: 39.8283,
  lng: -98.5795,
};

// --- url to pin images ---
const PIN_IMAGES = {
  // AVAILABLE (Status: 'E')
  available_public:     '/images/green.png',      
  available_commercial: '/images/green-dot.png',        
  
  // PLANNED (Status: 'P')
  planned_public:       '/images/red.png',    
  planned_commercial:   '/images/red-dot.png',     
};
// --------------------------------------------------

// --- DECK.GL OVERLAY (Heatmap) ---
function DeckGlOverlay({ mapInstance, vehicleHeatmapData }) {
  const deckRef = useRef(null);

  useEffect(() => {
    if (!mapInstance || deckRef.current) return;
    const deck = new GoogleMapsOverlay({ layers: [] });
    deckRef.current = deck;

    const timeoutId = setTimeout(() => {
      try { deck.setMap(mapInstance); } 
      catch (error) { console.warn('Error attaching deck.gl:', error); }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (deckRef.current) {
        try { deckRef.current.setMap(null); deckRef.current = null; } 
        catch (error) { console.warn('Error detaching deck.gl:', error); }
      }
    };
  }, [mapInstance]);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || !mapInstance) return;

    if (!vehicleHeatmapData || vehicleHeatmapData.length === 0) {
      deck.setProps({ layers: [] });
      return;
    }

    try {
      const deckData = vehicleHeatmapData.map(d => ({
        position: [d.location.lng, d.location.lat],
        weight: d.weight
      }));

      const layer = new HeatmapLayer({
        id: 'vehicle-heatmap-layer',
        data: deckData,
        getPosition: d => d.position,
        getWeight: d => d.weight,
        radiusPixels: 150,
        intensity: 1.5,
        threshold: 0.05,
        colorRange: [
          [0, 255, 128, 50], [0, 255, 0, 120], [255, 255, 0, 160],
          [255, 200, 0, 200], [255, 100, 0, 220], [255, 0, 0, 240]
        ],
        aggregation: 'SUM',
        opacity: 0.5
      });
      deck.setProps({ layers: [layer] });
    } catch (error) { console.error('Error updating heatmap:', error); }
  }, [vehicleHeatmapData, mapInstance]);

  return null;
}

export default function MapView({ 
  onLoad, 
  filteredStations, 
  selectedStation, 
  setSelectedStation,
  showHeatmap,
  vehicleHeatmapData,
  mapInstance,
  productionPlants,      // New Prop
  showProductionPlants   // New Prop
}) {
  
  // --- 1. STATIC IMAGE PIN LOGIC (Fuel Stations) ---
  const getIcon = useCallback((station) => {
    // Check Status
    const isAvailable = station.status_code === 'E';
    // Check Access (Commercial/Private vs Public)
    const isCommercial = station.access_code && station.access_code.toLowerCase() === 'private';

    // Select Image URL based on the 4 combinations
    let iconUrl;
    if (isAvailable) {
      iconUrl = isCommercial ? PIN_IMAGES.available_commercial : PIN_IMAGES.available_public;
    } else {
      iconUrl = isCommercial ? PIN_IMAGES.planned_commercial : PIN_IMAGES.planned_public;
    }

    return {
      url: iconUrl,
      scaledSize: new window.google.maps.Size(32, 30), 
      anchor: new window.google.maps.Point(16, 40),    
    };
  }, []);

  // --- 2. PRODUCTION PLANT ICON LOGIC ---
  const plantIcon = useMemo(() => ({
    url: '/images/round.png',
    scaledSize: new window.google.maps.Size(30, 30), 
    anchor: new window.google.maps.Point(15, 15)     
  }), []);

  // --- 3. STATE FOR PLANT POPUP ---
  const [selectedPlant, setSelectedPlant] = useState(null);

  const shouldShowMarkers = showHeatmap === 'markers' || showHeatmap === 'both';
  const shouldShowHeatmap = showHeatmap === 'heatmap' || showHeatmap === 'both';

  return (
    <GoogleMap
      onLoad={onLoad}
      mapContainerStyle={mapContainerStyle}
      center={US_CENTER}
      zoom={4}
    >
      {/* --- RENDER FUEL STATIONS --- */}
      {shouldShowMarkers && filteredStations.map((s, index) => (
        <Marker
          key={`${s.station_id || s.ID || 'unknown'}-${index}`}
          position={{ lat: s.lat, lng: s.lng }}
          icon={getIcon(s)}
          onClick={() => setSelectedStation(s)}
        />
      ))}

      {/* --- RENDER PRODUCTION PLANTS --- */}
      {showProductionPlants && productionPlants && productionPlants.map((plant, index) => (
        <Marker
          key={`plant-${index}`}
          position={{ lat: plant.lat, lng: plant.lng }}
          icon={plantIcon}
          onClick={() => setSelectedPlant(plant)}
          zIndex={1000} // Keeps plants on top of fuel stations
        />
      ))}

      {/* --- INFO WINDOW: FUEL STATIONS --- */}
      {selectedStation && (
        <InfoWindow
          position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
          onCloseClick={() => setSelectedStation(null)}
        >
          <div style={{ minWidth: "200px", maxWidth: "300px" }}>
            <h4 style={{ margin: "0 0 10px", color: "#333" }}>
              {selectedStation.station_name || "Station"}
            </h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ 
                    fontSize: '10px', padding: '2px 6px', borderRadius: '4px', 
                    background: (selectedStation.access_code || '').toLowerCase() === 'private' ? '#e5e7eb' : '#f3f4f6',
                    color: '#374151', fontWeight: 'bold',
                    border: '1px solid #d1d5db'
                }}>
                    {(selectedStation.access_code || 'PUBLIC').toUpperCase()}
                </span>
                
                <span style={{ 
                    fontSize: '10px', padding: '2px 6px', borderRadius: '4px', 
                    background: selectedStation.status_code === 'E' ? '#DBEAFE' : '#FFF7ED',
                    color: selectedStation.status_code === 'E' ? '#1E40AF' : '#9A3412',
                    border: '1px solid',
                    borderColor: selectedStation.status_code === 'E' ? '#93C5FD' : '#FED7AA',
                    fontWeight: 'bold'
                }}>
                    {selectedStation.status_code === 'E' ? 'AVAILABLE' : 'PLANNED'}
                </span>
            </div>
            
            <p style={{ margin: "5px 0", fontSize: "13px" }}>
              <strong>Fuel Type:</strong> {selectedStation.fuel_type?.toUpperCase()}
            </p>
            <p style={{ margin: "5px 0", fontSize: "13px" }}>
              <strong>Address:</strong> {selectedStation.street_address || 'N/A'}
            </p>
          </div>
        </InfoWindow>
      )}

      {/* --- INFO WINDOW: PRODUCTION PLANTS --- */}
      {selectedPlant && (
        <InfoWindow
          position={{ lat: selectedPlant.lat, lng: selectedPlant.lng }}
          onCloseClick={() => setSelectedPlant(null)}
        >
          <div style={{ minWidth: "220px", maxWidth: "300px" }}>
            <h4 style={{ margin: "0 0 8px", color: "#b91c1c", borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
              🏭 {selectedPlant.vendor}
            </h4>
            
            <p style={{ margin: "4px 0", fontSize: "13px" }}>
              <strong>Service:</strong> {selectedPlant.description || 'N/A'}
            </p>
            
            <p style={{ margin: "4px 0", fontSize: "13px" }}>
              <strong>Phone:</strong> {selectedPlant.phone || 'N/A'}
            </p>
            
            <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
              <p style={{ margin: "0", fontSize: "12px", color: "#64748b" }}>
                {selectedPlant.address}<br/>
                {selectedPlant.city}, {selectedPlant.state} {selectedPlant.zip}
              </p>
            </div>
          </div>
        </InfoWindow>
      )}

      {/* --- HEATMAP OVERLAY --- */}
      {shouldShowHeatmap && mapInstance && vehicleHeatmapData && vehicleHeatmapData.length > 0 && (
        <DeckGlOverlay
          mapInstance={mapInstance}
          vehicleHeatmapData={vehicleHeatmapData}
        />
      )}
    </GoogleMap>
  );
}