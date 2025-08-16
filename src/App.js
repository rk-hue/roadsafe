import React, { useEffect, useState } from "react";
import { useAppContext } from "./context/AppContext";
import ReportForm from "./components/report_form";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { prepareFeatures } from "./utils/prepareFeatures";
import haversine from "haversine-distance";

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Map probability (0-1) to radius in meters for danger zone
const minRadiusMeters = 1000; // 1 km minimum radius
const maxRadiusMeters = 7000; // 7 km max radius

function probabilityToRadius(prob) {
  return minRadiusMeters + prob * (maxRadiusMeters - minRadiusMeters);
}

async function getHotspotRisk({ latitude, longitude, hour, month, day }) {
  try {
    const features = prepareFeatures(latitude, longitude);
    console.log("Sending prediction request with features:", features);

    const response = await fetch("http://127.0.0.1:8000/predict_hotspot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Received prediction response:", data);

    const prob = data.probability ?? 0;
    let level, color;

    if (prob > 0.66) {
      level = "High";
      color = "red";
    } else if (prob > 0.33) {
      level = "Medium";
      color = "orange";
    } else {
      level = "Low";
      color = "blue";
    }

    return { probability: prob, riskLevel: level, color };
  } catch (error) {
    console.error("Error fetching prediction:", error);
    return null;
  }
}

function MapClickHandler({ addPredictionMarker }) {
  useMapEvents({
    click: async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const now = new Date();
      const hour = now.getHours();
      const month = now.getMonth() + 1;
      const day = now.getDay();

      const prediction = await getHotspotRisk({
        latitude: lat,
        longitude: lng,
        hour,
        day,
        month,
      });

      if (prediction) {
        addPredictionMarker({
          lat,
          lng,
          probability: prediction.probability,
          riskLevel: prediction.riskLevel,
          color: prediction.color,
          placeName: "Clicked Location",
        });
      } else {
        alert("Failed to get hotspot prediction for this location.");
      }
    },
  });
  return null;
}

// New Floating Search Control with two buttons
function FloatingSearchControl({ onShowRoute, onShowHotspot }) {
  const map = useMapEvents({}); // just to attach control to map
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");

    container.style.position = "absolute";
    container.style.top = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.zIndex = 1000;
    container.style.background = "white";
    container.style.padding = "5px 10px";
    container.style.borderRadius = "8px";
    container.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "6px";

    // Input
    const input = L.DomUtil.create("input", "", container);
    input.type = "text";
    input.placeholder = "Enter destination address";
    input.style.width = "250px";
    input.style.padding = "4px 6px";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "6px";
    input.style.outline = "none";

    // Show Route Button
    const btnRoute = L.DomUtil.create("button", "", container);
    btnRoute.innerHTML = "Show Route";
    btnRoute.style.padding = "5px 12px";
    btnRoute.style.border = "none";
    btnRoute.style.background = "#007bff";
    btnRoute.style.color = "white";
    btnRoute.style.borderRadius = "6px";
    btnRoute.style.cursor = "pointer";

    // Show Hotspot Button
    const btnHotspot = L.DomUtil.create("button", "", container);
    btnHotspot.innerHTML = "Show Hotspot";
    btnHotspot.style.padding = "5px 12px";
    btnHotspot.style.border = "none";
    btnHotspot.style.background = "#28a745";
    btnHotspot.style.color = "white";
    btnHotspot.style.borderRadius = "6px";
    btnHotspot.style.cursor = "pointer";

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    input.oninput = (e) => {
      setInputValue(e.target.value);
    };

    btnRoute.onclick = () => {
      if (!input.value) return alert("Please enter an address.");
      onShowRoute(input.value);
    };

    btnHotspot.onclick = () => {
      if (!input.value) return alert("Please enter an address.");
      onShowHotspot(input.value);
    };

    map.getContainer().appendChild(container);

    // sync React state input with DOM input (on first render)
    input.value = inputValue;

    return () => {
      if (container.parentNode) container.parentNode.removeChild(container);
    };
  }, [map, onShowRoute, onShowHotspot, inputValue]);

  return null;
}

