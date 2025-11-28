"use client";

import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
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

export default function MapView({ 
  onLoad, 
  filteredStations, 
  selectedStation, 
  setSelectedStation 
}) {
  const getFuelTypeKey = (fuelType) => {
    if (!fuelType) return 'unknown';
    return fuelType.toLowerCase();
  };

  const getIcon = (station) => {
    // Use status-based icons instead of fuel-based
    if (station.status_code === 'P') {
      // Planned station - yellow marker
      return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    } else {
      // Available/Existing station - green marker (default for all other statuses)
      return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
    }
  };

  return (
    <GoogleMap
      onLoad={onLoad}
      mapContainerStyle={mapContainerStyle}
      center={US_CENTER}
      zoom={4}
    >
      {/* Markers */}
      {filteredStations.map((s, index) => (
        <Marker
          key={`${s.station_id || s.ID || 'unknown'}-${index}`}
          position={{ lat: s.lat, lng: s.lng }}
          icon={{ url: getIcon(s) }}
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
    </GoogleMap>
  );
}
