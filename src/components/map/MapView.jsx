"use client";

import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useEffect, useMemo, useRef } from "react";
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { iconMap } from '@/constants/mapConfig';

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '12px',
};

const US_CENTER = {
  lat: 39.8283,
  lng: -98.5795,
};

// Deck.gl overlay component for heatmap - moved outside to prevent recreation
function DeckGlOverlay({ mapInstance, vehicleHeatmapData }) {
  const deckRef = useRef(null);

  // Initialize deck.gl overlay only once
  useEffect(() => {
    if (!mapInstance || deckRef.current) return;

    const deck = new GoogleMapsOverlay({ layers: [] });
    deckRef.current = deck;

    const timeoutId = setTimeout(() => {
      try {
        deck.setMap(mapInstance);
      } catch (error) {
        console.warn('Error attaching deck.gl overlay:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (deckRef.current) {
        try {
          deckRef.current.setMap(null);
          deckRef.current = null;
        } catch (error) {
          console.warn('Error detaching deck.gl overlay:', error);
        }
      }
    };
  }, [mapInstance]);

  // Update layers when data changes
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || !mapInstance) return;

    if (!vehicleHeatmapData || vehicleHeatmapData.length === 0) {
      try {
        deck.setProps({ layers: [] });
      } catch (error) {
        console.warn('Error clearing deck.gl layers:', error);
      }
      return;
    }

    try {
      // Map data for deck.gl: [{ position: [lng, lat], weight }]
      const deckData = vehicleHeatmapData.map(d => ({
        position: [d.location.lng, d.location.lat],
        weight: d.weight
      }));

      const layer = new HeatmapLayer({
        id: 'vehicle-heatmap-layer',
        data: deckData,
        getPosition: d => d.position,
        getWeight: d => d.weight,
        radiusPixels: 150, //150
        intensity: 1.5, //1.5
        threshold: 0.05, //0.05
        colorRange: [
          [0, 255, 128, 50],
          [0, 255, 0, 120],
          [255, 255, 0, 160],
          [255, 200, 0, 200],
          [255, 100, 0, 220],
          [255, 0, 0, 240]
        ],
        aggregation: 'SUM',
        opacity: 0.5
      });
      
      deck.setProps({ layers: [layer] });
    } catch (error) {
      console.error('Error updating deck.gl heatmap layer:', error);
    }
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
  mapInstance
}) {
  // Stable icon objects to prevent marker re-renders
  const iconPlanned = useMemo(() => ({ 
    url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' 
  }), []);
  
  const iconAvailable = useMemo(() => ({ 
    url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' 
  }), []);

  const getIcon = useCallback((station) => {
    // Use status-based icons instead of fuel-based
    return station.status_code === 'P' ? iconPlanned : iconAvailable;
  }, [iconPlanned, iconAvailable]);

  const shouldShowMarkers = showHeatmap === 'markers' || showHeatmap === 'both';
  const shouldShowHeatmap = showHeatmap === 'heatmap' || showHeatmap === 'both';

  return (
    <GoogleMap
      onLoad={onLoad}
      mapContainerStyle={mapContainerStyle}
      center={US_CENTER}
      zoom={4}
    >
      {/* Markers - conditionally rendered based on showHeatmap mode */}
      {shouldShowMarkers && filteredStations.map((s, index) => (
        <Marker
          key={`${s.station_id || s.ID || 'unknown'}-${index}`}
          position={{ lat: s.lat, lng: s.lng }}
          icon={getIcon(s)}
          onClick={() => setSelectedStation(s)}
        />
      ))}

      {/* Info Window */}
      {selectedStation && (
        <InfoWindow
          position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
          onCloseClick={() => setSelectedStation(null)}
        >
          <div style={{ minWidth: "200px", maxWidth: "300px" }}>
            <h4 style={{ margin: "0 0 10px", color: "#333" }}>
              {selectedStation.station_name || "Station"}
            </h4>
            <p style={{ margin: "5px 0", fontSize: "13px" }}>
              <strong>Fuel Type:</strong> {selectedStation.fuel_type?.toUpperCase() || 'N/A'}
            </p>
            <p style={{ margin: "5px 0", fontSize: "13px" }}>
              <strong>Address:</strong> {selectedStation.street_address || 'N/A'}
            </p>
            <p style={{ margin: "5px 0", fontSize: "13px" }}>
              <strong>City:</strong> {selectedStation.city}, {selectedStation.state} {selectedStation.zip}
            </p>
            {selectedStation.station_phone && (
              <p style={{ margin: "5px 0", fontSize: "13px" }}>
                <strong>Phone:</strong> {selectedStation.station_phone}
              </p>
            )}
            <p style={{ margin: "5px 0", fontSize: "13px" }}>
              <strong>Status:</strong> {selectedStation.status_code === 'E' ? 'Available' : 
                                       selectedStation.status_code === 'P' ? 'Planned' : 'N/A'}
            </p>
            {selectedStation.access_code && (
              <p style={{ margin: "5px 0", fontSize: "13px" }}>
                <strong>Access:</strong> {selectedStation.access_code}
              </p>
            )}
            {selectedStation.status_code === 'P' && selectedStation.expected_date && (
              <p style={{ margin: "5px 0", fontSize: "13px" }}>
                <strong>Expected Date:</strong> {new Date(selectedStation.expected_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            )}
            <p style={{ margin: "5px 0", fontSize: "11px", color: "#666" }}>
              ID: {selectedStation.station_id}
            </p>
          </div>
        </InfoWindow>
      )}

      {/* Deck.gl Heatmap Overlay - conditionally rendered based on showHeatmap mode */}
      {shouldShowHeatmap && mapInstance && vehicleHeatmapData && vehicleHeatmapData.length > 0 && (
        <DeckGlOverlay
          mapInstance={mapInstance}
          vehicleHeatmapData={vehicleHeatmapData}
        />
      )}
    </GoogleMap>
  );
}
