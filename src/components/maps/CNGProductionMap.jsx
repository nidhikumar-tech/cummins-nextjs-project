"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

const LIBRARIES = ['places', 'visualization'];
const US_CENTER = { lat: 39.8283, lng: -98.5795 };
const MIN_PIN_SIZE = 8;  // Minimum size for visibility
const MAX_PIN_SIZE = 30; // Maximum size to prevent clutter

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '600px', 
  borderRadius: '12px',
};

const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
};

export default function CNGProductionMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPlant, setHoveredPlant] = useState(null);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cng-production-plants');
        const result = await response.json();
        if (result.success) {
          setPlants(result.data);
        }
      } catch (err) {
        console.error("Failed to load CNG plants", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Calculate Pin Sizes (Logarithmic Scale handles negative/large variance best)
  const getIcon = (capacity) => {
    if (!window.google) return null;

    // Normalize capacity: treat negative values as absolute for sizing, or set a minimum baseline
    const safeCapacity = Math.max(Math.abs(capacity || 0), 1); 
    
    // Log scale calculation
    // You can adjust the divider (e.g., / 1000) based on your actual data range
    const scale = Math.log(safeCapacity) / Math.log(100000); 
    
    // Clamp size between MIN and MAX
    let size = MIN_PIN_SIZE + (scale * (MAX_PIN_SIZE - MIN_PIN_SIZE));
    size = Math.max(MIN_PIN_SIZE, Math.min(size, MAX_PIN_SIZE));

    return {
      url: '/images/round.png',
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2),
    };
  };

  if (!isLoaded) return <div style={{ height: '600px', background: '#f1f5f9', borderRadius: '12px' }} />;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>CNG Production Plants</h2>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Visualizing plant capacity across the US. Larger pins indicate higher capacity.
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
            background: 'white', padding: '8px 16px', borderRadius: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)', fontWeight: '600', color: '#64748b'
          }}>
            Loading Plants...
          </div>
        )}

        {plants.map((plant, index) => (
          <Marker
            key={`${plant.plant_name}-${index}`}
            position={{ lat: plant.latitude, lng: plant.longitude }}
            icon={getIcon(plant.capacity)}
            onMouseOver={() => setHoveredPlant(plant)}
            onMouseOut={() => setHoveredPlant(null)}
            zIndex={Math.floor(Math.abs(plant.capacity || 0))} // Put larger capacity on top
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
                  <span style={{ fontWeight: '600' }}>Capacity:</span> 
                  <span style={{ color: '#0f172a', fontWeight: '600', marginLeft: '4px' }}>
                    {hoveredPlant.capacity?.toLocaleString()}
                  </span>
                </div>
                {hoveredPlant.liquid_storage !== null && (
                  <div><span style={{ fontWeight: '600' }}>Liquid Storage:</span> {hoveredPlant.liquid_storage}</div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}