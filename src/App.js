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
import "./App.css";
import CommunityVoting from "./community_voting";




const BASE_URL = process.env.REACT_APP_API_URL || "https://roadsafe-app.onrender.com";




const PREDICT_PATH = process.env.REACT_APP_PREDICT_PATH || "";
const PREDICT_URL = `${BASE_URL}${PREDICT_PATH}`;
console.log("[RoadSafe] Using backend:", PREDICT_URL);




delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});




// danger zones
const minRadiusMeters = 1000;
const maxRadiusMeters = 7000;




function probabilityToRadius(prob) {
  return minRadiusMeters + prob * (maxRadiusMeters - minRadiusMeters);
}




async function getHotspotRisk({ latitude, longitude, hour, month, day }) {
  try {
    const features = prepareFeatures(latitude, longitude);
    console.log("Sending prediction request with features:", features);




    const response = await fetch(PREDICT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });




    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Server responded with status ${response.status} ${response.statusText} — ${text}`
      );
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
    } else{
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




function App() {
  const { userLocation, setUserLocation } = useAppContext();
  const [reports, setReports] = useState([]);
  const [predictionMarkers, setPredictionMarkers] = useState([]);
  const [routeSegments, setRouteSegments] = useState([]);
  const db = getFirestore();




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




  // get firebase reports
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




    console.log(
      `Sampled ${sampled.length} points from route of length ${latlngs.length}`
    );




    return sampled;
  }




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
        const pred = await getHotspotRisk({
          latitude: lat,
          longitude: lng,
          hour,
          month,
          day,
        });
        return pred ?? { probability: 0 };
      })
    );




    console.log("Sampled points and predictions:");
    sampledPoints.forEach((pt, i) => {
      console.log(
        `Point ${i}: [${pt[0]}, ${pt[1]}], prob: ${predictions[i].probability}`
      );
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




    const coords = geocodeData.features[0].geometry.coordinates;
    const lat = coords[1];
    const lng = coords[0];




    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    const day = now.getDay();




    const prediction = await getHotspotRisk({
      latitude: lat,
      longitude: lng,
      hour,
      month,
      day,
    });




    if (!prediction) {
      alert("Failed to get hotspot prediction for this location.");
      return;
    }




    setRouteSegments([]);




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
      <h1>RoadSafe</h1>
      <p>Protecting animals. Saving lives. One road at a time.</p>
      <h2>Real-time Crash Prediction</h2>
 
      <div
        className="app-layout"
        style={{
          display: "flex",
          width: "75vw",
          height: "400px",
          marginTop: "20px",
          marginLeft: "auto",
          marginRight: "auto",
          marginBottom: "40px",
        }}
      >
        {/* map panel */}
        <div
          className="map-panel"
          style={{
            flex: "3",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginRight: "10px",
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={8}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              const colorMap = {
                red: "#de6868",
                orange: "#de9168",
                blue: "#6895de"
              };
              return (
                <Circle
                  key={`prediction-${idx}`}
                  center={[marker.lat, marker.lng]}
                  radius={alertRadiusMeters}
                  pathOptions={{
                    color: colorMap[marker.color],
                    fillColor: colorMap[marker.color],
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
 
            {routeSegments.map((seg, idx) => (
              <Polyline
                key={`route-seg-${idx}`}
                positions={seg.latlngs}
                pathOptions={{ color: seg.color, weight: 6, opacity: 0.7 }}
              />
            ))}
          </MapContainer>
        </div>
 
        {/* right panel (input address) */}
        <div
          className="destination-panel"
          style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <h3>Find a Route or Hotspot</h3>
          <input
            type="text"
            placeholder="Enter a destination..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddressSearch(e.target.value);
            }}
            style={{ marginBottom: "10px" }}
          />
          <button
            onClick={() => {
              const input = document.querySelector(".destination-panel input");
              if (input) handleAddressSearch(input.value);
            }}
          >
            Show Route
          </button>
          <button
            onClick={() => {
              const input = document.querySelector(".destination-panel input");
              if (input) handleShowHotspot(input.value);
            }}
          >
            Show Hotspot
          </button>
        </div>
      </div>
      <ReportForm />
      <CommunityVoting />
    </div>




  );
}
  export default App;