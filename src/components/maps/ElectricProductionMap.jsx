"use client";

import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

const LIBRARIES = ['places', 'visualization'];
const US_CENTER = { lat: 39.8283, lng: -98.5795 };
const MIN_PIN_SIZE = 2;
const MAX_PIN_SIZE = 12;

// Map fills remaining space
const MAP_CONTAINER_STYLE = {
  width: '100%',
  flexGrow: 1,   
  height: '100%', 
  borderRadius: '12px',
};

const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
};

export default function ElectricProductionMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPlant, setHoveredPlant] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/electric-production-plants');
        const result = await response.json();
        if (result.success) {
          setPlants(result.data);
        }
      } catch (err) {
        console.error("Failed to load Electric plants", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getIcon = (generation) => {
    if (!window.google) return null;
    const safeGen = Math.max(Math.abs(generation || 0), 1); 
    const scale = Math.log(safeGen) / Math.log(1000000); 
    let size = MIN_PIN_SIZE + (scale * (MAX_PIN_SIZE - MIN_PIN_SIZE));
    size = Math.max(MIN_PIN_SIZE, Math.min(size, MAX_PIN_SIZE));

    return {
      url: '/images/round1.png',
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2),
    };
  };

  if (!isLoaded) return <div style={{ height: '100%', background: '#f1f5f9', borderRadius: '12px' }} />;

  return (
    // [FIX] Added height: 100%, display: flex, and flexDirection: column
    <div style={{ 
      background: 'white', 
      padding: '24px', 
      borderRadius: '16px', 
      border: '1px solid #e2e8f0', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      height: '100%',         // Fixes the visibility issue
      display: 'flex',        // Enables flex layout
      flexDirection: 'column' // Stacks header and map vertically
    }}>
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Electric Infrastructure</h2>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Production Plants as of 2024
        </p>
      </div>

      <GoogleMap 
        mapContainerStyle={MAP_CONTAINER_STYLE} 
        center={US_CENTER} 
        zoom={4} 
        options={MAP_OPTIONS}
      >
        {loading && (
          <div style={{
            position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, background: 'white', padding: '8px 16px', borderRadius: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)', fontWeight: '600', color: '#64748b'
          }}>
            Loading Plants...
          </div>
        )}

        {plants.map((plant, index) => (
          <Marker
            key={`${plant.plant_code}-${index}`}
            position={{ lat: plant.latitude, lng: plant.longitude }}
            icon={getIcon(plant.gross_generation)}
            onMouseOver={() => setHoveredPlant(plant)}
            onMouseOut={() => setHoveredPlant(null)}
            zIndex={1}
          />
        ))}

        {hoveredPlant && (
          <InfoWindow
            position={{ lat: hoveredPlant.latitude, lng: hoveredPlant.longitude }}
            options={{ disableAutoPan: true, pixelOffset: new window.google.maps.Size(0, -15) }}
            onCloseClick={() => setHoveredPlant(null)}
          >
            <div style={{ padding: '8px', minWidth: '200px' }}>
              <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                {hoveredPlant.plant_name}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', display: 'grid', gap: '4px' }}>
                <div><span style={{ fontWeight: '600' }}>State:</span> {hoveredPlant.state}</div>
                <div>
                  <span style={{ fontWeight: '600' }}>Gross Generation:</span> 
                  <span style={{ color: '#0f172a', fontWeight: '600', marginLeft: '4px' }}>
                    {hoveredPlant.gross_generation?.toLocaleString()} MWh
                  </span>
                </div>
                {hoveredPlant.nameplate_capacity !== null && (
                  <div><span style={{ fontWeight: '600' }}>Nameplate Capacity:</span> {hoveredPlant.nameplate_capacity?.toLocaleString()} MW</div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}