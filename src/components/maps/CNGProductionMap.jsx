"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from "@react-google-maps/api";

const LIBRARIES = ['places', 'visualization'];
const US_CENTER = { lat: 39.8283, lng: -98.5795 };

const MIN_PIN_SIZE = 5;
const MAX_PIN_SIZE = 20;


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

const PIPELINE_OPTIONS = {
  strokeColor: "#dc2626", 
  strokeOpacity: 0.8,
  strokeWeight: 1,        
  clickable: true,
  zIndex: 1
};

const PIPELINE_HOVER_OPTIONS = {
  strokeColor: "#991b1b", 
  strokeOpacity: 1.0,
  strokeWeight: 4,        
  zIndex: 10
};

export default function CNGProductionMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [plants, setPlants] = useState([]);
  const [pipelines, setPipelines] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [hoveredPlant, setHoveredPlant] = useState(null);
  const [hoveredPipeline, setHoveredPipeline] = useState(null);
  const [pipelineMousePos, setPipelineMousePos] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plantsRes, pipesRes] = await Promise.all([
          fetch('/api/cng-production-plants').then(r => r.json()),
          fetch('/api/cng-pipelines').then(r => r.json())
        ]);

        if (plantsRes.success) setPlants(plantsRes.data);
        if (pipesRes.success) setPipelines(pipesRes.data);
        
      } catch (err) {
        console.error("Failed to load map data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processedPipelines = useMemo(() => {
    if (!pipelines || pipelines.length === 0) return [];

    const extractPaths = (coords) => {
      if (!Array.isArray(coords) || coords.length === 0) return [];
      const firstItem = coords[0];
      if (!firstItem) return [];

      const isPoint = Array.isArray(firstItem) && 
                      firstItem.length >= 2 && 
                      typeof firstItem[0] === 'number';

      if (isPoint) return [coords];
      
      if (Array.isArray(firstItem)) {
        return coords.flatMap(child => extractPaths(child));
      }
      return [];
    };

    const drawablePaths = [];

    pipelines.forEach((pipe, i) => {
      try {
        if (!pipe.coordinates) return;

        const rawCoords = typeof pipe.coordinates === 'string' 
          ? JSON.parse(pipe.coordinates) 
          : pipe.coordinates;

        const paths = extractPaths(rawCoords);

        paths.forEach(pathSegment => {
          if (pathSegment.length > 0) {
            const googlePath = pathSegment.map(c => ({
              lat: c[1], 
              lng: c[0]  
            }));
            drawablePaths.push({ ...pipe, path: googlePath });
          }
        });
      } catch (e) {
        console.warn(`Pipeline Row ${i} failed`, e);
      }
    });
    
    return drawablePaths;
  }, [pipelines]);


  const getIcon = (capacity) => {
    if (!window.google) return null;
    const safeCapacity = Math.max(Math.abs(capacity || 0), 1); 
    const scale = Math.log(safeCapacity) / Math.log(100000); 
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

    <div style={{ 
      background: 'white', 
      padding: '24px', 
      borderRadius: '16px', 
      border: '1px solid #e2e8f0', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      height: '100%',        // Fill the Grid Cell
      display: 'flex',       // Enable Flexbox
      flexDirection: 'column' // Stack Header and Map vertically
    }}>
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>CNG Infrastructure</h2>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Production Plants and Pipelines as of 2017 (*latest publicly available data - EIA 757)
        </p>
      </div>

      {/* The Map Container now uses flexGrow: 1 from styles to fill the rest of the height */}
      <GoogleMap 
        mapContainerStyle={MAP_CONTAINER_STYLE} 
        center={US_CENTER} 
        zoom={4} 
        options={MAP_OPTIONS}
      >
        {loading && (
          <div style={{
            position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, background: 'white', padding: '8px 16px', borderRadius: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)', fontWeight: '600', color: '#64748b'
          }}>
            Loading Data...
          </div>
        )}

        {processedPipelines.map((pipe, idx) => (
          <Polyline
            key={`pipe-${idx}`}
            path={pipe.path}
            options={hoveredPipeline?.feature_id === pipe.feature_id ? PIPELINE_HOVER_OPTIONS : PIPELINE_OPTIONS}
            onMouseOver={(e) => { 
              setHoveredPipeline(pipe); 
              setPipelineMousePos(e.latLng); 
            }}
            onMouseOut={() => { 
              setHoveredPipeline(null); 
              setPipelineMousePos(null); 
            }}
          />
        ))}

        {plants.map((plant, index) => (
          <Marker
            key={`${plant.plant_name}-${index}`}
            position={{ lat: plant.latitude, lng: plant.longitude }}
            icon={getIcon(plant.capacity)}
            onMouseOver={() => setHoveredPlant(plant)}
            onMouseOut={() => setHoveredPlant(null)}
            zIndex={100} 
          />
        ))}

        {hoveredPlant && (
          <InfoWindow
            position={{ lat: hoveredPlant.latitude, lng: hoveredPlant.longitude }}
            options={{ disableAutoPan: true, pixelOffset: new window.google.maps.Size(0, -5) }}
            onCloseClick={() => setHoveredPlant(null)}
          >
            <div style={{ padding: '8px', minWidth: '200px' }}>
              <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                {hoveredPlant.plant_name}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', display: 'grid', gap: '4px' }}>
                <div><span style={{ fontWeight: '600' }}>State:</span> {hoveredPlant.state}</div>
                <div><span style={{ fontWeight: '600' }}>Capacity:</span> {hoveredPlant.capacity?.toLocaleString()}</div>
                {hoveredPlant.liquid_storage !== null && hoveredPlant.liquid_storage !== undefined && (
                  <div>
                    <span style={{ fontWeight: '600' }}>NG Liquid Storage:</span> 
                    <span style={{ marginLeft: '4px' }}>{hoveredPlant.liquid_storage.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}

        {hoveredPipeline && pipelineMousePos && (
          <InfoWindow 
            position={pipelineMousePos} 
            options={{ disableAutoPan: true, pixelOffset: new window.google.maps.Size(0, -10) }} 
            onCloseClick={() => setHoveredPipeline(null)}
          >
            <div style={{ padding: '8px 4px', maxWidth: '250px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                CNG Pipeline
              </div>
              <div style={{ display: 'grid', gap: '4px', fontSize: '12px' }}>
                <div><span style={{ fontWeight: '600', color: '#475569' }}>Operator: </span>{hoveredPipeline.company_operator || 'Unknown'}</div>
                <div>
                  <span style={{ fontWeight: '600', color: '#475569' }}>Status: </span>
                  <span style={{ padding: '1px 6px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontWeight: '600', fontSize: '11px' }}>
                    {hoveredPipeline.operational_status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}

      </GoogleMap>
    </div>
  );
}