function App() {
  const { userLocation, setUserLocation } = useAppContext();
  const [reports, setReports] = useState([]);
  const [predictionMarkers, setPredictionMarkers] = useState([]);
  const [routeSegments, setRouteSegments] = useState([]); // {latlngs: [], color: ""}
  const db = getFirestore();

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserLocation({ lat: 39.5, lng: -98.35 }); // fallback center of US
      }
    );
  }, [setUserLocation]);

  // Fetch reports from Firebase
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "reports"));
        const reportData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(reportData);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };
    fetchReports();
  }, [db]);

  const addPredictionMarker = (marker) => {
    setPredictionMarkers((prev) => [...prev, marker]);
  };

  // Function to sample route points approximately every sampleDistMeters meters
  function sampleRoutePoints(latlngs, sampleDistMeters) {
    if (latlngs.length === 0) return [];

    let sampled = [latlngs[0]];
    let lastPoint = latlngs[0];
    let accDist = 0;

    for (let i = 1; i < latlngs.length; i++) {
      const dist = haversine(
        { lat: lastPoint[0], lon: lastPoint[1] },
        { lat: latlngs[i][0], lon: latlngs[i][1] }
      );
      accDist += dist;
      if (accDist >= sampleDistMeters) {
        sampled.push(latlngs[i]);
        accDist = 0;
        lastPoint = latlngs[i];
      }
    }

    if (
      sampled.length === 0 ||
      sampled[sampled.length - 1][0] !== latlngs[latlngs.length - 1][0] ||
      sampled[sampled.length - 1][1] !== latlngs[latlngs.length - 1][1]
    ) {
      sampled.push(latlngs[latlngs.length - 1]);
    }

    console.log(`Sampled ${sampled.length} points from route of length ${latlngs.length}`);

    return sampled;
  }

  // Handle address search -> fetch route -> color route segments by danger zones
  async function handleAddressSearch(address) {
    if (!userLocation) return alert("User location not set yet");

    const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjNhM2Y5ZmNkNWM0MzQ0Y2I5M2QxMWMzZWUyNDNhYzIzIiwiaCI6Im11cm11cjY0In0=&text=${encodeURIComponent(
      address
    )}&size=1`;

    const geocodeResp = await fetch(geocodeUrl);
    if (!geocodeResp.ok)
      return alert("Failed to geocode the address. Try again later.");
    const geocodeData = await geocodeResp.json();
    if (
      !geocodeData.features ||
      geocodeData.features.length === 0 ||
      !geocodeData.features[0].geometry
    )
      return alert("No results found for the address.");

    const destCoords = geocodeData.features[0].geometry.coordinates; // [lng, lat]

    const directionsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjNhM2Y5ZmNkNWM0MzQ0Y2I5M2QxMWMzZWUyNDNhYzIzIiwiaCI6Im11cm11cjY0In0=&start=${userLocation.lng},${userLocation.lat}&end=${destCoords[0]},${destCoords[1]}`;

    const directionsResp = await fetch(directionsUrl);
    if (!directionsResp.ok) return alert("Failed to get route. Try again later.");
    const directionsData = await directionsResp.json();

    if (
      !directionsData.features ||
      directionsData.features.length === 0 ||
      !directionsData.features[0].geometry
    )
      return alert("No route found.");

    const routeLatLngs = directionsData.features[0].geometry.coordinates.map(
      (c) => [c[1], c[0]]
    );

    const SAMPLE_DISTANCE_M = 500;
    const sampledPoints = sampleRoutePoints(routeLatLngs, SAMPLE_DISTANCE_M);

    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    const day = now.getDay();

    const predictions = await Promise.all(
      sampledPoints.map(async ([lat, lng]) => {
        const pred = await getHotspotRisk({ latitude: lat, longitude: lng, hour, month, day });
        return pred ?? { probability: 0 };
      })
    );

    console.log("Sampled points and predictions:");
    sampledPoints.forEach((pt, i) => {
      console.log(`Point ${i}: [${pt[0]}, ${pt[1]}], prob: ${predictions[i].probability}`);
    });

    const segments = [];
    const colorsPriority = ["blue", "orange", "red"];

    function getColorForProb(prob) {
      if (prob > 0.66) return "red";
      if (prob > 0.33) return "orange";
      return "blue";
    }

    for (let i = 0; i < sampledPoints.length - 1; i++) {
      const startProb = predictions[i].probability;
      const endProb = predictions[i + 1].probability;

      const startColor = getColorForProb(startProb);
      const endColor = getColorForProb(endProb);

      const segmentColor =
        colorsPriority.indexOf(startColor) > colorsPriority.indexOf(endColor)
          ? startColor
          : endColor;

      segments.push({
        latlngs: [sampledPoints[i], sampledPoints[i + 1]],
        color: segmentColor,
      });
    }

    setRouteSegments(segments);
  }

  // New function to show a single hotspot marker circle at the geocoded address
  async function handleShowHotspot(address) {
    if (!userLocation) return alert("User location not set yet");

    const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjNhM2Y5ZmNkNWM0MzQ0Y2I5M2QxMWMzZWUyNDNhYzIzIiwiaCI6Im11cm11cjY0In0=&text=${encodeURIComponent(
      address
    )}&size=1`;

    const geocodeResp = await fetch(geocodeUrl);
    if (!geocodeResp.ok)
      return alert("Failed to geocode the address. Try again later.");
    const geocodeData = await geocodeResp.json();
    if (
      !geocodeData.features ||
      geocodeData.features.length === 0 ||
      !geocodeData.features[0].geometry
    )
      return alert("No results found for the address.");

    const coords = geocodeData.features[0].geometry.coordinates; // [lng, lat]
    const lat = coords[1];
    const lng = coords[0];

    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    const day = now.getDay();

    const prediction = await getHotspotRisk({ latitude: lat, longitude: lng, hour, month, day });

    if (!prediction) {
      alert("Failed to get hotspot prediction for this location.");
      return;
    }

    // Clear existing route segments (if any) when showing hotspot
    setRouteSegments([]);

    // Add the prediction marker circle with placeName for popup
    addPredictionMarker({
      lat,
      lng,
      probability: prediction.probability,
      riskLevel: prediction.riskLevel,
      color: prediction.color,
      placeName: address,
    });
  }

  if (!userLocation) return <p>Loading your location...</p>;

  return (
    <div>
      <h1>RoadSafe Wildlife</h1>
      <p>Protecting animals. Saving lives. One road at a time.</p>

      <ReportForm />

      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={8}
        style={{ height: "500px", width: "100%", marginTop: "20px" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FloatingSearchControl
          onShowRoute={handleAddressSearch}
          onShowHotspot={handleShowHotspot}
        />

        <MapClickHandler addPredictionMarker={addPredictionMarker} />

        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>You are here</Popup>
        </Marker>

        {reports
          .sort((a, b) => new Date(a.time) - new Date(b.time))
          .map((report) => (
            <Marker
              key={report.id}
              position={[report.location.lat, report.location.lng]}
            >
              <Popup>
                <strong>{report.type}</strong>
                <br />
                {report.status}
                <br />
                {new Date(report.time).toLocaleString()}
              </Popup>
            </Marker>
          ))}

        {predictionMarkers.map((marker, idx) => {
          const alertRadiusMeters = probabilityToRadius(marker.probability);
          return (
            <Circle
              key={`prediction-${idx}`}
              center={[marker.lat, marker.lng]}
              radius={alertRadiusMeters}
              pathOptions={{
                color: marker.color,
                fillColor: marker.color,
                fillOpacity: 0.3,
              }}
            >
              <Popup>
                <strong>{marker.placeName}</strong>
                <br />
                Predicted Risk: {(marker.probability * 100).toFixed(0)}% (
                {marker.riskLevel})
              </Popup>
            </Circle>
          );
        })}

        {/* Draw route segments */}
        {routeSegments.map((seg, idx) => (
          <Polyline
            key={`route-seg-${idx}`}
            positions={seg.latlngs}
            pathOptions={{ color: seg.color, weight: 6, opacity: 0.7 }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
