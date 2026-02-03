"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from "@react-google-maps/api";
import { STATE_COORDINATES } from '@/constants/stateCoords';

// --- CONFIGURATION ---
const LIBRARIES = ['places', 'visualization'];
const US_CENTER = { lat: 39.8283, lng: -98.5795 };
const MIN_PIN_SIZE = 5;
const MAX_PIN_SIZE = 25;

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

// --- STYLES ---
const PIPELINE_OPTIONS = {
  strokeColor: "#dc2626", // Vivid Red
  strokeOpacity: 0.8,
  strokeWeight: 4,
  clickable: true,
  zIndex: 1
};

const PIPELINE_HOVER_OPTIONS = {
  strokeColor: "#991b1b", 
  strokeOpacity: 1.0,
  strokeWeight: 6,
  zIndex: 10
};

// --- INTERNAL COMPONENT: SINGLE MAP INSTANCE ---
const SingleMap = ({ title, type, data, pipelines = [], isLoaded, isLoading }) => {
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [hoveredPipeline, setHoveredPipeline] = useState(null);
  const [pipelineMousePos, setPipelineMousePos] = useState(null);

  // 1. Process Pins (Production Data)
  const { plotData, minVal, maxVal } = useMemo(() => {
    if (!data || data.length === 0) return { plotData: [], minVal: 0, maxVal: 0 };
    
    const mapped = data.map(item => {
      if (!item.state) return null;
      const stateCode = item.state.toString().trim().toUpperCase();
      const coords = STATE_COORDINATES[stateCode];
      if (!coords) return null;
      return {
        id: stateCode, 
        state: stateCode,
        production: item.production || 0,
        lat: coords.lat,
        lng: coords.lng
      };
    }).filter(Boolean);

    const productions = mapped.map(d => d.production);
    return { 
      plotData: mapped, 
      minVal: Math.min(...productions), 
      maxVal: Math.max(...productions) 
    };
  }, [data]);

  
  // [DEBUG VERSION] Process Pipelines
  const processedPipelines = useMemo(() => {
    if (!pipelines || pipelines.length === 0) return [];

    // Helper: recursively find all arrays that look like [[num, num], [num, num]...]
    const extractPaths = (coords) => {
      if (!Array.isArray(coords) || coords.length === 0) return [];

      // Check if this current array IS a path (array of points)
      // A point is [number, number]. So a path is [[num, num], ...]
      const firstItem = coords[0];
      
      // Safety check for empty inner arrays
      if (!firstItem) return [];

      const isPoint = Array.isArray(firstItem) && 
                      firstItem.length >= 2 && 
                      typeof firstItem[0] === 'number';

      if (isPoint) {
        // We found a valid path! Return it wrapped in an array.
        return [coords];
      }

      // If not a path, it might be a container (MultiLineString). Dig deeper.
      if (Array.isArray(firstItem)) {
        return coords.flatMap(child => extractPaths(child));
      }

      return [];
    };

    const drawablePaths = [];

    pipelines.forEach((pipe, i) => {
      try {
        if (!pipe.coordinates) return;

        // Parse JSON if needed
        const rawCoords = typeof pipe.coordinates === 'string' 
          ? JSON.parse(pipe.coordinates) 
          : pipe.coordinates;

        // Extract all valid paths regardless of nesting depth
        const paths = extractPaths(rawCoords);

        // Map them to Google Maps format {lat, lng}
        paths.forEach(pathSegment => {
          // Double check it's a valid path with length
          if (pathSegment.length > 0) {
            const googlePath = pathSegment.map(c => ({
              lat: c[1], // Index 1 is Latitude (Y)
              lng: c[0]  // Index 0 is Longitude (X)
            }));
            drawablePaths.push({ ...pipe, path: googlePath });
          }
        });

      } catch (e) {
        console.warn(`Row ${i} failed to process`, e);
      }
    });

    console.log(`[Pipeline Status] Input Rows: ${pipelines.length} -> Drawable Segments: ${drawablePaths.length}`);
    
    return drawablePaths;
  }, [pipelines]);
  


  // 3. Dynamic Icon Sizing
  const getIconForValue = (value) => {
    if (!isLoaded || !window.google) return null;
    let size = MIN_PIN_SIZE;
    if (maxVal > minVal && value > 0) {
      const logMin = Math.log(Math.max(minVal, 1)); 
      const logMax = Math.log(maxVal);
      const logVal = Math.log(Math.max(value, 1));
      const scale = (logVal - logMin) / (logMax - logMin);
      size = MIN_PIN_SIZE + (scale * (MAX_PIN_SIZE - MIN_PIN_SIZE));
    }
    return {
      url: '/images/round.png',
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2),
    };
  };

  if (!isLoaded) return <div style={{ height: '600px', background: '#f1f5f9', borderRadius: '12px' }} />;

  return (
    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          {type === 'cng' ? 'Includes Production Plants & Pipelines' : 'Includes Production Plants Only'}
        </p>
      </div>

      <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={US_CENTER} zoom={4} options={MAP_OPTIONS}>
        {isLoading && (
          <div style={{
            position: 'absolute', 
            top: '10px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 16px',
            borderRadius: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#0891b2',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '14px', 
              height: '14px', 
              border: '2px solid #cbd5e1', 
              borderTopColor: '#0891b2', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite'
            }}></div>
            Loading Pipeline Data...
          </div>
        )}
        {/* Render Pipelines */}
        {processedPipelines.map((pipe, idx) => (
          <Polyline
            key={`pipe-${idx}`}
            path={pipe.path}
            options={hoveredPipeline?.feature_id === pipe.feature_id ? PIPELINE_HOVER_OPTIONS : PIPELINE_OPTIONS}
            onMouseOver={(e) => { setHoveredPipeline(pipe); setPipelineMousePos(e.latLng); }}
            onMouseOut={() => { setHoveredPipeline(null); setPipelineMousePos(null); }}
          />
        ))}

        {/* Render Pins */}
        {plotData.map((point) => (
          <Marker
            key={point.id}
            position={{ lat: point.lat, lng: point.lng }}
            icon={getIconForValue(point.production)}
            onMouseOver={() => setHoveredMarker(point)}
            onMouseOut={() => setHoveredMarker(null)}
            zIndex={Math.floor(point.production) + 100}
          />
        ))}

        {/* Marker Popup */}
        {hoveredMarker && (
          <InfoWindow
            position={{ lat: hoveredMarker.lat, lng: hoveredMarker.lng }}
            options={{ disableAutoPan: true, pixelOffset: new window.google.maps.Size(0, -20) }}
            onCloseClick={() => setHoveredMarker(null)}
          >
            <div style={{ padding: '8px 4px', minWidth: '160px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                {hoveredMarker.state}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                <div style={{ fontWeight: '600', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>2024 Production</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                  {hoveredMarker.production?.toLocaleString()}
                  <span style={{ fontSize: '13px', marginLeft: '4px', fontWeight: '500', color: '#64748b' }}>
                    {type === 'cng' ? 'MMcf' : 'MWh'}
                  </span>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Pipeline Popup */}
        {hoveredPipeline && pipelineMousePos && (
          <InfoWindow position={pipelineMousePos} options={{ disableAutoPan: true, pixelOffset: new window.google.maps.Size(0, -10) }} onCloseClick={() => setHoveredPipeline(null)}>
            <div style={{ padding: '8px 4px', maxWidth: '250px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>CNG Pipeline</div>
              <div style={{ display: 'grid', gap: '4px', fontSize: '12px' }}>
                <div><span style={{ fontWeight: '600', color: '#475569' }}>Operator: </span>{hoveredPipeline.company_operator || 'Unknown'}</div>
                <div><span style={{ fontWeight: '600', color: '#475569' }}>Status: </span>
                  <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontWeight: '600', fontSize: '11px' }}>
                    {hoveredPipeline.operational_status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* --- LEGEND --- */}
      <div style={{ 
        marginTop: '16px', padding: '12px', background: '#f8fafc', 
        borderRadius: '8px', fontSize: '13px', color: '#64748b',
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/images/round.png" alt="Point" style={{ width: '20px', height: '20px' }} />
          <span>Production Plant (Log Scale)</span>
        </div>

        {type === 'cng' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '4px', background: '#dc2626', borderRadius: '2px' }}></div>
            <span style={{ color: '#dc2626', fontWeight: '600' }}>CNG Pipelines</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ProductionMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [cngData, setCngData] = useState([]);
  const [electricData, setElectricData] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true); // Initial page load
  const [pipelinesLoading, setPipelinesLoading] = useState(true); // Specific to pipelines

  // Fetch All Data on Mount
  // Fetch All Data on Mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. Fetch Point Data first (Fast)
        const [cngRes, elecRes] = await Promise.all([
          fetch('/api/production-map?type=cng').then(r => r.json()),
          fetch('/api/production-map?type=electric').then(r => r.json()),
        ]);

        if (cngRes.success) setCngData(cngRes.data);
        if (elecRes.success) setElectricData(elecRes.data);
        
        // Stop the main "page loading" spinner here so the map appears quickly
        setLoading(false); 

        // 2. Fetch Pipelines (Slow) - keep pipelinesLoading true
        const pipeRes = await fetch('/api/cng-pipelines').then(r => r.json());
        if (pipeRes.success) setPipelines(pipeRes.data);
        
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setLoading(false); // Ensure main loader stops on error
      } finally {
        setPipelinesLoading(false); // Stop pipeline spinner
      }
    };
    fetchAll();
  }, []);

  if (loading && !isLoaded) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Dashboard...</div>;

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1600px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em' }}>
          Production Infrastructure
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '800px' }}>
          Visualizing energy production capacity and distribution networks across the United States.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* MAP 1: CNG */}
        <section>
          <SingleMap 
            title="CNG Infrastructure" 
            type="cng" 
            data={cngData} 
            pipelines={pipelines} 
            isLoaded={isLoaded} 
            isLoading={pipelinesLoading}
          />
        </section>

        {/* MAP 2: ELECTRIC */}
        <section>
          <SingleMap 
            title="Electric Infrastructure" 
            type="electric" 
            data={electricData} 
            pipelines={[]} 
            isLoaded={isLoaded} 
          />
        </section>

      </div>
    </div>
  );
}