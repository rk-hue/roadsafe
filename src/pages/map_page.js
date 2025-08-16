import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function MapPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Location error:", error);
        // Default to somewhere central in the U.S.
        setUserLocation({ lat: 39.5, lng: -98.35 });
      }
    );

    // Simulate loading reports (replace with Firebase later)
    setReports([
      {
        type: 'deer',
        location: { lat: 39.7, lng: -98.5 },
      },
      {
        type: 'raccoon',
        location: { lat: 39.4, lng: -98.3 },
      },
    ]);
  }, []);

  return (
    <div>
      <h2>Wildlife Hazard Map</h2>
      {userLocation && (
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={6}
          style={{ height: '500px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.map((report, index) => (
            <Marker
              key={index}
              position={[report.location.lat, report.location.lng]}
            >
              <Popup>{report.type} reported here</Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}