"use client";

import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { mapContainerStyle, DEFAULT_CENTER, iconMap } from '@/constants/mapConfig';

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

  const getIcon = (fuelType) => {
    const key = getFuelTypeKey(fuelType);
    return iconMap[key] || iconMap.unknown;
  };

  return (
    <GoogleMap
      onLoad={onLoad}
      mapContainerStyle={mapContainerStyle}
      center={DEFAULT_CENTER}
      zoom={4}
    >
      {/* Markers */}
      {filteredStations.map((s, index) => (
        <Marker
          key={s.station_id || index}
          position={{ lat: s.lat, lng: s.lng }}
          icon={{ url: getIcon(s.fuel_type) }}
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
              <strong>Status:</strong> {selectedStation.status_code || 'N/A'}
            </p>
            {selectedStation.access_code && (
              <p style={{ margin: "5px 0", fontSize: "13px" }}>
                <strong>Access:</strong> {selectedStation.access_code}
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
