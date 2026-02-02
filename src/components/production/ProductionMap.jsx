"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { STATE_COORDINATES } from '@/constants/stateCoords';

const mapContainerStyle = {
  width: '100%',
  height: '75vh',
  borderRadius: '12px', // Slightly rounded corners for the map
};

const US_CENTER = {
  lat: 39.8283,
  lng: -98.5795,
};

const options = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
};

const libraries = ['places', 'visualization']; 

export default function ProductionMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [productionType, setProductionType] = useState('cng'); // 'cng' or 'electric'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState(null);

  // Fetch data when type changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/production-map?type=${productionType}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch production data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productionType]);

  // Merge API Data with Coordinate Data
  // Process Data Points
  const plotData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const mapped = data.map(item => {
      // [CHANGE] Look for lowercase 'state' (matching the new API alias)
      if (!item.state) return null;

      // Normalize: Remove spaces, force uppercase (e.g. " al " -> "AL")
      const stateCode = item.state.toString().trim().toUpperCase();
      
      const coords = STATE_COORDINATES[stateCode];

      if (!coords) {
        console.warn(`[ProductionMap] No coordinates found for state code: "${stateCode}"`);
        return null;
      }

      return {
        id: stateCode, 
        state: stateCode,
        // [CHANGE] Look for lowercase 'production'
        production: item.production, 
        lat: coords.lat,
        lng: coords.lng
      };
    }).filter(Boolean); 

    console.log(`[ProductionMap] Successfully mapped ${mapped.length} points.`);
    return mapped;
  }, [data]);

  // Marker Icon
  const markerIcon = {
    url: '/images/round.png',
    scaledSize: isLoaded ? new window.google.maps.Size(24, 24) : null,
    anchor: isLoaded ? new window.google.maps.Point(12, 12) : null,
  };

  if (!isLoaded) return <div style={{ padding: '20px' }}>Loading Map...</div>;

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header & Toggle Controls */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
            Production Plants
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>
            State-wise production distribution for 2024
          </p>
        </div>

        {/* Toggle Bar */}
        <div style={{ 
          display: 'flex', 
          background: '#e2e8f0', 
          padding: '4px', 
          borderRadius: '8px',
          gap: '4px'
        }}>
          <button
            onClick={() => setProductionType('cng')}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              background: productionType === 'cng' ? 'white' : 'transparent',
              color: productionType === 'cng' ? '#0f172a' : '#64748b',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: productionType === 'cng' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            CNG (MMcf)
          </button>
          <button
            onClick={() => setProductionType('electric')}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              background: productionType === 'electric' ? 'white' : 'transparent',
              color: productionType === 'electric' ? '#0f172a' : '#64748b',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: productionType === 'electric' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Electric (MWh)
          </button>
        </div>
      </div>

      {/* Map Section */}
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        border: '1px solid #e2e8f0'
      }}>
        
        {loading && (
          <div style={{
            position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, background: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderRadius: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: '600', fontSize: '14px', color: '#0f172a',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{
              width: '12px', height: '12px', border: '2px solid #cbd5e1', 
              borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            Loading Data...
          </div>
        )}

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={US_CENTER}
          zoom={4}
          options={options}
        >
          {plotData.map((point, idx) => (
            <Marker
              key={`${productionType}-${point.state}-${idx}`}
              position={{ lat: point.lat, lng: point.lng }}
              icon={markerIcon}
              onMouseOver={() => setHoveredMarker(point)}
              onMouseOut={() => setHoveredMarker(null)}
            />
          ))}

          {/* InfoWindow Popup */}
          {hoveredMarker && (
            <InfoWindow
              position={{ lat: hoveredMarker.lat, lng: hoveredMarker.lng }}
              options={{ disableAutoPan: true, pixelOffset: new window.google.maps.Size(0, -15) }}
              onCloseClick={() => setHoveredMarker(null)}
            >
              <div style={{ padding: '8px 4px', minWidth: '160px' }}>
                <div style={{ 
                  fontSize: '16px', fontWeight: '700', color: '#0f172a', 
                  marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' 
                }}>
                  {hoveredMarker.state}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  <div style={{ fontWeight: '600', color: '#475569', marginBottom: '2px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                    2024 Production
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                    {hoveredMarker.production.toLocaleString()}
                    <span style={{ fontSize: '13px', marginLeft: '4px', fontWeight: '500', color: '#64748b' }}>
                        {productionType === 'cng' ? 'MMcf' : 'MWh'}
                    </span>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
        
        {/* Helper Legend/Note */}
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#f8fafc', 
          borderRadius: '8px', 
          fontSize: '13px', 
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img src="/images/round.png" alt="Point" style={{ width: '16px', height: '16px' }} />
          <span>Each point represents a production facility location. Hover to view production volume.</span>
        </div>
      </div>
      
      {/* Add keyframe animation for the loading spinner */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}